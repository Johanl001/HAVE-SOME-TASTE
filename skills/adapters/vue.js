export function generate({ combo, concept }) {
  const typo = combo.typography || {};
  const color = combo['color-logic'] || {};
  const motion = combo.motion || {};

  const component = `<template>
  <main class="taste-page">
    <h1>${escapeHtml(concept)}</h1>
    <p>A distinct, opinionated design built with Taste.</p>
  </main>
</template>

<script setup>
import { ref } from 'vue';
const msg = ref('Taste');
</script>

<style scoped>
.taste-page {
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
.taste-page p { margin-top: 1rem; }
</style>`;

  return {
    files: [{ path: 'src/TastePage.vue', content: component }],
  };
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
