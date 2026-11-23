import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { TasteEngine } from '../../core/engine.js';
import { cacheClear } from '../../core/cache.js';

describe('TasteEngine loadConcept schema validation', () => {
  const tmpDir = join(process.cwd(), 'tmp-engine-test');
  let engine;

  afterEach(() => {
    cacheClear();
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  });

  function writeConcept(overrides = {}) {
    const payload = {
      answers: { q1: { option: 'printed-book', dimension: 'typography' } },
      concept: 'a clean editorial concept',
      ...overrides,
    };
    const path = join(tmpDir, 'taste-concept.json');
    mkdirSync(tmpDir, { recursive: true });
    writeFileSync(path, JSON.stringify(payload), 'utf8');
    return path;
  }

  it('loads a valid concept file', () => {
    engine = new TasteEngine();
    const path = writeConcept();
    const payload = engine.loadConcept(path);
    assert.strictEqual(payload.concept, 'a clean editorial concept');
    assert.ok(payload.answers);
  });

  it('throws when concept is not a non-empty string', () => {
    engine = new TasteEngine();
    const path = writeConcept({ concept: '' });
    assert.throws(() => engine.loadConcept(path), /invalid concept/);
  });

  it('throws when answers is missing', () => {
    engine = new TasteEngine();
    const path = writeConcept({ answers: undefined });
    assert.throws(() => engine.loadConcept(path), /missing required field: answers/);
  });

  it('throws when file contains invalid JSON', () => {
    engine = new TasteEngine();
    mkdirSync(tmpDir, { recursive: true });
    const path = join(tmpDir, 'taste-concept.json');
    writeFileSync(path, '{ not valid json', 'utf8');
    assert.throws(() => engine.loadConcept(path));
  });
});
