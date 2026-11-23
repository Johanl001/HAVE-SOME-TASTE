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

// Parse the LLM subtract response into structured lists. The prompt asks the
// model to emit a "SUBTRACT list" (removed + simplified items) plus a revised
// output, so we pull the list items out of the response while keeping the full
// text as revisedOutput.
function parseSubtractResponse(response) {
  const removed = [];
  const simplified = [];
  let current = null; // 'removed' | 'simplified' | null

  for (const rawLine of response.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    const heading = line.replace(/^#{1,6}\s*/, '').replace(/:$/, '').toLowerCase();
    if (heading === 'removed' || heading === 'subtract list' || heading === 'subtract') {
      current = 'removed';
      continue;
    }
    if (heading === 'simplified') {
      current = 'simplified';
      continue;
    }
    if (heading.startsWith('revised')) {
      current = null;
      continue;
    }

    const isListItem = /^[-*•]\s/.test(line) || /^\d+[\.)]\s/.test(line);
    if (isListItem && current) {
      const text = line.replace(/^[-*•]\s*/, '').replace(/^\d+[\.)]\s*/, '').trim();
      if (text) {
        if (current === 'removed') removed.push(text);
        else simplified.push(text);
      }
    }
  }

  return { removed, simplified };
}

export class SubtractSkill {
  constructor({ llm } = {}) {
    this.llm = llm;
  }

  async run({ rawOutput, answers }) {
    const prompt = buildSubtractPrompt(answers, rawOutput);
    const result = await this.llm.call(prompt, { temperature: 0.5 });

    const { removed, simplified } = parseSubtractResponse(result);

    return {
      removed,
      simplified,
      rationale: 'Critique-and-subtract pass applied.',
      revisedOutput: result,
    };
  }
}
