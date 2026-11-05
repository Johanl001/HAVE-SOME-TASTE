import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  cacheSet,
  cacheGet,
  cacheHas,
  cacheStats,
  cacheClear,
  hashInput,
  prefixKey,
  compressContext,
  compressFiles,
} from '../../core/cache.js';

describe('cache layer', () => {
  it('cacheSet then cacheGet round-trips a value', () => {
    const key = 'test-key';
    const value = { prefix: 'dimensions deck', version: 1 };
    cacheSet(key, value);
    assert.strictEqual(cacheHas(key), true);
    assert.deepStrictEqual(cacheGet(key), value);
  });

  it('cacheGet returns undefined on miss', () => {
    assert.strictEqual(cacheGet('does-not-exist'), undefined);
  });

  it('cacheStats tracks hits and misses', () => {
    cacheClear();
    cacheSet('a', 1);
    cacheSet('b', 2);
    cacheGet('a'); // hit
    cacheGet('a'); // hit
    cacheGet('c'); // miss
    const s = cacheStats();
    assert.strictEqual(s.lookups, 3);
    assert.strictEqual(s.hits, 2);
    assert.strictEqual(s.misses, 1);
    assert.strictEqual(s.hitRate, 2 / 3);
    assert.strictEqual(s.missRate, 1 / 3);
  });

  it('cacheClear resets state', () => {
    cacheSet('x', 1);
    cacheClear();
    assert.strictEqual(cacheHas('x'), false);
    const s = cacheStats();
    assert.strictEqual(s.lookups, 0);
    assert.strictEqual(s.hits, 0);
    assert.strictEqual(s.entries, 0);
  });

  it('hashInput is deterministic and collision-resistant', () => {
    assert.strictEqual(hashInput({ a: 1 }), hashInput({ a: 1 }));
    assert.notStrictEqual(hashInput({ a: 1 }), hashInput({ a: 2 }));
    assert.strictEqual(hashInput('str'), hashInput('str'));
  });

  it('prefixKey produces a stable namespaced key', () => {
    const p1 = prefixKey({ deck: 'dimensions' });
    const p2 = prefixKey({ deck: 'dimensions' });
    assert.strictEqual(p1, p2);
    assert.match(p1, /^prefix:/);
  });

  it('compressContext keeps design-relevant lines', () => {
    const css = `
/* comment */
.btn { background: blue; color: white; }
.hero { display: flex; padding: 1rem; }
const x = 1; // non-design
--accent: #f00;
`;
    const out = compressContext(css);
    assert.ok(out.includes('background:'));
    assert.ok(out.includes('color:'));
    assert.ok(out.includes('display: flex'));
    assert.ok(out.includes('padding:'));
    assert.ok(out.includes('--accent:'));
    assert.ok(!out.includes('comment'));
    assert.ok(!out.includes('const x = 1'));
  });

  it('compressFiles joins multiple files with headers', () => {
    const files = [
      { path: 'src/a.css', content: '.btn { color: red; }' },
      { path: 'src/b.css', content: '.card { padding: 1rem; }' },
    ];
    const out = compressFiles(files);
    assert.ok(out.includes('## src/a.css'));
    assert.ok(out.includes('## src/b.css'));
    assert.ok(out.includes('color: red'));
    assert.ok(out.includes('padding: 1rem'));
  });
});
