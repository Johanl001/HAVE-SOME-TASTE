# Taste

An LLM point-of-view layer that produces distinct, opinionated design output per user — instead of the statistical average every LLM defaults to.

Taste is a CLI (`taste.cli.js`) you drop into any frontend project. It runs a 3-question taste flow, generates a one-line design concept you confirm, then builds framework-specific files (vanilla / React / Vue / Svelte) through a multi-pass pipeline: concept → build → critique-and-subtract → write. Every output passes through a mandatory critique-and-subtract pass that removes generic AI decoration, so results feel distinct, not average.

## Install

```bash
# Option 1: clone this repo and run directly
git clone https://github.com/Johanl001/HAVE-SOME-TASTE.git
cd HAVE-SOME-TASTE
node taste.cli.js init

# Option 2: drop taste.cli.js into your own project
curl -O https://raw.githubusercontent.com/Johanl001/HAVE-SOME-TASTE/main/taste.cli.js
node taste.cli.js init
```

## Quick start

```bash
node taste.cli.js init
```

1. Answer 3 multiple-choice questions (no typing, no jargon): how it should feel to read, how it should look at a glance, how it should move.
2. Taste proposes a one-line concept — confirm it or redirect.
3. Taste builds output for your detected stack (vanilla / React / Vue / Svelte) and writes files plus `taste-concept.json`.

To skip the confirmation prompt (CI / scripts):

```bash
node taste.cli.js init --yes
```

## Providers & API keys

Taste works with any LLM provider. The default is Anthropic; OpenAI-compatible providers (OpenRouter, NVIDIA NIM, OpenAI, etc.) go through the `OpenAILLM` adapter.

| Provider | `--llm-provider` | API key env var | Default base URL |
|---|---|---|---|
| Anthropic (default) | `anthropic` | `ANTHROPIC_API_KEY` | `https://api.anthropic.com/v1` |
| OpenRouter | `openrouter` | `OPENROUTER_API_KEY` | `https://openrouter.ai/api/v1` |
| NVIDIA NIM | `nvidia` | `NVIDIA_API_KEY` | `https://integrate.api.nvidia.com/v1` |
| OpenAI | `openai` | `OPENAI_API_KEY` | `https://api.openai.com/v1` |
| Any OpenAI-compatible | any other | `LLM_API_KEY` | custom via `--llm-base-url` |

Set the key in the project folder where you run Taste (a `.env` file works if you load it, or export it in your shell):

```bash
export OPENROUTER_API_KEY=sk-or-...
node taste.cli.js init --llm-provider openrouter --model nvidia/nemotron-3-ultra-550b-a55b:free
```

Or pass the key directly:

```bash
node taste.cli.js init --api-key sk-or-... --llm-provider openrouter
```

