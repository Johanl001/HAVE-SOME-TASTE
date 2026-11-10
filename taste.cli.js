#!/usr/bin/env node
import { readFileSync } from 'fs';
import { createInterface } from 'readline';
import { TasteEngine } from './core/engine.js';
import { AnthropicLLM } from './core/llm/anthropic.js';
import { OpenAILLM } from './core/llm/openai.js';
import { loadConfig, resolveApiKey, TasteConfigError } from './core/config.js';
import { writeFiles, FileConflictError } from './core/writer.js';
import { generate as generateVanilla } from './skills/adapters/vanilla.js';
import { generate as generateReact } from './skills/adapters/react.js';
import { generate as generateVue } from './skills/adapters/vue.js';
import { generate as generateSvelte } from './skills/adapters/svelte.js';

const VERSION = '1.0.0';

const ADAPTERS = {
  vanilla: generateVanilla,
  react: generateReact,
  vue: generateVue,
  svelte: generateSvelte,
};

const SHORT_FLAG_MAP = {
  k: 'apiKey',
  m: 'model',
  o: 'outputDir',
  f: 'force',
  v: 'verbose',
  y: 'yes',
  h: 'help',
  p: 'llmProvider',
  u: 'llmBaseUrl',
};

// Parse argv into flags and positionals.
function parseArgs(argv) {
  const flags = {};
  const positionals = [];
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === '--') {
      positionals.push(...argv.slice(i + 1));
      break;
    }
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx !== -1) {
        flags[arg.slice(2, eqIdx)] = arg.slice(eqIdx + 1);
      } else {
        const key = arg.slice(2);
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith('-')) {
          flags[key] = next;
          i++;
        } else {
          flags[key] = true;
        }
      }
    } else if (arg.startsWith('-') && arg.length > 1) {
      const chars = arg.slice(1);
      for (let j = 0; j < chars.length; j++) {
        const key = chars[j];
        if (j === chars.length - 1) {
          const next = argv[i + 1];
          if (next !== undefined && !next.startsWith('-')) {
            flags[key] = next;
            i++;
          } else {
            flags[key] = true;
          }
        } else {
          // -kvalue style: consume rest as value
          flags[key] = chars.slice(j + 1);
          j = chars.length;
        }
      }
    } else {
      positionals.push(arg);
    }
    i++;
  }
  return { flags, positionals };
}

function normalizeFlags(flags) {
  const normalized = {};
  for (const [key, value] of Object.entries(flags)) {
    const mapped = SHORT_FLAG_MAP[key] || key;
    normalized[mapped] = value;
  }
  return normalized;
}

function detectStack(cwd) {
  try {
    const pkg = JSON.parse(readFileSync(`${cwd}/package.json`, 'utf8'));
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    if (deps.react) return 'react';
    if (deps.vue) return 'vue';
    if (deps.svelte) return 'svelte';
    return 'vanilla';
  } catch {
    return 'vanilla';
  }
}

function askConfirm(prompt) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`${prompt} (y/n): `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
    });
  });
}

function log(...args) {
  if (process.env.TASTE_VERBOSE) {
    console.error('[taste]', ...args);
  }
}

// Instantiate the right LLM adapter based on the configured provider.
// Anthropic -> AnthropicLLM (Anthropic Messages API)
// anything else (openai, nvidia, openrouter, ...) -> OpenAILLM (OpenAI-compatible API)
function createLLM(config) {
  const provider = config.llmProvider || 'anthropic';
  const apiKey = resolveApiKey(config, provider);

  if (!apiKey) {
    if (provider === 'anthropic') {
      throw new TasteConfigError(
        'Anthropic API key is required. Set ANTHROPIC_API_KEY or pass --api-key.',
      );
    }
    throw new TasteConfigError(
      `API key is required for ${provider}. Set NVIDIA_API_KEY, OPENROUTER_API_KEY, OPENAI_API_KEY, or LLM_API_KEY, or pass --api-key.`,
    );
  }

  const llmConfig = {
    apiKey,
    model: config.model,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
    retries: config.retries,
    timeout: config.timeout,
  };

  if (provider === 'anthropic') {
    return new AnthropicLLM(llmConfig);
  }

  return new OpenAILLM({ ...llmConfig, baseUrl: config.llmBaseUrl, provider });
}

