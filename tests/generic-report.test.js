import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  compressProjectContext,
  generateGenericReport,
} from '../skills/critique/generic-report.js';

describe('generic report', () => {
  it('does not flag modern JS "export default" as default-font-stack', () => {
    const files = [
      {
        path: 'src/Button.jsx',
        content: [
          'export default function Button() {',
          '  const label = "Click";',
          '  return <button className="btn">{label}</button>;',
          '}',
        ].join('\n'),
      },
    ];
    const signals = compressProjectContext(files);
    const report = generateGenericReport(files, signals);
    assert.ok(
      !report.genericFindings.includes('default-font-stack'),
      `expected no default-font-stack, got ${JSON.stringify(report.genericFindings)}`,
    );
  });

  it('does not flag a "default" color value as default-font-stack', () => {
    const files = [
      { path: 'src/Button.css', content: '.btn { color: default; }' },
    ];
    const signals = compressProjectContext(files);
    const report = generateGenericReport(files, signals);
    assert.ok(
      !report.genericFindings.includes('default-font-stack'),
      `expected no default-font-stack, got ${JSON.stringify(report.genericFindings)}`,
    );
  });

  it('flags .btn { background: #007bff; } as generic-blue-primary', () => {
    const files = [
      { path: 'src/Button.css', content: '.btn { background: #007bff; }' },
    ];
    const signals = compressProjectContext(files);
    const report = generateGenericReport(files, signals);
    assert.ok(report.genericFindings.includes('generic-blue-primary'));
  });

  it('flags #0d6efd as generic-blue-primary', () => {
    const files = [
      { path: 'src/Button.css', content: '.btn { background-color: #0d6efd; }' },
    ];
    const signals = compressProjectContext(files);
    const report = generateGenericReport(files, signals);
    assert.ok(report.genericFindings.includes('generic-blue-primary'));
  });

  it('flags 8px border-radius as rounded-corners-everything', () => {
    const files = [
      { path: 'src/Card.css', content: '.card { border-radius: 8px; }' },
    ];
    const signals = compressProjectContext(files);
    const report = generateGenericReport(files, signals);
    assert.ok(report.genericFindings.includes('rounded-corners-everything'));
  });

  it('flags -apple-system font-family as default-font-stack', () => {
    const files = [
      {
        path: 'src/App.css',
        content: 'body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }',
      },
    ];
    const signals = compressProjectContext(files);
    const report = generateGenericReport(files, signals);
    assert.ok(report.genericFindings.includes('default-font-stack'));
  });

  it('returns no findings for a distinct design', () => {
    const files = [
      { path: 'src/Page.css', content: '.page { color: #1a1a1a; max-width: 70ch; }' },
    ];
    const signals = compressProjectContext(files);
    const report = generateGenericReport(files, signals);
    assert.deepStrictEqual(report.genericFindings, []);
  });
});
