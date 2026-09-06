# Global mattpocock + Karpathy Skills Installation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install mattpocock engineering skills and Karpathy guidelines into the user's personal Cursor environment so they apply across all projects.

**Architecture:** Use the official `npx skills` installer for mattpocock into `~/.cursor/skills` (global, Cursor agent). Manually copy the Karpathy skill into the same skills root, and add two Cursor user rules (Karpathy always-on behavior + matt engineering preference). No firstleaf per-repo setup in this phase.

**Tech Stack:** Node/npm (`npx skills@latest`), Cursor user rules API (`cursor_dialog`), Windows paths under `C:\Users\Administrator\.cursor\skills\`

## Global Constraints

- Scope is **personal global only** — do not write project `.cursor/skills/` or firstleaf `.cursor/rules/`
- Install matt **engineering** suite (+ `grilling` dependency); do not install the full productivity/writing/general catalog
- Do **not** run `/setup-matt-pocock-skills` on firstleaf
- Do **not** disable Superpowers
- Do **not** git commit unless the user explicitly asks
- Prefer `--copy` for Cursor on Windows if symlinks fail
- Success = skills present under `C:\Users\Administrator\.cursor\skills\` + two user rules listed

## File map

| Path | Role |
|------|------|
| `C:\Users\Administrator\.cursor\skills\<skill>\SKILL.md` | Installed global skills (matt + karpathy) |
| Cursor user rules (via `cursor_dialog`) | Always-on Karpathy + matt preference |
| `docs/superpowers/specs/2026-09-06-matt-pocock-skills-install-design.md` | Approved spec (already written) |
| `docs/superpowers/plans/2026-09-06-matt-karpathy-skills-install.md` | This plan |

---

### Task 1: Install mattpocock engineering skills globally

**Files:**
- Create: `C:\Users\Administrator\.cursor\skills\<each-engineering-skill>\` (via installer)
- Verify: `C:\Users\Administrator\.cursor\skills\*\SKILL.md`

**Interfaces:**
- Consumes: Node/npm, network access to GitHub
- Produces: Global Cursor skill directories for the engineering set listed below

- [ ] **Step 1: Ensure skills directory exists**

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.cursor\skills" | Out-Null
```

Expected: directory exists with no error.

- [ ] **Step 2: Install engineering skills (non-interactive)**

Run from any directory:

```powershell
npx skills@latest add mattpocock/skills -g -a cursor -y --copy `
  -s ask-matt `
  -s code-review `
  -s codebase-design `
  -s diagnosing-bugs `
  -s domain-modeling `
  -s grill-with-docs `
  -s grilling `
  -s implement `
  -s improve-codebase-architecture `
  -s prototype `
  -s research `
  -s resolving-merge-conflicts `
  -s setup-matt-pocock-skills `
  -s tdd `
  -s to-spec `
  -s to-tickets `
  -s triage `
  -s wayfinder `
  -s wizard
