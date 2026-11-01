import { samplingConfig } from './sampler.js';
import { runQuestionFlow } from '../skills/questions/flow.js';
import { generateGenericReport, compressProjectContext } from '../skills/critique/generic-report.js';
import { comboFromAnswers, validateCombo } from '../skills/dimensions/index.js';
import { SubtractSkill } from '../skills/critique/subtract.js';

// Engine orchestrates: question flow -> concept -> build -> critique.
// This is the core, public layer of Taste.

export class TasteEngine {
  constructor({ llm, sampler = samplingConfig, subtract } = {}) {
    this.llm = llm;
    this.sampler = sampler;
    this.subtract = subtract || new SubtractSkill({ llm });
  }

  // Phase 1: Run the 3-question multiple-choice preference flow.
  async runQuestions() {
    return await runQuestionFlow();
  }

  // Phase 2: Generate a one-line concept from answers, user confirms or redirects.
  async generateConcept(answers) {
    const config = this.sampler(answers);
    const prompt = `
You are a design director with a strong point of view.

The user answered these taste questions:
${JSON.stringify(answers, null, 2)}

Propose exactly ONE one-line design concept (max 12 words) that captures
their taste direction. No jargon. Example: "a site that feels like a handwritten
letter from the roaster."

Output only the concept line, nothing else.
`.trim();

    const concept = await this.llm.call(prompt, config);
    return { concept, config };
  }

  // Phase 3: Build output using the chosen dimensions + critique-and-subtract.
  async build(answers, concept, projectContext = null) {
    const config = this.sampler(answers);

    const combo = comboFromAnswers(answers);
    const validation = validateCombo(combo);
    if (!validation.ok) {
      throw new Error(
        `Incompatible taste dimensions: ${validation.conflicts
          .map(([a, b]) => `${a} + ${b}`)
          .join(', ')}`
      );
    }

    // Build prompt combining dimensions deck + answers + concept.
    const buildPrompt = this.buildPrompt(answers, concept, projectContext, combo);
    const rawOutput = await this.llm.call(buildPrompt, config);

    // Critique-and-subtract pass: remove generic / redundant elements.
    const critique = await this.subtract.run({ rawOutput, answers });

    return {
      rawOutput,
      critique,
      config,
      combo,
    };
  }

  // Phase 4: Improve-existing mode - generic report then direction.
  async improveExisting(files) {
    const signals = compressProjectContext(files);
    const report = generateGenericReport(files, signals);
    return { report, signals };
  }

  buildPrompt(answers, concept, projectContext, combo) {
    const ctx = projectContext
      ? `\nExisting project context (compressed):\n${JSON.stringify(projectContext, null, 2)}\n`
      : '';

    const dims = Object.entries(combo)
      .map(([dimension, option]) => `- ${dimension}: ${option.label} — ${option.description}`)
      .join('\n');

    return `
You are a design engineer with a strong point of view. You do not produce
generic, average AI output.

User taste answers:
${JSON.stringify(answers, null, 2)}

Design concept: "${concept}"

Chosen design dimensions:
${dims}
${ctx}

Build a frontend output that embodies this concept using the chosen design
dimensions (typography, color logic, layout, motion, voice, wildcard). Apply
the concept and dimension tokens consistently. Output concrete code/files,
not advice.

Do not use rounded corners on everything, generic blue, or standard hero
sections. Be opinionated. Subtract anything that feels average.

Output: code blocks with file paths and contents.
    `.trim();
  }
}

export default TasteEngine;