API-key precedence: `--api-key` flag > provider-specific env var (`ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `LLM_API_KEY`) > error.

### Recommended model for free-tier OpenRouter

NVIDIA Nemotron 3 Ultra on OpenRouter free tier:

```bash
node taste.cli.js init --llm-provider openrouter \
  --model nvidia/nemotron-3-ultra-550b-a55b:free \
  --timeout 120000
```

OpenRouter can be slow on the free tier — raise `--timeout` (default 30000ms) to 120000ms, or set `TASTE_TIMEOUT=120000`.

## CLI reference

```text
taste init [options]      Run the 3-question taste flow and generate a concept + build
taste critique [options]  Audit an existing project for generic design markers
taste build [options]     Build from a saved concept file
```

Options:

| Flag | Short | Purpose |
|---|---|---|
| `--api-key <key>` | `-k` | LLM API key |
| `--model <name>` | `-m` | Model name (default: `claude-3-5-sonnet-20241022` for anthropic, `gpt-4o-mini` for openai-compatible) |
| `--llm-provider <p>` | `-p` | Provider: anthropic, openai, nvidia, openrouter (default: anthropic) |
| `--llm-base-url <url>` | `-u` | Custom base URL for OpenAI-compatible providers |
| `--max-tokens <n>` | | Max output tokens (default: 2000) |
| `--temperature <n>` | | Sampling temperature 0–1 (default: 0.7) |
| `--output-dir <dir>` | `-o` | Output directory (default: current directory) |
| `--force` | `-f` | Overwrite existing files without prompting |
| `--yes` | `-y` | Auto-confirm concept (non-interactive) |
| `--config <path>` | | Path to `taste.config.js` |
| `--verbose` | `-v` | Enable debug logging |
| `--help` | `-h` | Show help |
| `--version` | | Show version |

Examples:

```bash
taste init
taste init --yes --output-dir ./dist
taste critique --output-dir ./reports
taste build --concept taste-concept.json --output-dir ./dist
taste init --llm-provider openrouter --model nvidia/nemotron-3-ultra-550b-a55b:free --timeout 120000
```

## Config file

Create `taste.config.js` in your project root to set defaults (CLI flags still win):

```js
export default {
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.7,
  maxTokens: 2000,
  outputDir: './dist',
  llmProvider: 'anthropic',
};
```

Config precedence: **CLI flags > `taste.config.js` > env vars > defaults** in `core/config.js`.

Env vars: `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `LLM_API_KEY`, `TASTE_LLM_PROVIDER`, `TASTE_LLM_BASE_URL`, `TASTE_MODEL`, `TASTE_MAX_TOKENS`, `TASTE_TEMPERATURE`, `TASTE_OUTPUT_DIR`, `TASTE_RETRIES`, `TASTE_TIMEOUT`.

## Stack detection

Taste reads your `package.json` dependencies and picks an adapter:

- `react` → React components + Tailwind CSS config
- `vue` → Vue SFCs + Tailwind CSS
- `svelte` → Svelte components + scoped CSS
- nothing matched → vanilla HTML + CSS with CSS custom properties

Design tokens (`--color-primary`, `--font-scale-lg`, `--motion-ease`, …) flow through every LLM pass and are consumed by the adapter, so output stays consistent across files.

## Commands

### `taste init`

Runs the question flow, generates a concept, asks for confirmation, builds, and writes files:

```
taste-concept.json        # saved answers, concept, config, and seed
<adapter output>          # framework-specific files for your stack
```

If a file already exists, Taste throws `FileConflictError`. Re-run with `--force` to overwrite, or `--output-dir ./taste-output` to write into a subfolder.

### `taste critique`

Audits an existing project for generic design markers (rounded corners everywhere, generic blue, standard hero, stock-photo vibes) and writes `taste-report.json` with a summary and recommended direction.

```bash
taste critique --output-dir ./reports
```

### `taste build`

Rebuilds from a previously saved concept without re-running the question flow:

```bash
taste build --concept taste-concept.json --output-dir ./dist
```

## Design dimensions

The 3 answers map to 6 dimensions:

| Dimension | Source |
|---|---|
| typography | q1: how it should feel to read |
| color-logic | q2: how it should look at a glance |
| motion | q3: how it should move |
| layout | default (`centered-column`) |
| voice | default (`friendly-neighbor`) |
| wildcard | seeded draw from answers (same answers → same wildcard) |

Forbidden pairs are rejected at build time: `brutalist + muted-earth`, `trading-terminal + handwritten-letter`.

## Tests

Run the full suite (determinism, diversity, compatibility, cache, CLI, latency, writer, LLM adapters):

```bash
npm test
```

Tests use a stub LLM, so no API key is required. 47 tests, all passing.

## Open source

Taste is open core (MIT). Contributions are welcome: new dimensions, new adapters (Angular, Solid, …), critique rules, docs, and tests. See [CONTRIBUTING.md](CONTRIBUTING.md) and the [open-source contribution model](docs/superpowers/specs/2026-11-12-senior-frontend-design-system-design.md#5-open-source-contribution-model) in the design spec.

## License

MIT
