import { describe, it } from 'node:test';
import assert from 'node:assert';
import { spawnSync } from 'child_process';
import * as path from 'path';

const CLI = path.join(process.cwd(), 'taste.cli.js');
const runtime = process.execPath || 'node';

describe('CLI', () => {
  it('shows help with --help', () => {
    const result = spawnSync(runtime, [CLI, '--help'], { encoding: 'utf8' });
    assert.strictEqual(result.status, 0);
    assert.ok(result.stdout.includes('Taste - LLM point-of-view layer'));
    assert.ok(result.stdout.includes('--api-key'));
    assert.ok(result.stdout.includes('--output-dir'));
    assert.ok(result.stdout.includes('--yes'));
    assert.ok(result.stdout.includes('--preset'));
    assert.ok(result.stdout.includes('--answers'));
    assert.ok(result.stdout.includes('taste init'));
  });

  it('runs init non-interactively with --preset (no stdin prompt)', () => {
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;
    delete env.OPENROUTER_API_KEY;
    delete env.NVIDIA_API_KEY;
    delete env.OPENAI_API_KEY;
    delete env.LLM_API_KEY;
    // timeout guard: if --preset accidentally prompts on stdin, this hangs.
    const result = spawnSync(runtime, [CLI, 'init', '--yes', '--preset', 'editorial'], {
      encoding: 'utf8',
      env,
      timeout: 10000,
    });
    assert.strictEqual(result.status, 1, `expected non-zero exit, got status=${result.status} signal=${result.signal}`);
    assert.ok(result.stderr.includes('API key'), `expected API key error, got: ${result.stderr}`);
  });

  it('shows version with --version', () => {
    const result = spawnSync(runtime, [CLI, '--version'], { encoding: 'utf8' });
    assert.strictEqual(result.status, 0);
    assert.ok(result.stdout.includes('1.0.0'));
  });

  it('exits with error when no API key for init', () => {
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;
    delete env.OPENROUTER_API_KEY;
    delete env.NVIDIA_API_KEY;
    delete env.OPENAI_API_KEY;
    delete env.LLM_API_KEY;
    const result = spawnSync(runtime, [CLI, 'init', '--yes'], {
      encoding: 'utf8',
      env,
    });
    assert.strictEqual(result.status, 1);
    assert.ok(result.stderr.includes('API key'));
  });

  it('rejects a different provider key when the selected provider key is missing', () => {
    const env = { ...process.env };

    delete env.ANTHROPIC_API_KEY;
    delete env.OPENROUTER_API_KEY;
    delete env.OPENAI_API_KEY;
    delete env.LLM_API_KEY;

    // A NVIDIA key must not be used for OpenRouter.
    env.NVIDIA_API_KEY = 'nvidia-test';

    const result = spawnSync(
      'node',
      [CLI, 'init', '--yes', '--llm-provider', 'openrouter'],
      { encoding: 'utf8', env },
    );

    assert.strictEqual(result.status, 1);
    assert.ok(result.stderr.includes('OPENROUTER_API_KEY'));
    assert.ok(result.stderr.includes('LLM_API_KEY'));
    assert.ok(
      result.stderr.includes(
        'API key is required for openrouter. Set OPENROUTER_API_KEY or LLM_API_KEY, or pass --api-key.'
      )
    );
  });

  it('shows help on unknown command', () => {
    const result = spawnSync(runtime, [CLI, 'frobnicate'], { encoding: 'utf8' });
    assert.strictEqual(result.status, 1);
    assert.ok(result.stdout.includes('Taste - LLM point-of-view layer'));
  });
});
