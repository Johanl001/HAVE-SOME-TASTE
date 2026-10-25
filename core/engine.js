import { samplingConfig } from './sampler.js';
import { runQuestionFlow } from '../skills/questions/flow.js';
import { generateGenericReport, compressProjectContext } from '../skills/critique/generic-report.js';

// Engine orchestrates: question flow -> concept -> build -> critique.
// This is the core, public layer of Taste.

export class TasteEngine {
  constructor({ llm, sampler = samplingConfig } = {}) {
    this.llm = llm;
    this.sampler = sampler;
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

    // Build prompt combining dimensions deck + answers + concept.
    const buildPrompt = this.buildPrompt(answers, concept, projectContext);
    const rawOutput = await this.llm.call(buildPrompt, config);

    // Critique-and-subtract pass: remove generic / redundant elements.
    const critiquePrompt = this.critiquePrompt(rawOutput, answers);
    const critique = await this.llm.call(critiquePrompt, {
      ...config,
      temperature: 0.5, // lower temp for tighter editorial decisions
    });

    return {
      rawOutput,
      critique,
      config,
    };
  }

  // Phase 4: Improve-existing mode - generic report then direction.
  async improveExisting(files) {
    const signals = compressProjectContext(files);
    const report = generateGenericReport(files, signals);
    return { report, signals };
  }

  buildPrompt(answers, concept, projectContext) {
    const ctx = projectContext
      ? `\nExisting project context (compressed):\n${JSON.stringify(projectContext, null, 2)}\n`
      : '';

    return `
You are a design engineer with a strong point of view. You do not produce
generic, average AI output.

User taste answers:
${JSON.stringify(answers, null, 2)}

Design concept: "${concept}"
${ctx}

Build a frontend output that embodies this concept using the chosen design
dimensions (typography, color logic, layout, motion, voice). Apply the
concept consistently. Output concrete code/files, not advice.

Do not use rounded corners on everything, generic blue, or standard hero
sections. Be opinionated. Subtract anything that feels average.

Output: code blocks with file paths and contents.
`.trim();
  }

  critiquePrompt(rawOutput, answers) {
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
}

export default TasteEngine;
