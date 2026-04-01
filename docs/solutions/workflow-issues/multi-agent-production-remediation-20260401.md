---
title: "Multi-Agent Production Remediation: 16-Agent Review → 7-Squad Execution"
date: 2026-04-01
category: workflow-issues
module: full-stack
problem_type: workflow_issue
component: development_workflow
severity: high
applies_when:
  - Inheriting a broken or neglected production app
  - Performing a comprehensive quality overhaul across all domains
  - Need to audit AND remediate in a single session
tags: [multi-agent, production-remediation, parallel-squads, review-agents, horoscope-app, compound-engineering]
---

# Multi-Agent Production Remediation: 16-Agent Review → 7-Squad Execution

## Context

Inherited a broken Next.js horoscope app (gettodayshoroscope.com) that was returning 500s on all API routes. The initial fix (edge runtime removal + Next.js CVE) restored functionality, but revealed deep systemic issues: fabricated AI quotes, generic content, exposed debug endpoints, 82MB video payload, zero retention mechanics, contradictory brand copy, and no CI/CD pipeline. Rather than fixing issues one at a time, deployed a multi-wave agent strategy: audit everything in parallel, synthesize findings, then execute fixes with parallel squads.

## Guidance

### The Two-Phase Pattern: Review Waves → Execution Squads

**Phase 1: Review Waves (10 + 6 agents)**

Wave 1 deployed 10 agents in parallel across different review domains:
- 5 technical agents (architect, engineer, PM, QA, design/UX) — each with Opus model for depth
- 5 user persona agents (wellness seeker, skeptical engineer, astrology creator, older reader, philosophy student) — each with Sonnet for speed

Wave 2 deployed 6 expert strategy agents:
- Design director, CPO, UX researcher, content strategist, CRO specialist, brand strategist

**Key principle: zero file overlap between agents.** Each agent reads different files and evaluates different concerns. No agent writes code — they return findings as text.

**Phase 2: Execution Squads (3 + 4 squads)**

Sprint 1: 3 parallel squads (content pipeline, security/infra, frontend/growth)
Sprint 2: 4 parallel squads (content, infrastructure, design, SEO)

Each squad gets:
- A branch name
- Exact file ownership (no overlap)
- Numbered implementation units from the plan
- Explicit scope boundaries ("you OWN / you DO NOT OWN")

### Agent Brief Engineering

The quality of agent output is directly proportional to brief quality. Key elements:

1. **Role declaration** — "You are a SENIOR SOFTWARE ARCHITECT" not "Please review the code"
2. **Specific files to read** — List exact paths, not "read the codebase"
3. **Live data** — Include API URLs to fetch, not just static code analysis
4. **Structured output format** — Request tables, severity ratings, specific file:line references
5. **Anti-patterns** — Tell agents what NOT to do ("Do NOT touch files outside your scope")

### Synthesis Is the Critical Step

16 agents produce ~50 pages of findings. The synthesis must:
1. Deduplicate (multiple agents flag the same issue)
2. Prioritize by cross-agent consensus (if 8/10 agents flag it, it's P0)
3. Group by file ownership for squad assignment
4. Resolve conflicts (design agent wants X, engineer says Y)

### Merge Strategy for Parallel Squads

Squad A merges first (most files changed). Squad B and C rebase onto the new main before merging. Conflicts are resolved by taking the newer code for shared files, since each squad touched different concerns within those files (e.g., Squad A changed generation logic, Squad B changed CORS — no semantic conflict).

## Why This Matters

**Time compression**: 16 review agents running in parallel complete in ~5 minutes what would take a single reviewer 2-3 days. 7 execution squads complete in ~10 minutes what sequential implementation would take 3-5 days.

**Coverage**: No single reviewer catches everything. The philosophy student caught fabricated quotes that 15 other agents missed. The older-user persona identified sign-ordering UX that technical agents overlooked. Cross-domain coverage is the primary value of parallel agents.

**Consistency**: Each squad works from the same synthesized plan. No drift between what was decided and what was implemented.

## When to Apply

- Inheriting or auditing a production app with multiple quality domains to evaluate
- Performing a major overhaul that touches backend, frontend, content, and infrastructure
- When review scope is too broad for a single agent's context window
- When implementation can be parallelized across non-overlapping file sets

## Examples

### Review Agent Spawn (10 agents, single message)

```
Agent(name="architect", model=opus, prompt="You are a SENIOR SOFTWARE ARCHITECT reviewing...")
Agent(name="engineer", model=opus, prompt="You are a SENIOR SOFTWARE ENGINEER doing a deep code review...")
Agent(name="persona-wellness", model=sonnet, prompt="You are SARAH, 34, yoga instructor...")
// ... 7 more agents, all run_in_background=true
```

### Execution Squad Brief Structure

```
ROLE: Squad A Lead — Content Pipeline
PROJECT: /path/to/project
PLAN: Read docs/plans/plan-file.md — execute Units A1-A5

## UNITS
### A1: [specific task with exact files]
### A2: [specific task with exact files]

## SCOPE BOUNDARIES
- You OWN: [exact file list]
- You DO NOT OWN: [files other squads handle]

## GIT
- Work on branch: fix/squad-a-content-pipeline
```

### Findings Synthesis Table

```
| Finding              | Agents Flagging | Severity |
|---------------------|----------------|----------|
| Stale cache         | 10/16          | P0       |
| Fabricated quotes   | 1/16           | P0       |
| Debug endpoints     | 3/16           | P0       |
| No sign preference  | 4/16           | P1       |
```

## Session Stats

| Metric | Value |
|--------|-------|
| Review agents deployed | 16 (10 + 6) |
| Execution squads | 7 (3 + 4) |
| PRs merged | 15 |
| Lines added | ~4,400 |
| Lines removed | ~2,500 |
| Net codebase change | -100 lines (smaller AND more capable) |
| P0 findings | 6 (all resolved) |
| P1 findings | 10 (all resolved) |
| New pages created | 92 (12 sign + 12 weekly + 66 compatibility + pricing + home) |
| CI/CD pipeline | GitHub Actions with dual Vercel project deployment |

## Related

- docs/plans/2026-03-31-001-fix-horoscope-production-remediation-plan.md
- docs/plans/2026-03-31-002-feat-product-design-overhaul-plan.md
- docs/PROJECT_CONTEXT.md
