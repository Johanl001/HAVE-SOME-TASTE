export const DIMENSION = 'typography';

export const OPTIONS = [
  {
    id: 'printed-book',
    dimension: 'typography',
    label: 'Printed book',
    description: 'Calm, serif, spacious, high readability',
    tokens: { fontHeading: 'serif', fontBody: 'serif', lineHeight: 1.6, maxWidth: '64ch' },
    compatibility: { forbiddenWith: ['trading-terminal'] },
  },
  {
    id: 'trading-terminal',
    dimension: 'typography',
    label: 'Trading terminal',
    description: 'Dense, monospace, fast, information-dense',
    tokens: { fontHeading: 'monospace', fontBody: 'monospace', lineHeight: 1.2, maxWidth: 'none' },
    compatibility: { forbiddenWith: ['handwritten-letter'] },
  },
  {
    id: 'editorial-magazine',
    dimension: 'typography',
    label: 'Editorial magazine',
    description: 'Bold display serif, large photos, asymmetry',
    tokens: { fontHeading: 'display-serif', fontBody: 'serif', lineHeight: 1.4, maxWidth: '80ch' },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'swiss-functional',
    dimension: 'typography',
    label: 'Swiss functional',
    description: 'Neutral sans, grid-aligned, objective',
    tokens: { fontHeading: 'sans-serif', fontBody: 'sans-serif', lineHeight: 1.5, maxWidth: '70ch' },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'brutalist',
    dimension: 'typography',
    label: 'Brutalist',
    description: 'Raw, oversized, unapologetic',
    tokens: { fontHeading: 'system-ui', fontBody: 'system-ui', lineHeight: 1.2, maxWidth: 'none' },
    compatibility: { forbiddenWith: ['muted-earth'] },
  },
  {
    id: 'handwritten-letter',
    dimension: 'typography',
    label: 'Handwritten letter',
    description: 'Personal, informal, warm',
    tokens: { fontHeading: 'cursive', fontBody: 'cursive', lineHeight: 1.7, maxWidth: '55ch' },
    compatibility: { forbiddenWith: ['trading-terminal'] },
  },
];
