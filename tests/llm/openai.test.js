import { describe, it } from 'node:test';
import assert from 'node:assert';
import { OpenAILLM, OpenAILLMError } from '../../core/llm/openai.js';

const origFetch = globalThis.fetch;

function restoreFetch() {
  globalThis.fetch = origFetch;
}

describe('OpenAILLM', () => {
  it('throws when no API key provided', () => {
    restoreFetch();
    assert.throws(() => new OpenAILLM({}), OpenAILLMError);
  });

  it('sends correct request shape with integer seed', async () => {
    let capturedBody = null;
    let capturedHeaders = null;
    let capturedUrl = null;
    globalThis.fetch = async (url, opts) => {
      capturedUrl = url;
      capturedHeaders = opts.headers;
      capturedBody = JSON.parse(opts.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
      };
    };
    try {
      const llm = new OpenAILLM({
        apiKey: 'sk-test',
        model: 'gpt-4o-mini',
        maxTokens: 500,
        temperature: 0.5,
      });
      await llm.call('test prompt', { numericSeed: 12345 });
      assert.strictEqual(capturedHeaders.Authorization, 'Bearer sk-test');
      assert.strictEqual(capturedBody.model, 'gpt-4o-mini');
      assert.strictEqual(capturedBody.max_tokens, 500);
      assert.strictEqual(capturedBody.temperature, 0.5);
      assert.strictEqual(capturedBody.messages[0].content, 'test prompt');
      // OpenAI requires a 32-bit integer seed, not a hex string.
      assert.strictEqual(capturedBody.seed, 12345);
      assert.ok(Number.isInteger(capturedBody.seed));
      assert.ok(capturedUrl.includes('/chat/completions'));
    } finally {
      restoreFetch();
    }
  });

  it('retries on 429 rate limit then succeeds', async () => {
    let attempts = 0;
    globalThis.fetch = async () => {
      attempts++;
      if (attempts < 3) {
        return { ok: false, status: 429, statusText: 'rate limited', text: async () => '' };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: 'success' } }] }),
      };
    };
    try {
      const llm = new OpenAILLM({ apiKey: 'sk-test', retries: 3, sleep: async () => {} });
      const result = await llm.call('prompt');
      assert.strictEqual(result, 'success');
      assert.strictEqual(attempts, 3);
    } finally {
      restoreFetch();
    }
  });

  it('throws on 401 unauthorized', async () => {
    globalThis.fetch = async () => ({
      ok: false,
      status: 401,
      statusText: 'unauthorized',
      text: async () => 'invalid api key',
    });
    try {
      const llm = new OpenAILLM({ apiKey: 'sk-bad' });
      await assert.rejects(
        llm.call('prompt'),
        (err) => err instanceof OpenAILLMError && err.status === 401,
      );
    } finally {
      restoreFetch();
    }
  });

  it('supports custom llmBaseUrl for alternative providers', async () => {
    let capturedUrl = null;
    globalThis.fetch = async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
      };
    };
    try {
      const llm = new OpenAILLM({
        apiKey: 'sk-test',
        provider: 'openrouter',
        llmBaseUrl: 'https://openrouter.ai/api/v1',
      });
      await llm.call('prompt');
      assert.ok(
        capturedUrl.startsWith('https://openrouter.ai/api/v1/chat/completions'),
        `unexpected url: ${capturedUrl}`,
      );
    } finally {
      restoreFetch();
    }
  });
});
