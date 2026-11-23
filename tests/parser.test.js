import { describe, it } from 'node:test';
import assert from 'node:assert';
import { extractFilesFromLLM } from '../core/parser.js';

describe('extractFilesFromLLM', () => {
  it('returns an empty array for empty input', () => {
    assert.deepStrictEqual(extractFilesFromLLM(''), []);
    assert.deepStrictEqual(extractFilesFromLLM('   '), []);
  });

  it('returns an empty array when there are no code blocks', () => {
    assert.deepStrictEqual(
      extractFilesFromLLM('Just some plain text with no blocks.'),
      [],
    );
  });

  it('returns an empty array for an unannotated code block', () => {
    assert.deepStrictEqual(
      extractFilesFromLLM('```\nconst x = 1;\n```'),
      [],
    );
  });

  it('parses ```lang file=path annotation', () => {
    const input = '```html file=index.html\n<h1>Hi</h1>\n```';
    const files = extractFilesFromLLM(input);
    assert.deepStrictEqual(files, [
      { path: 'index.html', content: '<h1>Hi</h1>\n' },
    ]);
  });

  it('parses ```lang:path annotation', () => {
    const input = '```css:style.css\nbody { color: red; }\n```';
    const files = extractFilesFromLLM(input);
    assert.deepStrictEqual(files, [
      { path: 'style.css', content: 'body { color: red; }\n' },
    ]);
  });

  it('parses multiple annotated code blocks', () => {
    const input = [
      '```html file=index.html',
      '<h1>Hi</h1>',
      '```',
      '```css:style.css',
      'body { color: red; }',
      '```',
    ].join('\n');
    const files = extractFilesFromLLM(input);
    assert.strictEqual(files.length, 2);
    assert.strictEqual(files[0].path, 'index.html');
    assert.strictEqual(files[1].path, 'style.css');
  });

  it('parses ### File: path header followed by a code block', () => {
    const input = '### File: index.html\n\n```html\n<h1>Hi</h1>\n```';
    const files = extractFilesFromLLM(input);
    assert.deepStrictEqual(files, [
      { path: 'index.html', content: '<h1>Hi</h1>\n' },
    ]);
  });

  it('parses ### path header (no "File:" prefix) followed by a code block', () => {
    const input = '### src/App.jsx\n\n```jsx\nconst x = 1;\n```';
    const files = extractFilesFromLLM(input);
    assert.deepStrictEqual(files, [
      { path: 'src/App.jsx', content: 'const x = 1;\n' },
    ]);
  });

  it('skips headers without a following code block', () => {
    const input = '### File: index.html\n\njust a heading, no block';
    assert.deepStrictEqual(extractFilesFromLLM(input), []);
  });

  it('skips code blocks whose annotation is not a file path', () => {
    const input = '### File:\n\n```html\n<h1>Hi</h1>\n```';
    assert.deepStrictEqual(extractFilesFromLLM(input), []);
  });

  it('trims whitespace from the extracted file path', () => {
    const input = '```html file=  index.html  \n<h1>Hi</h1>\n```';
    const files = extractFilesFromLLM(input);
    assert.deepStrictEqual(files, [
      { path: 'index.html', content: '<h1>Hi</h1>\n' },
    ]);
  });

  it('ignores empty code block content', () => {
    const input = '```html file=index.html\n```';
    assert.deepStrictEqual(extractFilesFromLLM(input), []);
  });

  it('prefers annotated blocks over header blocks when both exist', () => {
    const input = [
      '### File: header.html',
      '```html',
      '<h1>header</h1>',
      '```',
      '```css file=style.css',
      'body {}',
      '```',
    ].join('\n');
    const files = extractFilesFromLLM(input);
    assert.strictEqual(files.length, 1);
    assert.strictEqual(files[0].path, 'style.css');
  });
});
