import { createHash } from 'crypto';

// Generic design markers commonly found in default AI / boilerplate output.
// Used by improve-existing mode to name what is generic about a project.
const GENERIC_MARKERS = [
  'bootstrap-default-buttons',
  'generic-blue-primary',
  'standard-hero-cta',
  'rounded-corners-everything',
  'generic-shadow-card',
  'default-font-stack',
  'centered-max-width-container',
  'stock-photography-vibe',
  'hamburger-menu-on-desktop',
  'placeholder-lorem-ipsum',
];

// Compress existing project context before sending to the LLM.
// Keeps only design-relevant signals: file names, class names, color tokens,
// layout primitives. Strips comments, whitespace, and non-design code.
export function compressProjectContext(files) {
  const signals = [];
  for (const file of files) {
    const { path, content } = file;
    const lines = content.split('\n');
    const relevant = lines.filter((line) => {
      const l = line.trim();
      return (
        l.startsWith('.') ||               // CSS class selectors
        l.includes('className') ||         // React/Vue/Svelte classes
        l.includes('class=') ||            // HTML classes
        l.includes('color:') ||            // color tokens
        l.includes('background:') ||       // background tokens
        l.includes('font-') ||             // typography
        l.includes('grid') ||              // layout
        l.includes('flex') ||              // layout
        l.includes('padding') ||           // spacing
        l.includes('margin') ||            // spacing
        l.includes('--')                   // CSS custom properties
      );
    });
    if (relevant.length > 0) {
      signals.push({ path, lines: relevant.slice(0, 40) });
    }
  }
  return signals;
}

// Generate a short default report naming what is generic about the current design.
// Returns a structured report the engine can use to propose a direction.
export function generateGenericReport(files, compressedSignals) {
  const findings = [];
  const joined = compressedSignals
    .map((s) => s.lines.join(' '))
    .join(' ')
    .toLowerCase();

  for (const marker of GENERIC_MARKERS) {
    const keyword = marker.replace(/-/g, ' ');
    if (joined.includes(keyword.split(' ')[0])) {
      findings.push(marker);
    }
  }

  // Deduplicate and cap.
  const uniqueFindings = [...new Set(findings)].slice(0, 5);

  const reportId = createHash('sha256')
    .update(JSON.stringify(compressedSignals))
    .digest('hex')
    .slice(0, 12);

  return {
    reportId,
    generatedAt: new Date().toISOString(),
    fileCount: files.length,
    genericFindings: uniqueFindings,
    summary: uniqueFindings.length > 0
      ? `Found ${uniqueFindings.length} generic design marker(s). This project leans toward the statistical average.`
      : 'No strong generic markers detected. Project already has a distinct direction.',
    recommendation: uniqueFindings.length > 0
      ? 'Apply a Taste direction to move away from the generic look.'
      : 'Project is already distinct. Taste can still refine it.',
  };
}
