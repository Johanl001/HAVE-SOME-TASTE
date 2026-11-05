import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import { TasteEngine } from '../../core/engine.js';
import { cacheClear } from '../../core/cache.js';

// Stub LLM that returns deterministic, non-generic output based on the prompt.
class StubLLM {
  constructor() {
    this.calls = [];
  }
  async call(prompt, config) {
    this.calls.push({ prompt, config });
    return `<!-- generated seed=${config.seed} -->\n<div class="opinionated">distinct output</div>\n`;
  }
}

describe('TasteEngine build (e2e with stub LLM)', () => {
  let engine;
  let llm;

  afterEach(() => {
    cacheClear();
  });

  it('runs full flow: answers -> concept -> build -> critique', async () => {
    llm = new StubLLM();
    engine = new TasteEngine({ llm });

    const answers = {
      q1: { option: 'printed-book', dimension: 'typography', label: 'Printed book' },
      q2: { option: 'muted-earth', dimension: 'color-logic', label: 'Muted earth' },
      q3: { option: 'none', dimension: 'motion', label: 'None' },
    };

    const { concept, config } = await engine.generateConcept(answers);
    assert.ok(concept);
    assert.ok(config.seed);

    const result = await engine.build(answers, concept);
    assert.ok(result.rawOutput);
    assert.ok(result.combo);
    assert.strictEqual(result.combo.typography.id, 'printed-book');
    assert.strictEqual(result.combo['color-logic'].id, 'muted-earth');
    assert.strictEqual(result.combo.motion.id, 'none');
    assert.ok(result.critique);
    assert.ok(result.critique.revisedOutput);
    assert.strictEqual(result.config.seed, config.seed);
  });

  it('build throws on incompatible combo', async () => {
    llm = new StubLLM();
    engine = new TasteEngine({ llm });

    const answers = {
      q1: { option: 'brutalist', dimension: 'typography' },
      q2: { option: 'muted-earth', dimension: 'color-logic' },
      q3: { option: 'none', dimension: 'motion' },
    };
    await engine.generateConcept(answers);
    await assert.rejects(
      () => engine.build(answers, 'a concept'),
      /Incompatible taste dimensions/
    );
  });

  it('deterministic build: same answers -> same raw output via seed', async () => {
    llm = new StubLLM();
    engine = new TasteEngine({ llm });

    const answers = {
      q1: { option: 'editorial-magazine', dimension: 'typography' },
      q2: { option: 'monochrome', dimension: 'color-logic' },
      q3: { option: 'bounce', dimension: 'motion' },
    };
    const { concept } = await engine.generateConcept(answers);

    const r1 = await engine.build(answers, concept);
    const r2 = await engine.build(answers, concept);

    assert.strictEqual(r1.rawOutput, r2.rawOutput);
    assert.strictEqual(r1.config.seed, r2.config.seed);
  });

  it('improveExisting returns a generic report', async () => {
    llm = new StubLLM();
    engine = new TasteEngine({ llm });

    const files = [
      { path: 'src/Button.jsx', content: '.btn { background: blue; border-radius: 8px; }' },
      { path: 'src/Hero.jsx', content: '.hero { display: flex; padding: 1rem; }' },
    ];

    const { report } = await engine.improveExisting(files);
    assert.ok(report.reportId);
    assert.strictEqual(report.fileCount, 2);
    assert.ok(Array.isArray(report.genericFindings));
    assert.ok(typeof report.summary === 'string');
    assert.ok(typeof report.recommendation === 'string');
  });
});