```

Notes:
- `grilling` is included because `grill-with-docs` depends on it (productivity primitive, required).
- `--copy` avoids Windows symlink issues.

Expected: installer reports skills installed for agent `cursor` at global scope.

- [ ] **Step 3: Verify install paths**

```powershell
npx skills@latest list -g -a cursor --json
Get-ChildItem "$env:USERPROFILE\.cursor\skills" -Directory | Select-Object -ExpandProperty Name
$required = @(
  'ask-matt','code-review','codebase-design','diagnosing-bugs','domain-modeling',
  'grill-with-docs','grilling','implement','improve-codebase-architecture','prototype',
  'research','resolving-merge-conflicts','setup-matt-pocock-skills','tdd','to-spec',
  'to-tickets','triage','wayfinder','wizard'
)
$have = Get-ChildItem "$env:USERPROFILE\.cursor\skills" -Directory | Select-Object -ExpandProperty Name
$missing = $required | Where-Object { $_ -notin $have }
if ($missing) { Write-Host "MISSING: $($missing -join ', ')"; exit 1 } else { Write-Host "ALL_REQUIRED_PRESENT" }
Get-ChildItem "$env:USERPROFILE\.cursor\skills\setup-matt-pocock-skills\SKILL.md","$env:USERPROFILE\.cursor\skills\tdd\SKILL.md" | Select-Object FullName,Length
```

Expected: `ALL_REQUIRED_PRESENT`; `SKILL.md` files exist with non-zero length.

- [ ] **Step 4: Repair path if Cursor dir empty but agents dir populated**

Only if Step 3 fails and `$env:USERPROFILE\.agents\skills` (or similar) has the skills:

```powershell
$srcRoot = "$env:USERPROFILE\.agents\skills"
$dstRoot = "$env:USERPROFILE\.cursor\skills"
New-Item -ItemType Directory -Force -Path $dstRoot | Out-Null
Get-ChildItem $srcRoot -Directory | ForEach-Object {
  $dst = Join-Path $dstRoot $_.Name
  if (-not (Test-Path $dst)) {
    Copy-Item -Recurse -Force $_.FullName $dst
  }
}
```

Re-run Step 3 verification. Expected: `ALL_REQUIRED_PRESENT`.

- [ ] **Step 5: Checkpoint — do not commit**

Global files are outside the git repo. Do not create a git commit for this task.

---

### Task 2: Install Karpathy skill into global skills

**Files:**
- Create: `C:\Users\Administrator\.cursor\skills\karpathy-guidelines\SKILL.md`

**Interfaces:**
- Consumes: raw GitHub content from `multica-ai/andrej-karpathy-skills`
- Produces: discoverable `karpathy-guidelines` skill

- [ ] **Step 1: Create skill directory**

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.cursor\skills\karpathy-guidelines" | Out-Null
```

- [ ] **Step 2: Download SKILL.md**

```powershell
$dest = "$env:USERPROFILE\.cursor\skills\karpathy-guidelines\SKILL.md"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/multica-ai/andrej-karpathy-skills/main/skills/karpathy-guidelines/SKILL.md" -OutFile $dest -UseBasicParsing
Get-Item $dest | Select-Object FullName,Length
```

Expected: file exists, length > 500 bytes, frontmatter contains `name: karpathy-guidelines`.

- [ ] **Step 3: Verify content marker**

```powershell
Select-String -Path "$env:USERPROFILE\.cursor\skills\karpathy-guidelines\SKILL.md" -Pattern "Think Before Coding|Simplicity First|Surgical Changes|Goal-Driven Execution"
```

Expected: all four principle headings match.

- [ ] **Step 4: Checkpoint — do not commit**

---

### Task 3: Add Karpathy always-on user rule

**Files:**
- Create: Cursor user rule titled `Karpathy behavioral guidelines` (via `cursor_dialog`)

**Interfaces:**
- Consumes: `cursor_dialog` list/add
- Produces: always-applied personal rule with the four principles

- [ ] **Step 1: List existing user rules**

Use `cursor_dialog` with `item=rule`, `scope=user`, `action=list`.

If a rule already titled like `Karpathy` / `karpathy-guidelines` exists with the same content, skip Step 2 (or update instead of duplicate).

- [ ] **Step 2: Add the Karpathy user rule**

Use `cursor_dialog` `action=add` with:

- `title`: `Karpathy behavioral guidelines`
- `content`: exactly the body below (four principles; always-on behavioral baseline)

```markdown
Behavioral guidelines to reduce common LLM coding mistakes. Bias toward caution over speed; for trivial tasks, use judgment.

## 1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First
Minimum code that solves the problem. Nothing speculative.
- No features beyond what was asked.
- No abstractions for single-use code.
- No flexibility/configurability that wasn't requested.
- No error handling for impossible scenarios.
- If 200 lines could be 50, rewrite.

## 3. Surgical Changes
Touch only what you must. Clean up only your own mess.
- Don't improve adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style.
- Mention unrelated dead code; don't delete it unless asked.
- Remove orphans YOUR changes created; don't remove pre-existing dead code unless asked.
- Every changed line should trace to the user's request.

## 4. Goal-Driven Execution
Define success criteria. Loop until verified.
- Prefer tests-first / verifiable checks over vague "make it work".
- For multi-step work, state brief plan with verify checks per step.
```

