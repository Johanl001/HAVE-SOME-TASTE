# Senior Frontend Design System — Design Document

**Topic:** Approach A — Dimension-Based Design System for Taste CLI  
**Date:** 2026-11-12  
**Status:** Approved  
**Approach:** Dimension-Based Design System (extends existing Taste architecture)

---

## 1. Architecture

```
Core (TasteEngine) → DimensionRegistry → TokenSystem → BuildPipeline → CriticAgent → Adapters → FileWriter
```

### Components and Responsibilities

| Component | Responsibility | Depends On |
|-----------|---------------|------------|
| **TasteEngine** | Orchestrates full pipeline: question → concept → build → critique → write | DimensionRegistry, TokenSystem, BuildPipeline, CriticAgent, Adapters |
| **DimensionRegistry** | Maps user answers → design dimension options, compatibility rules | — |
| **TokenSystem** | Design token definitions, token application, token validation | DimensionRegistry |
| **BuildPipeline** | Multi-pass LLM pipeline: concept → build → critique → refine | TokenSystem, CriticAgent |
| **CriticAgent** | Senior-level critique: accessibility, responsiveness, visual hierarchy, generic removal | TokenSystem |
| **AdapterBase** | Framework-specific output generation (vanilla/react/vue/svelte) | TokenSystem |
| **ConfigLoader** | Config resolution: CLI > config file > env > defaults | — |
| **QuestionFlow** | 3-question taste flow, readline input | — |

### Design Decisions

- **Extends existing architecture:** The current Taste CLI already has TasteEngine, DimensionRegistry, QuestionFlow, CriticAgent (SubtractSkill), and Adapters. Approach A adds TokenSystem and BuildPipeline as new layers on top.
- **Multi-pass pipeline:** Each LLM call is a focused pass (concept, build, critique, refine) rather than one mega-prompt. This gives senior-level control over output quality.
- **Token-first design:** Design tokens flow through every pass and are consumed by adapters to produce framework-specific code (Tailwind classes, CSS variables, styled-components, etc.).
- **Open-core friendly:** New dimensions, tokens, and adapters can be contributed independently without touching the core engine.

---

## 2. Components

### TasteEngine (extended)
- Orchestrates question flow → concept generation → build pipeline → file writing
- Loads config, creates LLM instance, manages pipeline state
- Existing component, extended to use TokenSystem and BuildPipeline

### DimensionRegistry (extended)
- Maps user's 3 answers to design dimension options (typography, color-logic, layout, motion, voice, wildcard)
- New: Additional dimensions (spacing, borders, shadows, component-styles)
- Encodes compatibility rules (forbidden/flagged combinations)
- Existing component, extended with new dimension categories

### TokenSystem (new)
- Design token definitions with consistent naming (e.g., `--color-primary`, `--font-scale-lg`, `--motion-ease`)
- Token application: converts tokens to framework-specific values (CSS variables, Tailwind config, styled-components themes)
- Token validation: ensures all referenced tokens exist before output generation
- New component

### BuildPipeline (new)
- **Pass 1:** Concept → Build prompt with tokens → Raw output
- **Pass 2:** Raw output + tokens → CriticAgent → Critiqued output
- **Pass 3:** Critiqued output + tokens → LLM → Refined/premium output
- Each pass is a separate LLM call with focused context
- New component

### CriticAgent (extended SubtractSkill)
- Senior-level critique criteria:
  - Accessibility (contrast ratios, focus states, ARIA labels)
  - Responsiveness (breakpoints, fluid typography, touch targets)
  - Visual hierarchy (heading scale, whitespace, grid alignment)
  - Generic removal (rounded corners everywhere, generic blue, standard hero)
  - Design consistency with chosen dimensions
- Existing SubtractSkill, extended with senior-level review criteria

### Adapters (existing)
- **Vanilla:** HTML + CSS files with CSS custom properties
- **React:** React components + Tailwind CSS config
- **Vue:** Vue SFCs + Tailwind CSS
- **Svelte:** Svelte components + scoped CSS
- Each adapter maps dimension tokens to the target framework's styling system

### ConfigLoader (existing)
- Precedence: CLI flags > taste.config.js > env vars > defaults
- Supports ANTHROPIC_API_KEY, OPENROUTER_API_KEY, OPENAI_API_KEY, NVIDIA_API_KEY, LLM_API_KEY
- Supports TASTE_* env vars for all config keys

