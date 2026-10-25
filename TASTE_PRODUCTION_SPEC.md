# Taste — Production Build Specification

**Role:** Specialist in skills-based design architecture and LLM performance optimization  
**Product:** Taste — an LLM "point-of-view" layer that produces distinct, good-looking design outputs per user  
**Source thesis:** `Taste Phase 1 One-Pager.md` (Dhanraj Deshmukh, Oct 23 2026)  
**Status:** Production-ready build spec — v1 scope, open core + paid critique layer  
**Last updated:** 2026-10-25

---

## 1. Executive Summary

Taste is a single-file drop-in CLI tool that sits between a user's prompt and their LLM-backed design/frontend output. It solves the "every LLM builds the same generic product" problem by injecting a curated **point of view** through:

1. A 3-question multiple-choice preference flow (no typing, no jargon)
2. A dimensions deck (type, color logic, layout, motion, voice + 1 wildcard)
3. A critique-and-subtract refinement pass
4. An improve-existing mode for pulling legacy projects out of the generic look

**Open core** (free repo): core engine, question flow, dimensions deck, improve-existing flow, tool adapters, before/after showcase.  
**Paid layer** (hosted critique tool): URL/screenshot upload → generic-design audit → generated rule file. Premium taste packs after that.

---

## 2. Product Constraints (from One-Pager)

| Constraint | Detail |
|---|---|
| **Install** | One file dropped into the project |
| **Input** | Normal prompt OR path to existing project |
| **Questions** | Exactly 3, multiple choice, concrete plain-language options |
| **Concept output** | One-line concept, user confirms or redirects |
| **Build** | Combination of dimensions → critique-and-subtract pass |
| **Existing projects** | Generic report first, then direction, then apply |
| **v1 scope** | Core, 6 dimensions × ~6 options each, question flow, improve-existing, tool adapters, showcase |
| **v1 out** | Writing/code/other domains, marketplace, accounts, hosted app |
| **Timeline** | 3 days (core + deck + flow) → tests + README + publish on day 3 |

---

## 3. Architecture: Skill-Based Modular Design

The system is built as **discrete, swappable skills** so that dimensions, question flows, and critique rules can be versioned independently without touching the core engine.

```
taste/
├── taste.cli.js              # Entry point: one-file drop-in
├── core/
│   ├── engine.js             # Orchestrates question → concept → build → critique
│   ├── sampler.js            # LLM sampling control (temperature, top-p, seed)
│   └── cache.js              # Prompt caching + context compression layer
├── skills/
│   ├── questions/
│   │   └── flow.js           # 3-question multiple-choice elicitation
│   ├── dimensions/
│   │   ├── index.js          # Deck registry (6 dimensions × 6 options)
│   │   ├── typography.js
│   │   ├── color-logic.js
│   │   ├── layout.js
│   │   ├── motion.js
│   │   ├── voice.js
│   │   └── wildcard.js
│   ├── critique/
│   │   ├── subtract.js       # Critique-and-subtract refinement pass
│   │   └── generic-report.js # Improve-existing generic-audit report
│   └── adapters/
│       ├── react.js
│       ├── vue.js
│       ├── svelte.js
│       └── vanilla.js
├── templates/
│   └── before-after/
├── config/
│   └── taste.schema.json     # Output rule-file schema
└── tests/
    ├── baseline/             # No-Taste outputs for comparison
    ├── draws/                # Same-brief multiple draws
    └── e2e/
```

### Skill contract (every skill must export)
```js
{
  id: string,                 // unique skill id
  version: string,
  input: Schema,              // zod-like input schema
  output: Schema,             // zod-like output schema
  run(input): Promise<Output> // pure, side-effect-free where possible
}
```

**Why this matters:** Skills can be hot-swapped, A/B tested, and versioned. The paid "critique logic" and "compatibility rules" live as private skills that import from the public core but never expose their internals — matching the open-core boundary.

---

## 4. LLM Performance & Optimization Strategy

This is the specialist layer. Every LLM call in Taste must be fast, cheap, and deterministic enough to be reproducible per user.

### 4.1 Sampling control (diversity without chaos)
Use sampling parameters to make "different on every run" intentional, not accidental:

