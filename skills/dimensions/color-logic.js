export const DIMENSION = 'color-logic';

export const OPTIONS = [
  {
    id: 'muted-earth',
    dimension: 'color-logic',
    label: 'Muted earth',
    description: 'Terracotta, sage, ochre, cream — low saturation warm neutrals',
    tokens: { background: '#f5f1e8', foreground: '#3d3a33', accent: '#b06a3e', palette: ['#e7d4b0', '#a8b29a', '#d8a65c'] },
    compatibility: { forbiddenWith: ['brutalist'] },
  },
  {
    id: 'monochrome',
    dimension: 'color-logic',
    label: 'Monochrome',
    description: 'Grayscale with one accent hue',
    tokens: { background: '#ffffff', foreground: '#1a1a1a', accent: '#000000', palette: ['#f2f2f2', '#d9d9d9', '#bfbfbf'] },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'high-contrast',
    dimension: 'color-logic',
    label: 'High-contrast',
    description: 'Neon on dark, electric, saturated',
    tokens: { background: '#0a0a0a', foreground: '#00ff41', accent: '#ff0055', palette: ['#00ff41', '#ff0055', '#00f2ff'] },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'pastel-system',
    dimension: 'color-logic',
    label: 'Pastel system',
    description: 'Soft tints, low contrast, light background',
    tokens: { background: '#fbf7f4', foreground: '#5a5a5a', accent: '#f4c2c2', palette: ['#e3d9d8', '#f4c2c2', '#d8e2dc'] },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'brand-primary',
    dimension: 'color-logic',
    label: 'Brand primary',
    description: 'Single dominant hue with tints',
    tokens: { background: '#ffffff', foreground: '#0f172a', accent: '#2563eb', palette: ['#dbeafe', '#2563eb', '#1e40af'] },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'neutral-paper',
    dimension: 'color-logic',
    label: 'Neutral paper',
    description: 'Warm grey scale, no color',
    tokens: { background: '#fafaf9', foreground: '#292524', accent: '#78716c', palette: ['#f1f5f9', '#cbd5e1', '#94a3b8'] },
    compatibility: { forbiddenWith: [] },
  },
];