### QuestionFlow (existing)
- 3-question multiple-choice taste flow
- Readline-based input with Windows-compatible handling
- No typing, no jargon required from user

---

## 3. Data Flow

```
User → taste.cli.js init → QuestionFlow (3 answers)
  → DimensionRegistry (map answers to dimensions + tokens)
  → TasteEngine.generateConcept (LLM pass 1)
  → TasteEngine.build:
    Pass 1: answers + concept + tokens → LLM → raw output
    Pass 2: raw output + tokens → CriticAgent → critiqued output
    Pass 3: critiqued output + tokens → LLM → refined output
  → Adapter (vanilla/react/vue/svelte) → framework-specific files
  → FileWriter → output directory (+ taste-concept.json)
```

### Token Flow
1. User answers → DimensionRegistry determines selected options
2. DimensionRegistry maps options to design tokens
3. Tokens injected into every LLM prompt as context
4. Adapter consumes tokens → applies to framework-specific styling
5. Final output contains consistent token usage across all files

### Config Flow
```
CLI flags > taste.config.js > env vars (TASTE_*, API keys) > defaults in core/config.js
```

### Error Flow
- TasteConfigError: missing API key, invalid config file → user-friendly message
- AnthropicLLMError / OpenAILLMError: API failures, rate limits, timeouts → retry with exponential backoff, then error message
- FileConflictError: existing file without `--force` → suggest `--force` or `--output-dir`
- All errors caught in `main()`, exit code 1, stack trace only in verbose mode

---

## 4. Error Handling & Testing

### Error Handling

| Error Type | Trigger | User Action |
|------------|---------|-------------|
| `TasteConfigError` | Missing API key, invalid config file | Set API key, fix config file |
| `AnthropicLLMError` | Anthropic API failure, rate limit, timeout | Retry with backoff, or try different provider |
| `OpenAILLMError` | OpenAI-compatible API failure (OpenRouter, NVIDIA, etc.) | Retry with backoff, check API key |
| `FileConflictError` | Output file exists without `--force` | Use `--force` or `--output-dir` |

### Testing Strategy

| Test Type | What it verifies | Pass criteria |
|-----------|---------------|---------------|
| Unit tests | Per component (config, tokens, adapter, critic, pipeline) | All unit tests pass |
| Integration tests | Full pipeline with stub LLM | End-to-end produces valid output |
| Determinism tests | Same answers → same output | Hash(seed) identical across runs |
| Diversity tests | Different answers → different output | Outputs differ beyond whitespace |
| Compatibility tests | Forbidden dimension pairs rejected | Engine blocks or flags incompatible pairs |
| Critique tests | Subtract removes generic elements | Post-critique output has fewer generic markers |
| Latency tests | End-to-end under target | Measured on CI |
| CLI tests | `--help`, `--version`, no API key error, unknown command | All CLI commands behave correctly |

---

## 5. Open-Source Contribution Model

### Contribution Areas

| Area | What contributors can add | Barrier to entry |
|------|-------------------------|------------------|
| New dimensions | Typography, color, layout, motion, voice options | Low (pure JS objects) |
| New tokens | Design token definitions | Low (token config) |
| New adapters | Framework-specific output (Angular, Solid, etc.) | Medium (framework knowledge) |
| Critique rules | Senior-level review dimensions | Medium (design expertise) |
| Documentation | Guides, examples, tutorials | Low |
| Tests | Unit, integration, e2e | Low |

### Contribution Workflow
1. Fork the repo
2. Create feature branch from `main`
3. Add feature + tests
4. Run `npm test` (must be 47+ passing)
5. Submit PR with description and before/after screenshots
6. Maintainer review and merge

---

## 6. Future Evolution Path

| Phase | Capability | Example |
|-------|-----------|---------|
| v1 (current) | 3-question flow, 6 dimensions, 4 adapters, critique-and-subtract | Basic taste-driven design generation |
| v2 | Multi-agent critique (accessibility, performance, design) | Senior-level review gates |
| v3 | Premium templates + taste customization | Template-based with taste overlay |
| v4 | Custom dimension marketplace | Community-contributed dimension packs |

---

**Approved:** Yes  
**Next:** Write implementation plan via writing-plans skill