- [ ] **Step 3: Re-list rules and confirm**

`cursor_dialog` list again. Expected: rule titled `Karpathy behavioral guidelines` is present.

---

### Task 4: Add matt engineering preference user rule

**Files:**
- Create: Cursor user rule titled `Prefer mattpocock engineering skills`

**Interfaces:**
- Consumes: `cursor_dialog`
- Produces: priority rule for engineering workflows vs Superpowers

- [ ] **Step 1: List rules (avoid duplicates)**

If an equivalent preference rule already exists, skip add / update in place.

- [ ] **Step 2: Add preference rule**

`cursor_dialog` `action=add`:

- `title`: `Prefer mattpocock engineering skills`
- `content`:

```markdown
When doing feature work, TDD, code review, or debugging in Cursor:
- Prefer mattpocock engineering skills under ~/.cursor/skills (e.g. grill-with-docs, tdd, implement, code-review, diagnosing-bugs, to-spec, to-tickets).
- Keep Karpathy behavioral guidelines as the always-on baseline (think, simplify, surgical edits, goal-driven verification).
- Use Superpowers as a supplement for brainstorming/planning when useful, or when the user explicitly asks for Superpowers.
- Do not run setup-matt-pocock-skills unless the user asks to configure a specific repo.
```

- [ ] **Step 3: Confirm both rules listed**

Expected titles present:
1. `Karpathy behavioral guidelines`
2. `Prefer mattpocock engineering skills`

---

### Task 5: End-to-end smoke check

**Files:**
- Read-only verification of skills + rules

**Interfaces:**
- Consumes: outputs of Tasks 1–4
- Produces: pass/fail report for the user

- [ ] **Step 1: Skills smoke script**

```powershell
$root = "$env:USERPROFILE\.cursor\skills"
$required = @(
  'ask-matt','code-review','codebase-design','diagnosing-bugs','domain-modeling',
  'grill-with-docs','grilling','implement','improve-codebase-architecture','prototype',
  'research','resolving-merge-conflicts','setup-matt-pocock-skills','tdd','to-spec',
  'to-tickets','triage','wayfinder','wizard','karpathy-guidelines'
)
$have = Get-ChildItem $root -Directory | Select-Object -ExpandProperty Name
$missing = $required | Where-Object { $_ -notin $have }
$bad = @()
foreach ($n in $required) {
  $p = Join-Path $root "$n\SKILL.md"
  if (-not (Test-Path $p)) { $bad += $n }
}
"missing_dirs=$($missing -join ',')"
"missing_skill_md=$($bad -join ',')"
if (-not $missing -and -not $bad) { "SMOKE_SKILLS_OK" } else { "SMOKE_SKILLS_FAIL"; exit 1 }
```

Expected: `SMOKE_SKILLS_OK`

- [ ] **Step 2: Rules smoke**

`cursor_dialog` list; confirm both titles from Task 4 Step 3.

Expected: both present → `SMOKE_RULES_OK`

- [ ] **Step 3: Confirm firstleaf not polluted**

```powershell
Test-Path "C:\Users\Administrator\Documents\agent\firstleaf\.cursor\skills"
Test-Path "C:\Users\Administrator\Documents\agent\firstleaf\.cursor\rules\karpathy-guidelines.mdc"
Test-Path "C:\Users\Administrator\Documents\agent\firstleaf\docs\agents"
```

Expected: all `False` (this phase must not create these).

- [ ] **Step 4: Report to user**

Tell the user:
- How many skills installed under `~\.cursor\skills`
- Both user rules are active
- Next optional step: run `/setup-matt-pocock-skills` in a chosen repo when ready

---

## Spec coverage self-check

| Spec requirement | Task |
|------------------|------|
| matt global engineering install via npx | Task 1 |
| Path verification / Cursor path repair | Task 1 Steps 3–4 |
| Karpathy skill copy to `~/.cursor/skills` | Task 2 |
| Karpathy always-on user rule | Task 3 |
| matt preference user rule | Task 4 |
| Smoke check + no firstleaf setup | Task 5 |
| Out of scope: setup-matt / productivity catalog / commits | Explicitly excluded in constraints + task checkpoints |
