// OpenAI-compatible LLM adapter.
// Works with any provider exposing the OpenAI chat/completions API:
// OpenAI, NVIDIA NIM, OpenRouter, Together, Groq, etc.
//
// Implements the `call(prompt, config): Promise<string>` interface consumed
// by TasteEngine. Uses native fetch (no extra npm dependency).

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_MAX_TOKENS = 2000;
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 3;

// Provider default base URLs.
const PROVIDER_BASE_URLS = {
  nvidia: 'https://integrate.api.nvidia.com/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  openai: 'https://api.openai.com/v1',
};

export class OpenAILLMError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'OpenAILLMError';
    this.status = status;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class OpenAILLM {
  constructor({
    apiKey,
    model,
    maxTokens,
    temperature,
    retries,
    timeout,
    baseUrl,
    provider,
  } = {}) {
    if (!apiKey) {
      throw new OpenAILLMError(
        'API key is required. Set NVIDIA_API_KEY, OPENROUTER_API_KEY, OPENAI_API_KEY, or pass --api-key.',
      );
    }
    this.apiKey = apiKey;
    this.provider = provider || 'openai';
    this.model = model || DEFAULT_MODEL;
    this.baseUrl = baseUrl || PROVIDER_BASE_URLS[this.provider] || DEFAULT_BASE_URL;
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
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || this.model,
          max_tokens: config.maxTokens ?? this.maxTokens,
          temperature: config.temperature ?? this.temperature,
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
        throw new OpenAILLMError(
          `${this.provider} API error (${response.status}): ${body || response.statusText}`,
          response.status,
        );
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const text = choice?.message?.content || '';

      if (!text) {
        throw new OpenAILLMError(`${this.provider} returned empty response.`, 200);
      }

      return text;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        throw new OpenAILLMError(
          `${this.provider} API request timed out after ${this.timeout}ms.`,
          408,
        );
      }

      if (err instanceof OpenAILLMError) {
        throw err;
      }

      if (attempt < this.retries) {
        const delay = Math.min(1000 * 2 ** attempt, 10000);
        await sleep(delay);
        return this._callWithRetries(prompt, config, attempt + 1);
      }

      throw new OpenAILLMError(`${this.provider} API request failed: ${err.message}`, 0);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export default OpenAILLM;