async function runInit(cwd, flags) {
  const config = await loadConfig(flags);

  const engine = new TasteEngine({
    llm: createLLM(config),
    config,
  });

  log('Running question flow...');
  const answers = await engine.runQuestions();

  log('Generating concept...');
  const { concept, config: samplingConfig } = await engine.generateConcept(answers);

  console.log('\n=== Taste Concept ===');
  console.log(concept);
  console.log(`\nSeed: ${samplingConfig.seed}`);
  console.log('Stack:', detectStack(cwd));

  let confirmed = flags.yes === true;
  if (!confirmed) {
    console.log('\nConfirm concept? (y/n): ');
    confirmed = await askConfirm('Confirm concept');
  }

  if (!confirmed) {
    console.log('Concept rejected. Re-run `taste init` to try again.');
    process.exit(0);
  }

  log('Building output...');
  const result = await engine.build(answers, concept);

  const stack = detectStack(cwd);
  const generate = ADAPTERS[stack] || ADAPTERS.vanilla;
  const { files: adapterFiles } = generate({ combo: result.combo, concept });

  const outputDir = config.outputDir;
  const allFiles = [
    ...adapterFiles,
    { path: 'taste-concept.json', content: JSON.stringify(
      { answers, concept, config, seed: samplingConfig.seed },
      null,
      2,
    ) },
  ];

  log(`Writing ${allFiles.length} file(s) to ${outputDir}...`);
  const written = writeFiles(allFiles, { outputDir, force: flags.force === true });

  console.log('\n=== Build Complete ===');
  written.forEach((f) => {
    const rel = f.replace(outputDir, '').replace(/^\//, '');
    console.log(`  ${rel}`);
  });
  console.log(`\nOutput directory: ${outputDir}`);
  console.log('Run `taste critique` to audit an existing project for generic design markers.');
}

async function runCritique(cwd, flags) {
  const config = await loadConfig(flags);
  const engine = new TasteEngine({ llm: null, config }); // critique doesn't need LLM

  const fs = await import('fs');
  const path = await import('path');

  const files = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') walk(full);
      } else if (entry.name.match(/\.(js|jsx|ts|tsx|html|css|vue|svelte)$/)) {
        files.push({ path: full, content: fs.readFileSync(full, 'utf8') });
      }
    }
  }
  walk(cwd);

  const { report } = await engine.improveExisting(files);

  console.log('\n=== Taste Generic Report ===');
  console.log(`Report ID: ${report.reportId}`);
  console.log(`Files scanned: ${report.fileCount}`);
  console.log(`Summary: ${report.summary}`);
  console.log(`Recommendation: ${report.recommendation}`);
  if (report.genericFindings.length > 0) {
    console.log('Generic findings:');
    report.genericFindings.forEach((f) => console.log(`  - ${f}`));
  }

  const outputDir = config.outputDir;
  const reportPath = path.join(outputDir, 'taste-report.json');
  writeFiles([{ path: 'taste-report.json', content: JSON.stringify(report, null, 2) }], {
    outputDir,
    force: flags.force === true,
  });
  console.log(`\nReport written to: ${reportPath}`);
}

