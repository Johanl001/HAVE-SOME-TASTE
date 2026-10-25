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

## License

MIT
