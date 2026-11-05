// Anthropic Claude LLM adapter.
//
// Implements the `call(prompt, config): Promise<string>` interface consumed
// by TasteEngine. Calls the Anthropic Messages API via native fetch (no
// extra npm dependency). Supports retries, timeouts, and API key validation.

const API_BASE = 'https://api.anthropic.com/v1';
const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';
const DEFAULT_MAX_TOKENS = 2000;
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 3;

export class AnthropicLLMError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'AnthropicLLMError';
    this.status = status;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class AnthropicLLM {
  constructor({ apiKey, model, maxTokens, temperature, retries, timeout } = {}) {
    if (!apiKey) {
      throw new AnthropicLLMError(
        'Anthropic API key is required. Set ANTHROPIC_API_KEY or pass --api-key.',
      );
    }
    this.apiKey = apiKey;
    this.model = model || DEFAULT_MODEL;
    this.maxTokens = maxTokens !== undefined ? maxTokens : DEFAULT_MAX_TOKENS;
    this.temperature = temperature !== undefined ? temperature : DEFAULT_TEMPERATURE;
    this.retries = retries !== undefined ? retries : MAX_RETRIES;
    this.timeout = timeout !== undefined ? timeout : DEFAULT_TIMEOUT;
  }

  async call(prompt, config = {}) {
    return this._callWithRetries(prompt, config, 0);
  }

  async _callWithRetries(prompt, config, attempt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model || this.model,
          max_tokens: config.maxTokens ?? this.maxTokens,
          temperature: config.temperature ?? this.temperature,
          system: config.system || 'You are a design engineer with a strong point of view.',
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        if ((response.status === 429 || response.status >= 500) && attempt < this.retries) {
          const delay = Math.min(1000 * 2 ** attempt, 10000);
          await sleep(delay);
          return this._callWithRetries(prompt, config, attempt + 1);
        }
        throw new AnthropicLLMError(
          `Anthropic API error (${response.status}): ${body || response.statusText}`,
          response.status,
        );
      }

      const data = await response.json();
      const contentBlocks = data.content || [];
      const text = contentBlocks
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('');

      if (!text) {
        throw new AnthropicLLMError('Anthropic returned empty response.', 200);
      }

      return text;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        throw new AnthropicLLMError(
          `Anthropic API request timed out after ${this.timeout}ms.`,
          408,
        );
      }

      if (err instanceof AnthropicLLMError) {
        throw err;
      }

      // Network or unexpected error — retry if attempts remain.
      if (attempt < this.retries) {
        const delay = Math.min(1000 * 2 ** attempt, 10000);
        await sleep(delay);
        return this._callWithRetries(prompt, config, attempt + 1);
      }

      throw new AnthropicLLMError(`Anthropic API request failed: ${err.message}`, 0);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export default AnthropicLLM;
