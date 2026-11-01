import { OPTIONS as typographyOptions } from './typography.js';
import { OPTIONS as colorLogicOptions } from './color-logic.js';
import { OPTIONS as layoutOptions } from './layout.js';
import { OPTIONS as motionOptions } from './motion.js';
import { OPTIONS as voiceOptions } from './voice.js';
import { OPTIONS as wildcardOptions } from './wildcard.js';
import { deriveSeed } from '../../core/sampler.js';

const DIMENSIONS = {
  typography: typographyOptions,
  'color-logic': colorLogicOptions,
  layout: layoutOptions,
  motion: motionOptions,
  voice: voiceOptions,
  wildcard: wildcardOptions,
};

// Pairs that are forbidden or flagged as conflicting when combined.
export const FORBIDDEN_PAIRS = [
  ['brutalist', 'muted-earth'],
  ['trading-terminal', 'handwritten-letter'],
];

const DEFAULT_LAYOUT = 'centered-column';
const DEFAULT_VOICE = 'friendly-neighbor';

export function getAllDimensions() {
  return Object.keys(DIMENSIONS);
}

export function getDimension(name) {
  return DIMENSIONS[name] || [];
}

export function getOption(dimensionId, optionId) {
  return (DIMENSIONS[dimensionId] || []).find((o) => o.id === optionId);
}

// Deterministic pick from a list using the seed hash.
function seededPick(seed, list) {
  const n = parseInt(seed.slice(0, 8), 16);
  return list[n % list.length];
}

// Build a full 6-dimension combo from the user's 3 answers plus defaults.
//
// q1 -> typography, q2 -> color-logic, q3 -> motion.
// layout and voice use defaults (the 3-question flow doesn't cover them yet).
// wildcard rotates per draw using a seeded draw so the same answers always
// produce the same wildcard.
export function comboFromAnswers(answers) {
  const seed = deriveSeed(answers || {});
  const combo = {
    typography: getOption('typography', answers?.q1?.option) || getOption('typography', 'printed-book'),
    'color-logic': getOption('color-logic', answers?.q2?.option) || getOption('color-logic', 'muted-earth'),
    motion: getOption('motion', answers?.q3?.option) || getOption('motion', 'none'),
    layout: getOption('layout', DEFAULT_LAYOUT),
    voice: getOption('voice', DEFAULT_VOICE),
    wildcard: seededPick(seed, wildcardOptions),
  };
  return combo;
}

// Validate a combo against forbidden pairs.
export function validateCombo(combo) {
  const ids = Object.values(combo)
    .map((o) => (o && o.id ? o.id : null))
    .filter(Boolean);

  const conflicts = [];
  for (const [a, b] of FORBIDDEN_PAIRS) {
    if (ids.includes(a) && ids.includes(b)) {
      conflicts.push([a, b]);
    }
  }

  return { ok: conflicts.length === 0, conflicts };
}

export default {
  getAllDimensions,
  getDimension,
  getOption,
  comboFromAnswers,
  validateCombo,
  FORBIDDEN_PAIRS,
};
