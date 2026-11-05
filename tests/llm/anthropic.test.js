import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AnthropicLLM, AnthropicLLMError } from '../../core/llm/anthropic.js';

const origEnv = process.env.ANTHROPIC_API_KEY;
const origFetch = globalThis.fetch;

describe('AnthropicLLM', () => {
  it('throws when no API key provided', () => {
    delete process.env.ANTHROPIC_API_KEY;
    assert.throws(() => new AnthropicLLM({}), AnthropicLLMError);
  });

  it('accepts API key from constructor', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ content: [{ type: 'text', text: 'Hello' }] }),
    });
    try {
      const llm = new AnthropicLLM({ apiKey: 'sk-test' });
      const result = await llm.call('prompt');
      assert.strictEqual(result, 'Hello');
    } finally {
      globalThis.fetch = origFetch;
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  it('sends correct request shape', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    let capturedBody = null;
    let capturedHeaders = null;
    globalThis.fetch = async (url, opts) => {
      capturedBody = JSON.parse(opts.body);
      capturedHeaders = opts.headers;
      return {
        ok: true,
        status: 200,
        json: async () => ({ content: [{ type: 'text', text: 'ok' }] }),
      };
    };
    try {
      const llm = new AnthropicLLM({
        apiKey: 'sk-test',
        model: 'claude-3-haiku',
        maxTokens: 500,
        temperature: 0.5,
      });
      await llm.call('test prompt');
      assert.strictEqual(capturedHeaders['x-api-key'], 'sk-test');
      assert.strictEqual(capturedHeaders['anthropic-version'], '2023-06-01');
      assert.strictEqual(capturedBody.model, 'claude-3-haiku');
      assert.strictEqual(capturedBody.max_tokens, 500);
      assert.strictEqual(capturedBody.temperature, 0.5);
      assert.strictEqual(capturedBody.messages[0].content, 'test prompt');
    } finally {
      globalThis.fetch = origFetch;
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  it('retries on 429 rate limit then succeeds', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    let attempts = 0;
    globalThis.fetch = async () => {
      attempts++;
      if (attempts < 3) {
        return { ok: false, status: 429, statusText: 'rate limited', text: async () => '' };
      }
      return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: 'success' }] }) };
    };
    try {
      const llm = new AnthropicLLM({ apiKey: 'sk-test', retries: 3 });
      // Patch sleep to be instant for fast test.
      const origSleep = AnthropicLLM.prototype.sleep;
      AnthropicLLM.prototype.sleep = async () => {};
      try {
        const result = await llm.call('prompt');
        assert.strictEqual(result, 'success');
        assert.strictEqual(attempts, 3);
      } finally {
        AnthropicLLM.prototype.sleep = origSleep;
      }
    } finally {
      globalThis.fetch = origFetch;
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  it('throws on 401 unauthorized', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    globalThis.fetch = async () => ({
      ok: false,
      status: 401,
      statusText: 'unauthorized',
      text: async () => 'invalid api key',
    });
    try {
      const llm = new AnthropicLLM({ apiKey: 'sk-bad' });
      await assert.rejects(
        llm.call('prompt'),
        (err) => err instanceof AnthropicLLMError && err.status === 401,
      );
    } finally {
      globalThis.fetch = origFetch;
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  it('parses multiple content blocks', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        content: [
          { type: 'text', text: 'Hello ' },
          { type: 'text', text: 'World' },
        ],
      }),
    });
    try {
      const llm = new AnthropicLLM({ apiKey: 'sk-test' });
      const result = await llm.call('prompt');
      assert.strictEqual(result, 'Hello World');
    } finally {
      globalThis.fetch = origFetch;
      delete process.env.ANTHROPIC_API_KEY;
    }
  });
});
