import { createHash } from 'crypto';

// Sampling parameters for LLM calls. Balanced for variety without chaos.
// temperature: 0.7 = creative but coherent.
// top_p: 0.9 = nucleus sampling, cuts the long tail of unlikely tokens.
// top_k: 40 = hard cap on candidate tokens per step.
export const DEFAULT_SAMPLING = {
  temperature: 0.7,
  top_p: 0.9,
  top_k: 40,
  max_tokens: 2000,
};

// Derive a deterministic seed from the user's answers so the same
// answer combination always produces the same draw, while different
// combinations produce different outputs.
export function deriveSeed(answers) {
  const payload = JSON.stringify(answers, Object.keys(answers).sort());
  return createHash('sha256').update(payload).digest('hex');
}

// Build a sampling config seeded from user answers.
export function samplingConfig(answers, overrides = {}) {
  const seed = deriveSeed(answers);
  return {
    ...DEFAULT_SAMPLING,
    ...overrides,
    seed,
  };
}