async function runBuild(cwd, flags) {
  const config = await loadConfig(flags);

  const conceptPath = flags.concept || 'taste-concept.json';
  const engine = new TasteEngine({
    llm: createLLM(config),
    config,
  });

  const { answers, concept, config: savedConfig } = engine.loadConcept(conceptPath);
  log(`Loaded concept from ${conceptPath}`);

  const result = await engine.build(answers, concept);

  const stack = detectStack(cwd);
  const generate = ADAPTERS[stack] || ADAPTERS.vanilla;
  const { files: adapterFiles } = generate({ combo: result.combo, concept });

  const outputDir = config.outputDir;
  log(`Writing ${adapterFiles.length} file(s) to ${outputDir}...`);
  const written = writeFiles(adapterFiles, { outputDir, force: flags.force === true });

  console.log('\n=== Build Complete ===');
  written.forEach((f) => {
    const rel = f.replace(outputDir, '').replace(/^\//, '');
    console.log(`  ${rel}`);
  });
  console.log(`\nOutput directory: ${outputDir}`);
}

function showHelp() {
  console.log(`
Taste - LLM point-of-view layer v${VERSION}

Usage:
  taste init [options]      Run the 3-question taste flow and generate a concept + build
  taste critique [options]  Audit an existing project for generic design markers
  taste build [options]     Build from a saved concept file

Options:
  --api-key, -k <key>   LLM API key (or set ANTHROPIC_API_KEY / NVIDIA_API_KEY / OPENROUTER_API_KEY / OPENAI_API_KEY / LLM_API_KEY)
  --model, -m <name>    Model name (default: claude-3-5-sonnet-20241022 for anthropic, gpt-4o-mini for openai-compatible)
  --llm-provider, -p  LLM provider: anthropic, openai, nvidia, openrouter (default: anthropic)
  --llm-base-url, -u  Custom base URL for OpenAI-compatible providers
  --max-tokens <n>      Max output tokens (default: 2000)
  --temperature <n>     Sampling temperature 0-1 (default: 0.7)
  --output-dir, -o <dir>  Output directory (default: current directory)
  --force, -f           Overwrite existing files without prompting
  --yes, -y             Auto-confirm concept (non-interactive)
  --config <path>       Path to taste.config.js
  --verbose, -v         Enable debug logging
  --help, -h            Show this help
  --version             Show version

Examples:
  taste init
  taste init --yes --output-dir ./dist
  taste critique --output-dir ./reports
  taste build --concept taste-concept.json --output-dir ./dist

Config file:
  Create taste.config.js in your project root to set defaults:
    export default {
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.7,
      outputDir: './dist',
    };

Environment variables:
  ANTHROPIC_API_KEY, NVIDIA_API_KEY, OPENROUTER_API_KEY, OPENAI_API_KEY, LLM_API_KEY,
  TASTE_LLM_PROVIDER, TASTE_LLM_BASE_URL, TASTE_MODEL, TASTE_MAX_TOKENS,
  TASTE_TEMPERATURE, TASTE_OUTPUT_DIR, TASTE_RETRIES, TASTE_TIMEOUT

Drop taste.cli.js into your project and run: node taste.cli.js init
`);
}

async function main() {
  const argv = process.argv.slice(2);
  const { flags, positionals } = parseArgs(argv);
  const normalized = normalizeFlags(flags);
  const cwd = process.cwd();

  if (normalized.help === true || normalized.h === true) {
    showHelp();
    process.exit(0);
  }

  if (normalized.version === true) {
    console.log(VERSION);
    process.exit(0);
  }

  const command = positionals[0] || normalized._;

  try {
    if (command === 'init') {
      await runInit(cwd, normalized);
    } else if (command === 'critique') {
      await runCritique(cwd, normalized);
    } else if (command === 'build') {
      await runBuild(cwd, normalized);
    } else {
      showHelp();
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    if (
      err.name === 'TasteConfigError' ||
      err.name === 'AnthropicLLMError' ||
      err.name === 'OpenAILLMError' ||
      err.name === 'FileConflictError'
    ) {
      console.error(`Taste error: ${err.message}`);
    } else {
      console.error(`Taste error: ${err.message}`);
      if (normalized.verbose === true) {
        console.error(err.stack);
      }
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Taste error: ${err.message}`);
  process.exit(1);
});
