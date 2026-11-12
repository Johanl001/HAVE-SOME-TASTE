# Contributing to Taste

Taste is an open-source CLI that generates distinct, opinionated design output per user. We welcome contributions of all sizes — new dimensions, new adapters, critique rules, docs, tests, and bug fixes.

## Ways to contribute

| Area | What you can add | Barrier to entry |
|---|---|---|
| New dimensions | Typography, color-logic, layout, motion, voice, wildcard options | Low — pure JS objects in `skills/dimensions/` |
| New tokens | Design token definitions and token mapping | Low — token config |
| New adapters | Framework-specific output (Angular, Solid, Svelte, Vue variants) | Medium — framework knowledge |
| Critique rules | Senior-level review dimensions for the subtract pass | Medium — design expertise |
| Documentation | Guides, examples, tutorials, README improvements | Low |
| Tests | Unit, integration, determinism, diversity, compatibility | Low |

## How to contribute

1. **Fork the repo** and create a feature branch from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Add your feature plus tests.** New dimensions and adapters should live under `skills/dimensions/` and `skills/adapters/` respectively, following the existing module shape (named exports + default export object).

3. **Run the test suite** — all 47 tests must pass:

   ```bash
   npm test
   ```

4. **Run lint / format checks** if you added code, and keep the style consistent with surrounding files.

5. **Commit** with a clear message describing the *why*:

   ```bash
   git commit -m "Add angular adapter with Tailwind config output"
   ```

6. **Open a pull request** against `main` with a description and before/after screenshots or sample output when the change affects generated design output.

## Pull request process

1. Open the PR from your fork's feature branch to `main`.
2. A maintainer reviews the PR — expect feedback on behavior, tests, and style.
3. CI runs on every PR (`npm test` plus lint). Fix any failures.
4. Once approved, a maintainer merges. Squash-merge is preferred so `main` stays clean.

## Ground rules

- No dependencies beyond Node built-ins where avoidable. The LLM adapters use native `fetch`.
- Every user-facing behavior needs a test (unit or integration).
- Keep breaking changes out of `1.x` unless discussed in an issue first.
- Be respectful in issues, PRs, and discussions. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Questions

Open an issue with the "question" label, or start a discussion. We're happy to help you ship your first contribution.
