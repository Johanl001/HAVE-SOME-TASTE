import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildSubtractPrompt, SubtractSkill } from '../../skills/critique/subtract.js';

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

describe('SubtractSkill.run', () => {
  const answers = {
    q1: { option: 'printed-book', dimension: 'typography' },
    q2: { option: 'muted-earth', dimension: 'color-logic' },
    q3: { option: 'none', dimension: 'motion' },
  };

  function mockLlm(response) {
    return { call: async () => response };
  }

  it('parses removed and simplified items from LLM response', async () => {
    const response = `
Removed:
- Remove the generic hero section

Simplified:
- Simplify the navigation to a single link

Revised Output:
<div class="card">
  <h1>Opinionated Design</h1>
</div>
`;
    const skill = new SubtractSkill({ llm: mockLlm(response) });
    const result = await skill.run({ rawOutput: '<div>original</div>', answers });

    assert.deepStrictEqual(result.removed, ['Remove the generic hero section']);
    assert.deepStrictEqual(result.simplified, ['Simplify the navigation to a single link']);
    assert.strictEqual(result.revisedOutput, response);
  });

  it('parses numbered list items under section headings', async () => {
    const response = `
Removed:
1. Rounded corners on everything
2. Generic blue buttons

Simplified:
1. Hero section to a simple header
`;
    const skill = new SubtractSkill({ llm: mockLlm(response) });
    const result = await skill.run({ rawOutput: '<div>original</div>', answers });

    assert.deepStrictEqual(result.removed, [
      'Rounded corners on everything',
      'Generic blue buttons',
    ]);
    assert.deepStrictEqual(result.simplified, ['Hero section to a simple header']);
  });

  it('returns empty lists when LLM response has no subtract list', async () => {
    const skill = new SubtractSkill({ llm: mockLlm('<div>just some output</div>') });
    const result = await skill.run({ rawOutput: '<div>original</div>', answers });

    assert.deepStrictEqual(result.removed, []);
    assert.deepStrictEqual(result.simplified, []);
    assert.strictEqual(result.revisedOutput, '<div>just some output</div>');
  });
});
