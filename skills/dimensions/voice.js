export const DIMENSION = 'voice';

export const OPTIONS = [
  {
    id: 'friendly-neighbor',
    dimension: 'voice',
    label: 'Friendly neighbor',
    description: 'Warm, casual, helpful — contractions, simple words',
    tokens: { tone: 'friendly-neighbor', style: 'contractions, simple words' },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'expert-authority',
    dimension: 'voice',
    label: 'Expert authority',
    description: 'Precise, confident, concise — active voice, no hedging',
    tokens: { tone: 'expert-authority', style: 'active voice, no hedging' },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'playful',
    dimension: 'voice',
    label: 'Playful',
    description: 'Witty, unexpected, light — puns, rhythm, surprise',
    tokens: { tone: 'playful', style: 'puns, rhythm, surprise' },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'formal',
    dimension: 'voice',
    label: 'Formal',
    description: 'Polished, respectful, distant — complete sentences, titles',
    tokens: { tone: 'formal', style: 'complete sentences, titles' },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'minimal',
    dimension: 'voice',
    label: 'Minimal',
    description: 'Few words, maximum space — headlines only, imperative',
    tokens: { tone: 'minimal', style: 'headlines only, imperative' },
    compatibility: { forbiddenWith: [] },
  },
  {
    id: 'storyteller',
    dimension: 'voice',
    label: 'Storyteller',
    description: 'Narrative, sequential, inviting — first-person, anecdotal',
    tokens: { tone: 'storyteller', style: 'first-person, anecdotal' },
    compatibility: { forbiddenWith: [] },
  },
];
