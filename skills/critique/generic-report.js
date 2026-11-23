import { createHash } from 'crypto';

// Generic design markers commonly found in default AI / boilerplate output.
// Each marker maps to a regex targeting real CSS/markup signatures rather than
// naive single-word substring matches (which caused false positives on words
// like "default", "generic", and "standard").
// Used by improve-existing mode to name what is generic about a project.
export const MARKER_PATTERNS = {
  'bootstrap-default-buttons': /\.btn\s*\{[^}]*background:\s*#007bff/i,
  'generic-blue-primary': /(?:color|background(?:-color)?)\s*:\s*#007bff/i,
  'standard-hero-cta': /\.hero\s*\{[^}]*text-align:\s*center/i,
  'rounded-corners-everything': /border-radius:\s*(?:8px|0\.5rem|6px)/i,
  'generic-shadow-card': /box-shadow:\s*0\s+\d+px\s+\d+px\s+rgba\(0/i,
  'default-font-stack': /font-family:\s*(?:-apple-system|system-ui|BlinkMacSystemFont)/i,
  'centered-max-width-container': /max-width:\s*1200px/i,
  'stock-photography-vibe': /placeholder|unsplash\.com|picsum/i,
  'hamburger-menu-on-desktop': /\.hamburger|\.burger|\.menu-toggle/i,
  'placeholder-lorem-ipsum': /lorem\s+ipsum/i,
};

const GENERIC_MARKERS = Object.keys(MARKER_PATTERNS);

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

  for (const [marker, pattern] of Object.entries(MARKER_PATTERNS)) {
    if (pattern.test(joined)) {
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
