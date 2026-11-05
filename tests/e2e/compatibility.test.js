import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateCombo, comboFromAnswers, FORBIDDEN_PAIRS } from '../../skills/dimensions/index.js';

describe('compatibility rules', () => {
  it('exposes the expected forbidden pairs', () => {
    const pairIds = FORBIDDEN_PAIRS.map((p) => p.join(' + '));
    assert.ok(pairIds.includes('brutalist + muted-earth'));
    assert.ok(pairIds.includes('trading-terminal + handwritten-letter'));
  });

  it('rejects forbidden pair: brutalist + muted-earth', () => {
    const answers = {
      q1: { option: 'brutalist', dimension: 'typography' },
      q2: { option: 'muted-earth', dimension: 'color-logic' },
      q3: { option: 'none', dimension: 'motion' },
    };
    const combo = comboFromAnswers(answers);
    const validation = validateCombo(combo);
    assert.strictEqual(validation.ok, false);
    assert.ok(validation.conflicts.some((c) => c[0] === 'brutalist' && c[1] === 'muted-earth'));
  });

  it('rejects forbidden pair: trading-terminal + handwritten-letter', () => {
    // Both options live in the typography dimension, so comboFromAnswers
    // can never emit both at once (one option per dimension). Test the
    // validator directly with a manually-built combo containing both ids.
    const combo = {
      typography: { id: 'trading-terminal', dimension: 'typography' },
      voice: { id: 'handwritten-letter', dimension: 'voice' },
      'color-logic': { id: 'muted-earth', dimension: 'color-logic' },
      motion: { id: 'none', dimension: 'motion' },
      layout: { id: 'centered-column', dimension: 'layout' },
      wildcard: { id: 'glitch-accent', dimension: 'wildcard' },
    };
    const validation = validateCombo(combo);
    assert.strictEqual(validation.ok, false);
    assert.ok(
      validation.conflicts.some((c) => c[0] === 'trading-terminal' && c[1] === 'handwritten-letter')
    );
  });

  it('allows a compatible combo', () => {
    const answers = {
      q1: { option: 'printed-book', dimension: 'typography' },
      q2: { option: 'muted-earth', dimension: 'color-logic' },
      q3: { option: 'none', dimension: 'motion' },
    };
    const combo = comboFromAnswers(answers);
    const validation = validateCombo(combo);
    assert.strictEqual(validation.ok, true);
    assert.deepStrictEqual(validation.conflicts, []);
  });

  it('engine build throws on incompatible combo', async () => {
    // Verify validateCombo itself blocks forbidden combos (engine.build
    // throws when !validation.ok). We test the validator here; the engine
    // integration is covered by tests/e2e/build.test.js.
    const answers = {
      q1: { option: 'brutalist', dimension: 'typography' },
      q2: { option: 'muted-earth', dimension: 'color-logic' },
      q3: { option: 'none', dimension: 'motion' },
    };
    const combo = comboFromAnswers(answers);
    assert.strictEqual(validateCombo(combo).ok, false);
  });
});
