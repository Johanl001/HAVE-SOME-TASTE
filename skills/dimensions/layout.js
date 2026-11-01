export const DIMENSION = 'layout';

export const OPTIONS = [
  {
    id: 'centered-column',
    dimension: 'layout',
    label: 'Centered column',
    description: 'Single narrow column, generous margins',
    tokens: { layout: 'centered-column', maxWidth: '64ch', margin: 'auto', padding: '2rem' },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'asymmetric-grid',
    dimension: 'layout',
    label: 'Asymmetric grid',
    description: 'Off-center, overlapping, dynamic',
    tokens: { layout: 'asymmetric-grid', grid: 'irregular-tracks', gap: '1.5rem' },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'full-bleed-sections',
    dimension: 'layout',
    label: 'Full-bleed sections',
    description: 'Edge-to-edge bands, alternating',
    tokens: { layout: 'full-bleed', width: '100%', sectionPadding: '4rem 0' },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'sidebar-content',
    dimension: 'layout',
    label: 'Sidebar + content',
    description: 'Navigation left, content right',
    tokens: { layout: 'sidebar-content', sidebarWidth: '260px', main: 'fluid' },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'card-cluster',
    dimension: 'layout',
    label: 'Card cluster',
    description: 'Floating cards, whitespace between',
    tokens: { layout: 'card-cluster', gap: '2rem', cardRadius: '0.5rem' },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'newspaper-columns',
    dimension: 'layout',
    label: 'Newspaper columns',
    description: 'Multi-column, justified',
    tokens: { layout: 'newspaper-columns', columnCount: 3, textAlign: 'justify' },
    compatibility: { forbiddenWith: [] },
  },
];
