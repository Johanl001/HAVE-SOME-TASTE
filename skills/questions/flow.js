import readline from 'readline';

export const QUESTIONS = [
  {
    id: 'q1',
    prompt: 'How should it feel to read?',
    options: [
      { id: 'printed-book', label: 'Calm and spacious, like a printed book', dimension: 'typography', option: 'printed-book' },
      { id: 'trading-terminal', label: 'Dense and fast, like a trading terminal', dimension: 'typography', option: 'trading-terminal' },
      { id: 'editorial-magazine', label: 'Bold and editorial, like a magazine spread', dimension: 'typography', option: 'editorial-magazine' },
    ],
  },
  {
    id: 'q2',
    prompt: 'How should it look at a glance?',
    options: [
      { id: 'muted-earth-centered', label: 'Muted earth tones, centered column', dimension: 'color-logic', option: 'muted-earth' },
      { id: 'monochrome-asymmetric', label: 'Monochrome with one accent, asymmetric grid', dimension: 'color-logic', option: 'monochrome' },
      { id: 'pastel-card-cluster', label: 'Soft pastels, floating cards', dimension: 'color-logic', option: 'pastel-system' },
    ],
  },
  {
    id: 'q3',
    prompt: 'How should it move?',
    options: [
      { id: 'none', label: 'None - instant, no animation', dimension: 'motion', option: 'none' },
      { id: 'subtle-fade-stagger', label: 'Subtle fade with staggered reveal', dimension: 'motion', option: 'subtle-fade' },
      { id: 'bounce-glitch', label: 'Bouncy entry with a glitch accent', dimension: 'motion', option: 'bounce' },
    ],
  },
];

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function ask(question) {
  return new Promise((resolve) => {
    const rl = createInterface();
    const lines = [
      '',
      `  ${question.prompt}`,
      '',
    ];
    question.options.forEach((opt, i) => {
      lines.push(`  ${i + 1}) ${opt.label}`);
    });
    lines.push('');
    lines.push('  Pick a number (1-' + question.options.length + '): ');
    rl.write(lines.join('\n'));

    const handleLine = (input) => {
      const choice = parseInt(input.trim(), 10);
      if (Number.isNaN(choice) || choice < 1 || choice > question.options.length) {
        rl.write('  Invalid choice. Try again.\n');
        return; // Keep listening on the same interface
      }
      rl.removeListener('line', handleLine);
      rl.close();
      resolve(question.options[choice - 1]);
    };

    rl.on('line', handleLine);
  });
}

export async function runQuestionFlow() {
  const answers = {};

  for (const question of QUESTIONS) {
    const choice = await ask(question);
    answers[question.id] = {
      optionId: choice.id,
      dimension: choice.dimension,
      option: choice.option,
      label: choice.label,
    };
  }

  return answers;
}
