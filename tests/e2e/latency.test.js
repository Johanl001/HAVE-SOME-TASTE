import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import { TasteEngine } from '../../core/engine.js';
import { cacheClear, cacheStats } from '../../core/cache.js';

class StubLLM {
  constructor() {
    this.calls = 0;
  }
  async call(prompt, config) {
    this.calls += 1;
    // Simulate a small LLM latency.
    await new Promise((r) => setTimeout(r, 10));
    return `<!-- seed=${config.seed} -->\n<div class="opinionated">distinct output</div>\n`;
  }
}

describe('latency / performance harness', () => {
  afterEach(() => {
    cacheClear();
  });

  it('end-to-end draw completes well under the 25s target', async () => {
    const engine = new TasteEngine({ llm: new StubLLM() });

    const answers = {
      q1: { option: 'printed-book', dimension: 'typography', label: 'Printed book' },
      q2: { option: 'muted-earth', dimension: 'color-logic', label: 'Muted earth' },
      q3: { option: 'none', dimension: 'motion', label: 'None' },
    };

    const start = Date.now();
    const { concept } = await engine.generateConcept(answers);
    await engine.build(answers, concept);
    const elapsedMs = Date.now() - start;

    const elapsedSec = elapsedMs / 1000;
    // Target from spec: end-to-end < 25s per draw. With a stub LLM this
    // should be a small fraction of that; assert a generous bound.
    assert.ok(elapsedSec < 25, `end-to-end took ${elapsedSec.toFixed(3)}s, expected < 25s`);
  });

  it('repeat draw hits cache (LLM not reinvoked, hit counter increments)', async () => {
    const llm = new StubLLM();
    const engine = new TasteEngine({ llm });
    const answers = {
      q1: { option: 'editorial-magazine', dimension: 'typography' },
      q2: { option: 'monochrome', dimension: 'color-logic' },
      q3: { option: 'bounce', dimension: 'motion' },
    };

    const { concept } = await engine.generateConcept(answers);

    // First build: cache miss, LLM is invoked.
    await engine.build(answers, concept);
    const callsAfterFirstBuild = llm.calls;

    // Second build with the same answers + concept: cache hit, LLM must not
    // be invoked again and the cache hit counter must increment.
    await engine.build(answers, concept);
    assert.strictEqual(llm.calls, callsAfterFirstBuild, 'LLM should not be reinvoked on cache hit');

    const stats = cacheStats();
    assert.ok(stats.hits >= 1, `expected at least 1 cache hit, got ${stats.hits}`);
  });
});
