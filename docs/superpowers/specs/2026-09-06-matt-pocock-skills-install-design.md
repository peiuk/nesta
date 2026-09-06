# Design: Global agent skill stack (mattpocock + Karpathy)

Date: 2026-09-06  
Status: pending user review of this written spec

## Goal

Install a personal Cursor skill/rule stack that:

1. Makes [mattpocock/skills](https://github.com/mattpocock/skills) **engineering** suite available globally
2. Applies [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) behavioral guidelines globally (always on)
3. Prefers mattpocock for engineering workflows; keeps Superpowers as a supplement

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| matt scope | Personal global (`~/.cursor/skills`), not project `.cursor/skills` |
| matt skill set | Full `skills/engineering` suite |
| Karpathy | Install **together** with matt (user chose option 1) |
| Karpathy delivery | Global **user rule** (`alwaysApply` equivalent) + copy skill to `~/.cursor/skills/karpathy-guidelines/` |
| Coexistence | Karpathy = always-on behavior; matt = engineering process skills; Superpowers = supplement |
| matt install method | Approach A: `npx skills@latest add mattpocock/skills -g -a cursor` |
| Repo setup | **Out of scope** — no `/setup-matt-pocock-skills` on firstleaf yet; no firstleaf `.cursor/rules/` for Karpathy (global user rule covers all projects) |

## Layering model

```
Always on (every session):
  Karpathy guidelines — think / simplify / surgical / goal-driven

When engineering work fits:
  mattpocock skills — grill-with-docs, tdd, implement, code-review, diagnosing-bugs, …

Supplement:
  Superpowers — brainstorming/planning when useful or when user asks

Explicit per-repo setup (later):
  /setup-matt-pocock-skills → docs/agents/*, CONTEXT.md layout
```

## Architecture

### A. mattpocock engineering (global skills)

```
npx skills@latest add mattpocock/skills
  → -g -a cursor
  → all skills under skills/engineering (include setup-matt-pocock-skills)

Must end up discoverable at:
  C:\Users\Administrator\.cursor\skills\<skill>\SKILL.md

If installer only writes ~/.agents/skills/, copy or symlink into ~/.cursor/skills/.
```

### B. Karpathy guidelines (global rule + skill)

Official Cursor note: project use copies `.cursor/rules/karpathy-guidelines.mdc`.  
We want **all projects**, so:

1. **User rule** via Cursor personal rules — content from the upstream `.mdc` body (four principles), always applied.
2. **Personal skill** — copy `skills/karpathy-guidelines/` to `~/.cursor/skills/karpathy-guidelines/` for explicit `/karpathy-guidelines` style invocation.

Do **not** add firstleaf project `.cursor/rules/` in this phase (avoids duplicating always-on text in one repo only).

### C. Priority user rule (matt vs Superpowers)

Separate short user rule:

- Feature / TDD / review / debugging → prefer mattpocock engineering skills
- Superpowers → supplement when not covered, or when user asks
- Karpathy guidelines remain always-on behavioral baseline

## Components / steps

1. Run matt installer (engineering suite, global, Cursor).
2. Verify `~/.cursor/skills/` for engineering skills; fix path if needed.
3. Copy Karpathy `SKILL.md` tree into `~/.cursor/skills/karpathy-guidelines/`.
4. Add Karpathy user rule (full four principles).
5. Add matt-priority user rule (short).
6. Smoke-check: list skills dirs + confirm user rules via rule list API.

## Out of scope

- matt productivity skills (unless pulled as dependency)
- firstleaf `docs/agents/`, `CONTEXT.md`, Agent skills block
- `/setup-matt-pocock-skills`
- Disabling Superpowers
- Committing global install artifacts into firstleaf (only this design doc lives in-repo)

## Error handling

- matt installer fails → retry / fix Node; fallback manual copy of `skills/engineering/*`
- Cursor path bug → symlink/copy from `~/.agents/skills/`
- Karpathy fetch fails → use fetched content from this design session / raw GitHub URLs
- Duplicate always-on noise → prefer single user rule for Karpathy; do not also add project rule this phase

## Success criteria

1. Engineering skill dirs under `C:\Users\Administrator\.cursor\skills\`
2. `karpathy-guidelines` skill present under the same skills root
3. Two user rules exist: Karpathy always-on + matt engineering preference
4. firstleaf unchanged except this design doc

## Follow-up (not this phase)

Run `/setup-matt-pocock-skills` per repo when ready for tracker-backed `to-spec` / `to-tickets` / `implement`.
