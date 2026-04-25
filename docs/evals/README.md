# Evals

Durable measurement artifacts for model and prompt decisions.

## What lives here

Each eval is two files paired by date and slug:

- `{date}-{slug}.json` — raw machine-readable rows (one entry per cell)
- `{date}-{slug}.md` — human summary with per-model means, per-sign breakdown, and the decision the data justifies

Plans that produce evals point at the resulting files; PR descriptions cite them. Old runs stay for historical comparison — when you re-run the same eval after shipping a change, you have something to diff against.

## Conventions

- **One date, one slug** per decision. Don't overwrite — append.
- **Commit the data**, not just the summary. The raw rows are small; durability matters more than repo size.
- **Make the script idempotent and resumable.** Network calls are flaky; the runner should checkpoint per cell and pick up where it left off (`--no-resume` to force a clean run).
- **Keep methodology in the summary, not the script comments.** The summary is what someone reads in 6 months when revisiting the decision.

## Current evals

| Date | Slug | What it decided | Plan |
|---|---|---|---|
| 2026-04-25 | `baseline` | Which model PR C should adopt for `reading:generate` | [`2026-04-25-001-...`](../plans/2026-04-25-001-reading-eval-harness-and-model-baseline-plan.md) |
