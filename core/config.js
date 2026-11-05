import { readFileSync } from 'fs';

// Default configuration values.
const DEFAULTS = {
  model: 'claude-3-5-sonnet-20241022',
  maxTokens: 2000,
  temperature: 0.7,
  retries: 3,
  timeout: 30000,
  outputDir: process.cwd(),
};

// Map environment variable names to config keys.
const ENV_MAP = {
  ANTHROPIC_API_KEY: 'apiKey',
  TASTE_MODEL: 'model',
  TASTE_MAX_TOKENS: 'maxTokens',
  TASTE_TEMPERATURE: 'temperature',
  TASTE_OUTPUT_DIR: 'outputDir',
  TASTE_RETRIES: 'retries',
  TASTE_TIMEOUT: 'timeout',
};

export class TasteConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TasteConfigError';
  }
}

// Parse numeric env var, returning undefined if invalid/missing.
function parseNumEnv(value) {
  if (value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

// Load config from taste.config.js via dynamic import.
async function loadConfigFile(configPath) {
  try {
    const mod = await import(configPath);
    return mod.default || mod;
  } catch (err) {
    if (err.code === 'ERR_MODULE_NOT_FOUND' || err.code === 'MODULE_NOT_FOUND') {
      return {};
    }
    throw new TasteConfigError(`Failed to load config from ${configPath}: ${err.message}`);
  }
}

// Resolve configuration from CLI flags > config file > env vars > defaults.
export async function loadConfig(cliFlags = {}) {
  const configPath = cliFlags.config || 'taste.config.js';
  const fileConfig = await loadConfigFile(configPath);

  const envConfig = {};
  for (const [envName, key] of Object.entries(ENV_MAP)) {
    const value = process.env[envName];
    if (value !== undefined) {
      envConfig[key] = key === 'maxTokens' || key === 'retries' || key === 'timeout' || key === 'temperature'
        ? parseNumEnv(value)
        : value;
    }
  }

  const resolved = { ...DEFAULTS };

  // Apply env vars.
  for (const [key, value] of Object.entries(envConfig)) {
    if (value !== undefined) resolved[key] = value;
  }

  // Apply config file values.
  for (const [key, value] of Object.entries(fileConfig)) {
    if (value !== undefined) resolved[key] = value;
  }

  // Apply CLI flags (highest priority).
  for (const [key, value] of Object.entries(cliFlags)) {
    if (key === 'config') continue;
    if (value !== undefined) resolved[key] = value;
  }

  // Normalize maxTokens to integer.
  if (resolved.maxTokens !== undefined) {
    resolved.maxTokens = Number(resolved.maxTokens);
  }

  return resolved;
}

// Resolve the effective API key from config (env or explicit).
export function resolveApiKey(config) {
  return config.apiKey || process.env.ANTHROPIC_API_KEY || '';
}

export default { loadConfig, resolveApiKey, TasteConfigError, DEFAULTS };
