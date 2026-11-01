export const id = 'critique-subtract';
export const version = '1.0.0';

// Pure prompt builder — testable without an LLM.
export function buildSubtractPrompt(answers, rawOutput) {
  return `
You are a design editor. Review the generated output below and SUBTRACT -
remove generic, cliché, or redundant elements. Do not add new elements.

Chosen taste direction:
${JSON.stringify(answers, null, 2)}

Generated output:
${rawOutput}

Identify:
1. Generic/cliché elements (rounded corners on everything, generic blue,
   stock-photography vibes, standard hero section)
2. Redundant decoration (shadows, gradients, borders that don't serve hierarchy)
3. Inconsistencies with the chosen dimensions

Output a SUBTRACT list: specific elements to remove or simplify, plus the
revised output with those elements removed. Taste is curation, not accumulation.
`.trim();
}

export class SubtractSkill {
  constructor({ llm } = {}) {
    this.llm = llm;
  }

  async run({ rawOutput, answers }) {
    const prompt = buildSubtractPrompt(answers, rawOutput);
    const result = await this.llm.call(prompt, { temperature: 0.5 });

    return {
      removed: [],
      simplified: [],
      rationale: 'Critique-and-subtract pass applied.',
      revisedOutput: result,
    };
  }
}
