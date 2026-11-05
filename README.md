# Taste

An LLM point-of-view layer that produces distinct, good-looking design outputs
per user — instead of the statistical average every LLM defaults to.

## Install

Drop `taste.cli.js` into your project:

```bash
curl -O https://example.com/taste.cli.js
node taste.cli.js init
```

## How it works

1. Run `node taste.cli.js init`.
2. Answer 3 multiple-choice questions (no typing, no jargon).
3. Taste proposes a one-line concept — confirm or redirect.
4. Taste builds using your chosen design dimensions, then runs a
   critique-and-subtract pass to remove anything generic.
5. You get distinct, opinionated output — not the same palette/layout every time.

## Improve an existing project

```bash
node taste.cli.js critique
```

Produces a short report naming what is generic about your current design, then
proposes a direction to apply.

## Commands

| Command | Purpose |
|---|---|
| `taste init` | Run the 3-question taste flow, generate concept + build |
| `taste critique` | Audit an existing project for generic design markers |

## Scope (v1)

Open core: core engine, question flow, dimensions deck, improve-existing flow,
tool adapters, before/after showcase.

Paid layer (separate): critique tool (URL/screenshot audit), generated rule
files, premium taste packs.

## Before / After Showcase

| Before (generic AI average) | After (Taste opinionated) |
|---|---|
| Generic blue primary, rounded corners everywhere, standard hero section | Single dominant hue, intentional corners, editorial or brutalist layout |
| Bootstrap-default buttons, system font stack | Dimension-matched typography (serif/mono/display), custom scale |
| Centered max-width container, hamburger menu on desktop | Chosen layout: asymmetric grid, card cluster, or newspaper columns |
| No motion or generic fade | Chosen motion: subtle fade, stagger, bounce, or morph |
| Stock-photography vibes | Wildcard accent: paper texture, glitch, hand-drawn borders, gradient mesh |

Every output passes through a mandatory **critique-and-subtract** pass that
removes generic decoration so results feel distinct, not average.

## Tests

Run the test suite (determinism, diversity, compatibility, cache, latency):

```bash
npm test
```

Tests live in `tests/`:
- `tests/draws/` — determinism & diversity (same answers → same output, different → different)
- `tests/e2e/` — engine build, compatibility rules, cache layer, subtract, latency
- `tests/baseline/` — no-Taste generic outputs for comparison

## License

MIT
