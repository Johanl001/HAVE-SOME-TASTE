import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import { loadConfig, resolveApiKey, TasteConfigError } from '../core/config.js';

describe('config loading', () => {
  const origEnv = { ...process.env };

  const clearTasteEnv = () => {
    const keys = [
      'ANTHROPIC_API_KEY',
      'OPENROUTER_API_KEY',
      'NVIDIA_API_KEY',
      'OPENAI_API_KEY',
      'LLM_API_KEY',
      'TASTE_LLM_PROVIDER',
      'TASTE_LLM_BASE_URL',
      'TASTE_MODEL',
      'TASTE_MAX_TOKENS',
      'TASTE_TEMPERATURE',
      'TASTE_OUTPUT_DIR',
      'TASTE_RETRIES',
      'TASTE_TIMEOUT',
    ];
    for (const k of keys) {
      delete process.env[k];
    }
  };

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in origEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, origEnv);
    clearTasteEnv();
  });

  it('returns defaults when no config sources exist', async () => {
    clearTasteEnv();
    const config = await loadConfig({});
    assert.strictEqual(config.model, 'claude-3-5-sonnet-20241022');
    assert.strictEqual(config.maxTokens, 2000);
    assert.strictEqual(config.temperature, 0.7);
    assert.strictEqual(config.retries, 3);
    assert.strictEqual(config.timeout, 30000);
    assert.strictEqual(config.outputDir, process.cwd());
  });

  it('env vars override defaults', async () => {
    clearTasteEnv();
    process.env.TASTE_MODEL = 'claude-3-opus';
    process.env.TASTE_TEMPERATURE = '0.9';
    const config = await loadConfig({});
    assert.strictEqual(config.model, 'claude-3-opus');
    assert.strictEqual(config.temperature, 0.9);
  });

  it('CLI flags override env vars and defaults', async () => {
    clearTasteEnv();
    process.env.TASTE_MODEL = 'claude-3-opus';
    const config = await loadConfig({ model: 'claude-3-haiku' });
    assert.strictEqual(config.model, 'claude-3-haiku');
  });

  it('resolveApiKey returns env key', () => {
    clearTasteEnv();
    process.env.ANTHROPIC_API_KEY = 'sk-test-123';
    assert.strictEqual(resolveApiKey({}), 'sk-test-123');
  });

  it('resolveApiKey selects the key for the configured provider', () => {
  process.env = {
    NVIDIA_API_KEY: 'nvidia-test',
    OPENROUTER_API_KEY: 'openrouter-test',
    OPENAI_API_KEY: 'openai-test',
  };

  assert.strictEqual(
    resolveApiKey({ llmProvider: 'openrouter' }),
    'openrouter-test'
  );
});

  it('resolveApiKey prioritizes an explicit API key', () => {
    process.env = {
      OPENROUTER_API_KEY: 'openrouter-test',
    };

    assert.strictEqual(
      resolveApiKey({
        llmProvider: 'openrouter',
        apiKey: 'explicit-test',
      }),
      'explicit-test'
    );
  });

  it('resolveApiKey returns empty string when the provider key is missing', () => {
    process.env = {};

    assert.strictEqual(
      resolveApiKey({ llmProvider: 'openrouter' }),
      ''
    );
  });

  it('resolveApiKey returns empty string when no key', () => {
    clearTasteEnv();
    assert.strictEqual(resolveApiKey({}), '');
  });
});
