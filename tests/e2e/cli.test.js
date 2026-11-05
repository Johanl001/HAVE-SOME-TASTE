import { describe, it } from 'node:test';
import assert from 'node:assert';
import { spawnSync } from 'child_process';
import * as path from 'path';

const CLI = path.join(process.cwd(), 'taste.cli.js');

describe('CLI', () => {
  it('shows help with --help', () => {
    const result = spawnSync('node', [CLI, '--help'], { encoding: 'utf8' });
    assert.strictEqual(result.status, 0);
    assert.ok(result.stdout.includes('Taste - LLM point-of-view layer'));
    assert.ok(result.stdout.includes('--api-key'));
    assert.ok(result.stdout.includes('--output-dir'));
    assert.ok(result.stdout.includes('--yes'));
    assert.ok(result.stdout.includes('taste init'));
  });

  it('shows version with --version', () => {
    const result = spawnSync('node', [CLI, '--version'], { encoding: 'utf8' });
    assert.strictEqual(result.status, 0);
    assert.ok(result.stdout.includes('1.0.0'));
  });

  it('exits with error when no API key for init', () => {
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;
    const result = spawnSync('node', [CLI, 'init', '--yes'], {
      encoding: 'utf8',
      env,
    });
    assert.strictEqual(result.status, 1);
    assert.ok(result.stderr.includes('API key'));
  });

  it('shows help on unknown command', () => {
    const result = spawnSync('node', [CLI, 'frobnicate'], { encoding: 'utf8' });
    assert.strictEqual(result.status, 1);
    assert.ok(result.stdout.includes('Taste - LLM point-of-view layer'));
  });
});
