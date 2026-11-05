#!/usr/bin/env node
import { readFileSync } from 'fs';
import { TasteEngine } from './core/engine.js';
import { samplingConfig } from './core/sampler.js';
import { generate as generateVanilla } from './skills/adapters/vanilla.js';
import { generate as generateReact } from './skills/adapters/react.js';
import { generate as generateVue } from './skills/adapters/vue.js';
import { generate as generateSvelte } from './skills/adapters/svelte.js';

// Minimal LLM adapter interface. Users / deployers plug in their provider.
// The public repo ships this stub; the real provider is wired at runtime.
class StubLLM {
  async call(prompt, config) {
    return `[LLM STUB] Seed: ${config.seed}\nPrompt (truncated): ${prompt.slice(0, 200)}...\n\n---\nGenerated output would appear here. Wire a real LLM provider to TasteEngine.\n`;
  }
}

const ADAPTERS = {
  vanilla: generateVanilla,
  react: generateReact,
  vue: generateVue,
  svelte: generateSvelte,
};

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

async function runInit(cwd) {
  const engine = new TasteEngine({ llm: new StubLLM() });
  const answers = await engine.runQuestions();
  const { concept, config } = await engine.generateConcept(answers);

  console.log('\n=== Taste Concept ===');
  console.log(concept);
  console.log(`\nSeed: ${config.seed}`);
  console.log('Stack:', detectStack(cwd));
  console.log('\nConfirm concept? (y/n): ');

  process.stdin.once('data', async (chunk) => {
    const confirm = chunk.toString().trim().toLowerCase();
    if (confirm === 'y' || confirm === 'yes') {
      const result = await engine.build(answers, concept);
      const stack = detectStack(cwd);
      const generate = ADAPTERS[stack] || ADAPTERS.vanilla;
      const { files } = generate({ combo: result.combo, concept });

      console.log('\n=== Build Result ===');
      files.forEach((f) => {
        console.log(`\n--- ${f.path} ---`);
        console.log(f.content);
      });
      console.log('\n=== Critique & Subtract ===');
      console.log(result.critique.revisedOutput || result.critique);
    } else {
      console.log('Concept rejected. Re-run `taste init` to try again.');
    }
    process.exit(0);
  });
}

async function runCritique(cwd) {
  const engine = new TasteEngine({ llm: new StubLLM() });
  const fs = await import('fs');
  const path = await import('path');

  // Read project files (compressed in engine.improveExisting).
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
  process.exit(0);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const cwd = process.cwd();

  if (command === 'init') {
    await runInit(cwd);
  } else if (command === 'critique') {
    await runCritique(cwd);
  } else if (command === 'build') {
    console.log('build: use `taste init` to start the question flow.');
    process.exit(0);
  } else {
    console.log(`
Taste - LLM point-of-view layer

Usage:
  taste init      Run the 3-question taste flow and generate a concept + build
  taste critique  Audit an existing project for generic design markers

Drop taste.cli.js into your project and run: node taste.cli.js init
`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Taste error:', err.message);
  process.exit(1);
});
