export const DIMENSION = 'wildcard';

export const OPTIONS = [
  {
    id: 'paper-texture-overlay',
    dimension: 'wildcard',
    label: 'Paper texture overlay',
    description: 'Subtle paper grain across the surface',
    tokens: { wildcard: 'paper-texture-overlay', effect: 'background-grain' },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'glitch-accent',
    dimension: 'wildcard',
    label: 'Glitch accent',
    description: 'Momentary chromatic aberration on hover',
    tokens: { wildcard: 'glitch-accent', effect: 'chromatic-hover' },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'hand-drawn-borders',
    dimension: 'wildcard',
    label: 'Hand-drawn borders',
    description: 'Irregular, hand-drawn style borders',
    tokens: { wildcard: 'hand-drawn-borders', effect: 'sketch-border' },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'gradient-mesh-background',
    dimension: 'wildcard',
    label: 'Gradient mesh background',
    description: 'Soft, shifting gradient mesh',
    tokens: { wildcard: 'gradient-mesh-background', effect: 'gradient-mesh' },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'asymmetric-shadows',
    dimension: 'wildcard',
    label: 'Asymmetric shadows',
    description: 'Off-center, irregular drop shadows',
    tokens: { wildcard: 'asymmetric-shadows', effect: 'irregular-shadow' },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'rotated-elements',
    dimension: 'wildcard',
    label: 'Rotated elements',
    description: 'Slightly rotated blocks and text',
    tokens: { wildcard: 'rotated-elements', effect: 'rotation' },
    compatibility: { forbiddenWith: [] },
  },
];
