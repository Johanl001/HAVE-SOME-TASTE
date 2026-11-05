import { describe, it } from 'node:test';
import assert from 'node:assert';
import { writeFiles, FileConflictError } from '../core/writer.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function makeTmpDir() {
  return path.join(os.tmpdir(), `taste-writer-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

function cleanup(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('file writer', () => {
  it('writes files to disk with parent directory creation', () => {
    const testDir = makeTmpDir();
    try {
      const written = writeFiles(
        [
          { path: 'sub/dir/index.html', content: '<html></html>' },
          { path: 'style.css', content: 'body {}' },
        ],
        { outputDir: testDir },
      );
      assert.strictEqual(written.length, 2);
      assert.ok(fs.existsSync(path.join(testDir, 'sub', 'dir', 'index.html')));
      assert.ok(fs.existsSync(path.join(testDir, 'style.css')));
      assert.strictEqual(
        fs.readFileSync(path.join(testDir, 'sub', 'dir', 'index.html'), 'utf8'),
        '<html></html>',
      );
    } finally {
      cleanup(testDir);
    }
  });

  it('throws FileConflictError when file exists without --force', () => {
    const testDir = makeTmpDir();
    try {
      writeFiles([{ path: 'exists.txt', content: 'original' }], { outputDir: testDir });
      assert.throws(
        () => writeFiles([{ path: 'exists.txt', content: 'new' }], { outputDir: testDir }),
        FileConflictError,
      );
    } finally {
      cleanup(testDir);
    }
  });

  it('overwrites existing files with --force', () => {
    const testDir = makeTmpDir();
    try {
      writeFiles([{ path: 'exists.txt', content: 'original' }], { outputDir: testDir });
      const written = writeFiles(
        [{ path: 'exists.txt', content: 'overwritten' }],
        { outputDir: testDir, force: true },
      );
      assert.strictEqual(written.length, 1);
      assert.strictEqual(
        fs.readFileSync(path.join(testDir, 'exists.txt'), 'utf8'),
        'overwritten',
      );
    } finally {
      cleanup(testDir);
    }
  });

  it('rejects path traversal', () => {
    const testDir = makeTmpDir();
    try {
      assert.throws(
        () =>
          writeFiles([{ path: '../../outside.txt', content: 'x' }], { outputDir: testDir }),
        /traversal/,
      );
    } finally {
      cleanup(testDir);
    }
  });

  it('throws on invalid file entry', () => {
    const testDir = makeTmpDir();
    try {
      assert.throws(
        () => writeFiles([{ path: 'bad.txt', content: 123 }], { outputDir: testDir }),
        /Invalid file entry/,
      );
    } finally {
      cleanup(testDir);
    }
  });
});
