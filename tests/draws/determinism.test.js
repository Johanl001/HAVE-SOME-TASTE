import { describe, it } from 'node:test';
import assert from 'node:assert';
import { deriveSeed, samplingConfig, DEFAULT_SAMPLING } from '../../core/sampler.js';
import {
  comboFromAnswers,
  validateCombo,
  FORBIDDEN_PAIRS,
  getOption,
} from '../../skills/dimensions/index.js';

describe('determinism & diversity', () => {
  const answersA = {
    q1: { option: 'printed-book', dimension: 'typography', label: 'Printed book' },
    q2: { option: 'muted-earth', dimension: 'color-logic', label: 'Muted earth' },
    q3: { option: 'none', dimension: 'motion', label: 'None' },
  };

  const answersB = {
    q1: { option: 'trading-terminal', dimension: 'typography', label: 'Trading terminal' },
    q2: { option: 'monochrome', dimension: 'color-logic', label: 'Monochrome' },
    q3: { option: 'bounce', dimension: 'motion', label: 'Bounce' },
  };

  it('deriveSeed is deterministic: same answers -> same seed', () => {
    const s1 = deriveSeed(answersA);
    const s2 = deriveSeed(answersA);
    assert.strictEqual(s1, s2);
    assert.match(s1, /^[0-9a-f]{64}$/);
  });

  it('deriveSeed produces different seeds for different answers', () => {
    assert.notStrictEqual(deriveSeed(answersA), deriveSeed(answersB));
  });

  it('samplingConfig returns deterministic config with seed', () => {
    const c1 = samplingConfig(answersA);
    const c2 = samplingConfig(answersA);
    assert.deepStrictEqual(c1, c2);
    assert.strictEqual(c1.seed, deriveSeed(answersA));
    assert.strictEqual(c1.temperature, DEFAULT_SAMPLING.temperature);
    assert.strictEqual(c1.top_p, DEFAULT_SAMPLING.top_p);
    assert.strictEqual(c1.top_k, DEFAULT_SAMPLING.top_k);
    assert.strictEqual(c1.max_tokens, DEFAULT_SAMPLING.max_tokens);
  });

  it('comboFromAnswers is deterministic: same answers -> same combo', () => {
    const c1 = comboFromAnswers(answersA);
    const c2 = comboFromAnswers(answersA);
    assert.deepStrictEqual(c1, c2);
    assert.strictEqual(c1.typography.id, 'printed-book');
    assert.strictEqual(c1['color-logic'].id, 'muted-earth');
    assert.strictEqual(c1.motion.id, 'none');
  });

  it('comboFromAnswers differs across answer combinations', () => {
    const c1 = comboFromAnswers(answersA);
    const c2 = comboFromAnswers(answersB);
    assert.notStrictEqual(c1.typography.id, c2.typography.id);
  });

  it('comboFromAnswers fills defaults for layout and voice', () => {
    const c = comboFromAnswers(answersA);
    assert.ok(c.layout);
    assert.ok(c.voice);
    assert.ok(c.wildcard);
  });
});
