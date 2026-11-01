export const DIMENSION = 'motion';

export const OPTIONS = [
  {
    id: 'none',
    dimension: 'motion',
    label: 'None',
    description: 'Instant, no animation',
    tokens: { motion: 'none', transition: 'none' },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'subtle-fade',
    dimension: 'motion',
    label: 'Subtle fade',
    description: 'Gentle opacity on enter',
    tokens: { motion: 'subtle-fade', transition: 'opacity 200ms ease-out' },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'slide-in',
    dimension: 'motion',
    label: 'Slide-in',
    description: 'Elements slide from edge',
    tokens: { motion: 'slide-in', transition: 'transform 300ms ease-out' },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'stagger',
    dimension: 'motion',
    label: 'Stagger',
    description: 'Items appear one after another',
    tokens: { motion: 'stagger', delay: 'sequential-reveal' },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'bounce',
    dimension: 'motion',
    label: 'Bounce',
    description: 'Playful, springy entry',
    tokens: { motion: 'bounce', easing: 'cubic-bezier(0.68,-0.55,0.27,1.55)' },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'morph',
    dimension: 'motion',
    label: 'Morph',
    description: 'Shapes transition smoothly',
    tokens: { motion: 'morph', type: 'svg-path-interpolation' },
    compatibility: { forbiddenWith: [] },
  },
];