| Parameter | v1 Value | Purpose |
|---|---|---|
| `temperature` | 0.7 | Balanced creativity; high enough for variety, low enough for coherence |
| `top_p` | 0.9 | Nucleus sampling — keeps likely tokens, cuts the long tail |
| `top_k` | 40 | Hard cap on candidate tokens per step |
| `seed` | Derived from user answers | Same answers → same seed → reproducible draw |
| `max_tokens` | 2000 | Bound output length for cost/latency control |

**Diversity mechanism:** Hash the user's 3 answers into a deterministic seed. Different answer combinations → different seeds → different outputs. Same user revisiting → same output (stable, not random noise).

### 4.2 Prompt caching (Anthropic Claude)
Cache the static, token-heavy prefix so repeated calls are cheaper and faster:

- **Cache layer:** The full dimensions deck + design traditions (Swiss/editorial/Apple-Braun/brutalism) + skill definitions are cached as a prefix.
- **Variable suffix:** User answers + project context + brief are appended per call.
- **Expected saving:** Up to ~90% on cached prefix tokens; latency reduction on repeat draws.

Sources: [Anthropic Prompt Caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), [Claude Platform Cost/Performance](https://claude.com/resources/articles/reducing-cost-and-improving-performance-with-claude-platform)

### 4.3 Context compression
For improve-existing mode, compress the existing project before sending to the LLM:
- Strip comments, whitespace, and non-design code
- Keep only component structure, class names, color tokens, layout primitives
- Summarize file tree rather than embedding full source

### 4.4 Latency budget (per draw)
| Stage | Target |
|---|---|
| Question flow (3 Qs) | < 2s total |
| Concept generation | < 3s |
| Build (dimensions → code) | < 10s |
| Critique-and-subtract | < 5s |
| Improve-existing report | < 8s |
| **End-to-end** | < 25s |

---

## 5. Dimensions Deck (6 × 6)

Each dimension has exactly 6 strong options. Options are described in plain words with no jargon. Each option maps to concrete design tokens.

### Dimension 1: Typography
| # | Option | Plain-language description | Design tokens |
|---|---|---|---|
| 1 | Printed book | Calm, serif, spacious, high readability | Serif headings, serif body, 1.6 line-height, wide measure |
| 2 | Trading terminal | Dense, monospace, fast, information-dense | Mono everything, tight spacing, high contrast |
| 3 | Editorial magazine | Bold display serif, large photos, asymmetry | Contrast serif + sans, oversized pull quotes |
| 4 | Swiss functional | Neutral sans, grid-aligned, objective | Helvetica-like, ragged right, modular grid |
| 5 | Brutalist | Raw, oversized, unapologetic | System fonts, brutal scale, high-contrast color |
| 6 | Handwritten letter | Personal, informal, warm | Script/handwritten-ish, irregular spacing |

### Dimension 2: Color Logic
| # | Option | Description | Tokens |
|---|---|---|---|
| 1 | Muted earth | Terracotta, sage, ochre, cream | Low saturation, warm neutrals |
| 2 | Monochrome | Black, white, one accent | Grayscale + single accent hue |
| 3 | High-contrast | Neon on dark, electric | Saturated, dark background |
| 4 | Pastel system | Soft tints, low contrast | Desaturated, light background |
| 5 | Brand-primary | Single dominant hue + tints | Monochromatic hue scale |
| 6 | Neutral paper | Off-white, grey, charcoal | Warm grey scale, no color |

### Dimension 3: Layout
| # | Option | Description | Tokens |
|---|---|---|---|
| 1 | Centered column | Single narrow column, generous margins | Max-width ~64ch, centered |
| 2 | Asymmetric grid | Off-center, overlapping, dynamic | CSS Grid, irregular tracks |
| 3 | Full-bleed sections | Edge-to-edge bands, alternating | Full width, sectioned |
| 4 | Sidebar + content | Navigation left, content right | Fixed sidebar, fluid main |
| 5 | Card cluster | Floating cards, whitespace between | Gap-heavy, rounded cards |
| 6 | Newspaper columns | Multi-column, justified | Column-count, justified text |

### Dimension 4: Motion
| # | Option | Description | Tokens |
|---|---|---|---|
| 1 | None | Instant, no animation | `transition: none` |
| 2 | Subtle fade | Gentle opacity on enter | 200ms ease-out fade |
| 3 | Slide-in | Elements slide from edge | 300ms transform slide |
| 4 | Stagger | Items appear one after another | Delayed sequential reveal |
| 5 | Bounce | Playful, springy entry | Cubic-bezier spring |
| 6 | Morph | Shapes transition smoothly | SVG path interpolation |

### Dimension 5: Voice
| # | Option | Description | Copy tone |
|---|---|---|---|
| 1 | Friendly neighbor | Warm, casual, helpful | Contractions, simple words |
| 2 | Expert authority | Precise, confident, concise | Active voice, no hedging |
| 3 | Playful | Witty, unexpected, light | Puns, rhythm, surprise |
| 4 | Formal | Polished, respectful, distant | Complete sentences, titles |
| 5 | Minimal | Few words, maximum space | Headlines only, imperative |
| 6 | Storyteller | Narrative, sequential, inviting | First-person, anecdotal |

### Dimension 6: Wildcard (rotates per draw)
One surprise dimension injected per draw so no two outputs feel identical even with identical answers. Examples: "paper texture overlay," "glitch accent," "hand-drawn borders," "gradient mesh background," "asymmetric shadows," "rotated elements."

**Compatibility rules:** Some combinations are forbidden or flagged (e.g., Brutalist + Muted earth = muddy; Trading terminal + Handwritten letter = conflicting). These rules live in `skills/dimensions/index.js` and can be extended without touching core.

---

## 6. Question Flow (3 Questions, Multiple Choice)

Each question presents 3–4 options drawn from the dimensions deck. Users pick one option per question. No typing. No jargon.

| Question | Maps to | Options (example) |
|---|---|---|
| Q1: "How should it feel to read?" | Typography + Voice | Printed book, Trading terminal, Editorial magazine |
| Q2: "How should it look at a glance?" | Color + Layout | Muted earth + Centered column, Monochrome + Asymmetric, Pastel + Card cluster |
| Q3: "How should it move?" | Motion + Wildcard | None + Wildcard off, Subtle fade + Stagger, Bounce + Glitch |

**Flow:**
1. CLI renders Q1 → user picks → store choice
2. Q2 → pick → store
3. Q3 → pick → store
4. Engine hashes choices → seed → generates one-line concept
5. User confirms concept or redirects (one edit pass allowed)
6. Engine builds → critique-and-subtract → outputs files

**No blank-page problem:** Every option is concrete and visual. Users never type "make it modern."

---

## 7. Critique-and-Subtract Pass

After the initial build, a second LLM pass critiques the output and **subtracts** — removes generic elements, redundant decoration, and anything that looks like "average AI output."

### Critique prompts (specialist layer)
```
You are a design editor with a strong point of view.

Review the generated design below. Identify:
1. Generic/cliché elements (rounded corners on everything, generic blue, stock photography vibes, standard hero section)
2. Redundant decoration (shadows, gradients, borders that don't serve hierarchy)
3. Inconsistencies with the chosen dimensions (typography, color logic, layout)

Then produce a SUBTRACT list: specific elements to remove or simplify. Do NOT add new elements. Taste is curation, not accumulation.

Output: JSON with { removed: [], simplified: [], rationale: string }
```

This pass runs **after** the build, on the generated output, not on the user's prompt. It's what makes Taste feel "opinionated" rather than "average."

### Improve-existing mode — generic report
For existing projects:
1. Scan project files (compressed context)
2. Generate a **short default report** naming what is generic (e.g., "Bootstrap-default buttons," "standard hero with CTA," "generic blue primary")
3. Propose a direction (one of the 6-dimension combos)
4. User confirms → apply the direction by rewriting affected components

---

## 8. Tool Adapters (one-file drop-in)

The CLI (`taste.cli.js`) is the single file users drop into their project. It detects the stack and loads the right adapter:

| Adapter | Detects | Outputs |
|---|---|---|
| React | `package.json` has react | React components + Tailwind config |
| Vue | `package.json` has vue | Vue SFCs + Tailwind |
| Svelte | `package.json` has svelte | Svelte components |
| Vanilla | HTML/CSS/JS project | HTML + CSS files |

Each adapter maps dimension tokens to the target framework's styling system. The CLI is stack-agnostic; adapters are pluggable skills.

---

## 9. Open Core vs Paid Layer Boundary

| Layer | Public (Open Core) | Private (Paid) |
|---|---|---|
| Core engine | ✅ | |
| Dimensions deck (6×6 public options) | ✅ | Full curated deck (additional dimensions/options) |
| Question flow | ✅ | |
| Critique-and-subtract (basic rules) | ✅ | Full critique logic (private skill) |
| Compatibility rules (basic) | ✅ | Full compatibility matrix (private skill) |
| Tool adapters | ✅ | |
| Improve-existing flow | ✅ | |
| Before/after showcase | ✅ | |
| Critique tool (URL/screenshot audit) | | ✅ Paid |
| Generated rule files | | ✅ Paid |
| Premium taste packs | | ✅ Paid |
| Hosted app / accounts | | ✅ Paid (v2+) |

**Enforcement:** Private skills are distributed separately (npm scoped package or downloadable key). The public repo imports them via interface but ships stubs. This keeps the repo "enough to prove it works" while protecting the IP.

---

## 10. Data Models

### User answers
```json
{
  "userId": "anon-or-logged-in",
  "answers": {
    "q1": "printed-book",
    "q2": "muted-earth-centered",
    "q3": "subtle-fade-stagger"
  },
  "seed": "sha256 hash of answers",
  "concept": "a site that feels like a handwritten letter from the roaster",
  "confirmed": true
}
```

### Dimension option
```json
{
  "id": "printed-book",
  "dimension": "typography",
  "label": "Printed book",
  "description": "Calm, serif, spacious, high readability",
  "tokens": {
    "fontHeading": "serif",
    "fontBody": "serif",
    "lineHeight": 1.6,
    "maxWidth": "64ch"
  },
  "compatibility": {
    "forbiddenWith": ["trading-terminal"]
  }
}
```

### Generated rule file (paid output)
```json
{
  "projectId": "...",
  "auditDate": "2026-10-25",
  "genericFindings": ["bootstrap-default-buttons", "generic-blue-primary", "standard-hero-cta"],
  "direction": { "dimensions": [...] },
  "rules": [{ "selector": ".btn", "property": "background", "value": "...", "reason": "..." }],
  "appliedTo": ["src/Button.jsx", "src/Hero.jsx"]
}
```

---

## 11. File Structure (production layout)

```
taste/
├── CLAUDE.md               # Project instructions for Claude Code
├── README.md               # Install, 3-question flow, showcase
├── LICENSE                 # MIT (open core)
├── package.json
├── taste.cli.js            # Single-file drop-in entry
├── core/
│   ├── engine.js
│   ├── sampler.js
│   └── cache.js
├── skills/
│   ├── questions/flow.js
│   ├── dimensions/index.js
│   ├── dimensions/typography.js
│   ├── dimensions/color-logic.js
│   ├── dimensions/layout.js
│   ├── dimensions/motion.js
│   ├── dimensions/voice.js
│   ├── dimensions/wildcard.js
│   ├── critique/subtract.js
│   ├── critique/generic-report.js
│   └── adapters/{react,vue,svelte,vanilla}.js
├── config/taste.schema.json
├── templates/before-after/
├── tests/
│   ├── baseline/           # No-Taste outputs (same brief)
│   ├── draws/              # Same-brief, several draws
│   └── e2e/
└── docs/
    ├── dimensions-deck.md
    ├── compatibility-rules.md
    └── paid-layer-boundary.md
```

---

## 12. Build Plan (3 days → production)

### Day 1: Core files + question flow + improve-existing flow
- Scaffold repo, package.json, CLI entry point (`taste.cli.js`)
- Build `core/engine.js` — orchestrates question → concept → build → critique
- Build `core/sampler.js` — temperature/top-p/seed control
- Build `skills/questions/flow.js` — 3-question multiple-choice CLI flow
- Build `skills/critique/generic-report.js` — improve-existing generic audit
- End-to-end: run a prompt through the flow, get a concept output

### Day 2: Dimensions deck + compatibility rules + tool adapters
- Build `skills/dimensions/index.js` + 6 dimension files (6 options each)
- Encode compatibility rules (forbidden/flagged combos)
- Build `skills/critique/subtract.js` — critique-and-subtract pass
- Build 4 tool adapters (React, Vue, Svelte, Vanilla)
- Wire adapters into CLI stack detection
- End-to-end: answers → dimension combo → built output → subtracted output

### Day 3: Tests + README + publish
- **Baseline tests:** Same brief, no Taste → capture generic outputs
- **Draw tests:** Same brief, several Taste draws → verify distinct outputs
- **Compatibility tests:** Verify forbidden combos are blocked/flagged
- **Performance tests:** Measure latency/cost per draw (target < 25s)
- Write README (install, 3-question flow, before/after showcase)
- Publish to npm (scoped package for public core)
- Document paid-layer boundary (which skills are private)

---

## 13. Testing Strategy

| Test Type | What it verifies | Pass criteria |
|---|---|---|
| Determinism | Same answers → same output | Hash(seed) identical across runs |
| Diversity | Different answers → different outputs | Outputs differ beyond whitespace |
| Distinctiveness | Taste output ≠ baseline output | Baseline and Taste differ on >1 dimension |
| Compatibility | Forbidden combos blocked | Engine rejects or flags incompatible pairs |
| Critique | Subtract removes generic elements | Post-critique output has fewer generic markers |
| Latency | End-to-end < 25s | Measured on CI |
| Cost | Prompt caching hits on static prefix | >70% cache hit rate on repeat draws |

---

## 14. Performance Targets & Benchmarks

| Metric | Target | Measurement |
|---|---|---|
| End-to-end latency | < 25s | time from Q3 to files on disk |
| Question flow | < 2s | 3 questions rendered and answered |
| Prompt cache hit rate | > 70% | Anthropic cache headers on repeat draws |
| Output distinctiveness | > 3 dimensions differ | Same brief, 5 draws, compare dimension assignments |
| File size (single drop-in) | < 50KB | `taste.cli.js` gzipped |

---

## 15. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Outputs still feel generic | Critique-and-subtract pass is mandatory, not optional; dimensions drawn from proven traditions (Swiss, Apple-Braun, brutalism) |
| Too many options overwhelm | Exactly 3 questions, 3–4 options each, concrete plain-language descriptions |
| Paid layer leaks into public repo | Private skills are separate npm package; public repo has interface stubs only |
| LLM cost on repeat use | Prompt caching on static prefix; context compression for improve-existing |
| One-file drop-in breaks on complex stacks | Vanilla adapter as fallback; clear error if stack unsupported in v1 |

---

## 16. Publishing & Distribution

1. **npm package:** `@taste/core` (open core, MIT)
2. **Private package:** `@taste/critique` (paid, key-gated)
3. **CLI install:** `npx @taste/core init` drops `taste.cli.js` into project
4. **Showcase repo:** Before/after examples live in public repo to drive stars/users (the success metric from the One-Pager)

---

## 17. Open Questions / Decisions Needed

1. **Which LLM provider first?** Anthropic Claude (prompt caching mature) vs OpenAI vs local model. Recommendation: Claude for caching + cost control.
2. **Seed derivation:** Hash of answers vs random per draw with user-controlled "re-roll"?
3. **Paid skill distribution:** Scoped npm with auth key, or downloadable binary?
4. **Wildcard dimension:** Fixed list or generated by LLM per draw?

---

## Sources Used

- [Anthropic Prompt Caching Documentation](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Claude Platform: Reducing Cost and Improving Performance](https://claude.com/resources/articles/reducing-cost-and-improving-performance-with-claude-platform)
- [Prompt Caching with Claude](https://claude.com/resources/articles/prompt-caching)
- [Swiss Style (design) — Wikipedia](https://en.wikipedia.org/wiki/Swiss_Style_(design))
- [Swiss Graphic Design: Grids, Type & Examples](https://docs.mew.design/blog/swiss-design-style/)
- [Swiss Brutalism — Design System Specification](https://chromologium.com/systems/swiss-brutalism)
- [Swiss Design Principles for Web Designers](https://swissthemes.design/insights/swiss-design-for-web-designers)
- [Temperature and Top P in Prompt Engineering](https://promptengineering.org/prompt-engineering-with-temperature-and-top-p/)
- [LLM Temperature and Sampling: The Complete 2026 Reference Guide](https://sureprompts.com/blog/llm-temperature-sampling-complete-guide-2026)

---

**Next step:** Review this spec, confirm the architecture and scope, then I'll begin implementing Day 1 (core files + question flow + improve-existing flow).