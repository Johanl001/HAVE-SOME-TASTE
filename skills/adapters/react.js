export function generate({ combo, concept }) {
  const typo = combo.typography || {};
  const color = combo['color-logic'] || {};
  const motion = combo.motion || {};

  const component = `import React from 'react';

export default function TastePage() {
  return (
    <main className="taste-page">
      <h1>${escapeJsx(concept)}</h1>
      <p>A distinct, opinionated design built with Taste.</p>
    </main>
  );
}`;

  const styles = `.taste-page {
  font-family: ${typo.tokens?.fontBody ?? 'sans-serif'};
  line-height: ${typo.tokens?.lineHeight ?? 1.5};
  background: ${color.tokens?.background ?? '#ffffff'};
  color: ${color.tokens?.foreground ?? '#1a1a1a'};
  max-width: ${typo.tokens?.maxWidth ?? '70ch'};
  margin: 0 auto;
  padding: 2rem;
  transition: ${motion.tokens?.transition ?? 'none'};
}
.taste-page h1 {
  font-family: ${typo.tokens?.fontHeading ?? 'sans-serif'};
  color: ${color.tokens?.accent ?? '#000000'};
}
.taste-page p { margin-top: 1rem; }`;

  return {
    files: [
      { path: 'src/TastePage.jsx', content: component },
      { path: 'src/TastePage.css', content: styles },
    ],
  };
}

function escapeJsx(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
