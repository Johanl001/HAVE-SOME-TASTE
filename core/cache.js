import { createHash } from 'crypto';

// Prompt caching layer for Anthropic Claude.
//
// The static, token-heavy prefix (dimensions deck + design traditions +
// skill definitions) is cached once. Each call appends a variable suffix
// (user answers + project context + brief). Repeat draws hit the cache
// and skip re-sending the prefix, cutting cost and latency.
//
// All functions are pure where possible so they're testable without an LLM.

// In-memory cache store: key -> { value, hits, size, createdAt }
const cache = new Map();

// Stats for hit-rate reporting.
let totalLookups = 0;
let totalHits = 0;

// Hash any serializable input to a stable cache key.
export function hashInput(input) {
  const payload = typeof input === 'string' ? input : JSON.stringify(input);
  return createHash('sha256').update(payload).digest('hex');
}

// Store a cached prefix value. Returns the cache key.
export function cacheSet(key, value) {
  const size = Buffer.byteLength(JSON.stringify(value), 'utf8');
  cache.set(key, {
    value,
    hits: 0,
    size,
    createdAt: Date.now(),
  });
  return key;
}

// Retrieve a cached value, incrementing hit counter. Returns undefined on miss.
export function cacheGet(key) {
  totalLookups += 1;
  const entry = cache.get(key);
  if (!entry) return undefined;
  entry.hits += 1;
  totalHits += 1;
  return entry.value;
}

// Check whether a key is present without incrementing counters.
export function cacheHas(key) {
  return cache.has(key);
}

// Get current cache stats: { lookups, hits, missRate, hitRate, entries, totalSize }.
export function cacheStats() {
  const entries = [...cache.values()];
  const totalSize = entries.reduce((sum, e) => sum + e.size, 0);
  return {
    lookups: totalLookups,
    hits: totalHits,
    misses: totalLookups - totalHits,
    hitRate: totalLookups ? totalHits / totalLookups : 0,
    missRate: totalLookups ? (totalLookups - totalHits) / totalLookups : 0,
    entries: cache.size,
    totalSize,
  };
}

// Clear the cache and reset stats.
export function cacheClear() {
  cache.clear();
  totalLookups = 0;
  totalHits = 0;
}

// Build a cache key for a static prefix (e.g. dimensions deck + traditions).
export function prefixKey(prefix) {
  return `prefix:${hashInput(prefix)}`;
}

// Compress project context for improve-existing mode: keep only
// design-relevant signals (classes, color tokens, layout, spacing).
export function compressContext(content) {
  const lines = content.split('\n');
  const relevant = lines.filter((line) => {
    const l = line.trim();
    return (
      l.startsWith('.') ||
      l.includes('className') ||
      l.includes('class=') ||
      l.includes('color:') ||
      l.includes('background:') ||
      l.includes('font-') ||
      l.includes('grid') ||
      l.includes('flex') ||
      l.includes('padding') ||
      l.includes('margin') ||
      l.includes('--')
    );
  });
  return relevant.slice(0, 40).join('\n');
}

// Compress an array of { path, content } files into a single context string.
export function compressFiles(files) {
  return files
    .map((f) => `## ${f.path}\n${compressContext(f.content)}`)
    .join('\n\n');
}

export default {
  cacheSet,
  cacheGet,
  cacheHas,
  cacheStats,
  cacheClear,
  cacheClear: cacheClear,
  hashInput,
  prefixKey,
  compressContext,
  compressFiles,
};
