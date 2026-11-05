import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildSubtractPrompt } from '../../skills/critique/subtract.js';

describe('SubtractSkill prompt builder', () => {
  const answers = {
    q1: { option: 'printed-book', dimension: 'typography' },
    q2: { option: 'muted-earth', dimension: 'color-logic' },
    q3: { option: 'none', dimension: 'motion' },
  };

  const rawOutput = `
<div class="hero" style="background: blue; border-radius: 8px;">
  <h1>Welcome</h1>
  <p>Lorem ipsum dolor sit amet.</p>
</div>
`;

  it('buildSubtractPrompt includes answers and raw output', () => {
    const prompt = buildSubtractPrompt(answers, rawOutput);
    assert.ok(prompt.includes('printed-book'));
    assert.ok(prompt.includes('muted-earth'));
    assert.ok(prompt.includes(rawOutput));
    assert.ok(prompt.includes('SUBTRACT'));
    assert.ok(prompt.includes('Do not add new elements'));
  });

  it('buildSubtractPrompt is deterministic', () => {
    const p1 = buildSubtractPrompt(answers, rawOutput);
    const p2 = buildSubtractPrompt(answers, rawOutput);
    assert.strictEqual(p1, p2);
  });
});
