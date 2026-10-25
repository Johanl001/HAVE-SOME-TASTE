# Taste: Phase 1 One-Pager

Dhanraj Deshmukh | Phase 1 draft | October 23, 2026

## Thesis

Every LLM builds the same product because it follows the statistical average. Taste gives it what it lacks: a point of view, the power to say no, and a way to be different on every run.

## Who it is for

Students, designers, developers, and freelancers who build with AI and are tired of getting the same palette, layout, and feature set every time.

## The promise

Same prompt, two different users, two distinct and good-looking results. Existing projects can be pulled out of the generic look too.

## How it works, from the user's side

1. The user installs Taste into their tool by dropping one file into the project.
2. They give their normal prompt, or point Taste at an existing project.
3. Taste asks about three questions, each answered by picking from options rather than typing. The options are concrete and described in plain words, for example "calm and spacious, like a printed book" versus "dense and fast, like a trading terminal." No jargon.
4. The model states a one-line concept (for example, "a site that feels like a handwritten letter from the roaster"). The user confirms or redirects.
5. It builds using a drawn combination of dimensions (type, color logic, layout, motion, voice), then runs a critique-and-subtract pass.
6. For existing projects, it first produces a short default report naming what is generic about the current design, then proposes a direction and applies it.

## Version 1 scope

**In:** the core layer, design and frontend only, the dimensions deck, the question flow, improve-existing mode, versions for the major tools, and a before/after showcase.

**Out:** writing, code, and other domains; a marketplace; accounts; a hosted app.

## Product direction

Open core. The repo stays free and builds trust and reach. The paid layer sits on top of it, and the strongest candidate is a critique tool: upload a URL or screenshot, get a specific audit of what is generic and how to fix it, plus a generated rule file tailored to that project. Premium curated taste packs come after that. A marketplace comes later, because it needs supply and an audience that do not exist yet.

The private parts are the full curated deck, the compatibility rules, and the critique logic. The public repo shows enough to prove it works.

## Adjustments to the original plan

**Time.** Two to three days in total will not build everything above. It will build a credible v1: the core, a smaller deck (six dimensions with about six strong options each), the question flow, and a handful of before/after tests. The randomness tool and the hosted product become v1.1 and later. A small, sharp repo beats a large mediocre one, since a shallow deck is exactly the failure Taste is fighting.

**Success.** It is fine to want everything, but one thing should be optimized first because it changes what gets built. The recommendation is stars and users from a strong showcase, since that feeds every other goal: portfolio, opportunities, a startup pitch, and income later.

**Design experience.** Taste is curation, and design is a new area, so the deck will draw on real, proven traditions (Swiss and editorial layouts, functional minimalism in the Apple and Braun lineage, brutalism, and others) instead of inventing taste from nothing. The specifications can be drafted for review. The founder's role is editor: look at results and say which ones are alive and which are dead. The fundamentals (hierarchy, spacing, type, color) get taught as each card is built.

## Three-day shape

- **Day 1:** core files, question flow, improve-existing flow.
- **Day 2:** the dimensions deck and compatibility rules, plus tool-specific files.
- **Day 3:** tests (same brief, several draws, plus a no-Taste baseline), README, and publish.
