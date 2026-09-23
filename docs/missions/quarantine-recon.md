# Quarantine recon report

Filed 2026-09-22. Source: read-only `quarantine-recon` crew (worktree
untouched; all reads via `git log/show/diff/ls-tree/grep` against the
ref). Feeds Mission Four kickoff.

## 1. The branch

- **Name:** `components-quarantine` (local-only — no `origin/` tracking ref; nothing to fetch, and nothing to push to).
- **Tip:** `89850d1c8` — `chore: fix types in components for stricter inference` (2026-09-11 21:20 +0100). Note: local `create-docs` points at the same commit.
- **Base:** `7aea45265` (2026-09-10, "make SPEC.md the executable driver") — identical merge-base against both `main` and `reference-system`.
- **Shape:** 21 commits, all single-day 2026-09-11, one-line messages, no bodies: 18 × `feat(<component>): freeze <Component> component and prove SPEC cases` (slot → presence → roving-focus → field → switch → announcer → collapsible → listbox → tabs → tree → slider → splitter → number-field → accordion → menu → calendar → combobox → date-field), then 3 infra commits (workspace finalize, docs deps, type fixes).
- **Containment:** ancestor of **neither** `main` nor `reference-system`. Never merged; no reverts/fixups/WIP markers on the branch itself.

## 2. Size of the productionization corpus

`git diff --stat 7aea45265..components-quarantine` → **140 files, +54,481 / −5,557**. Split:

| Corpus | Files | Churn | New test cases (by `it(`/`test(` count, branch vs base) |
|---|---|---|---|
| `matrix/lib/tests/e2e/*.spec.ts` (Playwright, 1 added + 16 modified) | 17 | +12,901 / −677 | **~824 new** (862 on branch vs 38 pre-existing; biggest: calendar 110, number-field 93, menu 88) |
| `matrix/lib/tests/unit/*` (Vitest, 16 added + 2 modified) | 18 | +10,109 / −23 | **~299 new** (336 vs 37; biggest: slot +18, number-field 51, combobox 47, tabs 30 — all-new files) |
| `matrix/lib/src/*.tsx` fixtures (1 added + 17 modified) | 18 | +11,410 / −383 | n/a — SPEC-case fixtures importing `@reference-ui/lib` (e.g. `switch.tsx` 618 lines of `SW-DOM-*` state) |
| `packages/reference-lib` | 77 | +19,219 / −4,442 | 19 new colocated (Presence 11 + RovingFocus 8, both added files); rest rewritten (see §3) |
| Misc (`reference-docs`, pipeline-runner, lockfile, `split_commits.sh`) | ~10 | ~+1k | — |

No CT (`__e2e__`), no snapshots/`.snap` anywhere in the branch diff — the "production-grade tests" are matrix unit + matrix e2e + SPEC-case IDs (`SW-TYPE-01`, `PR-REF-04`, `RF-TYPE-0x`…), plus 2 new colocated suites. Total new executable cases ≈ **1,120+**.

## 3. Per-component inventory (lib only)

Every freeze commit mixes **source rewrite + SPEC touch + test work** — there are no test-only commits. Format: `source.tsx +/− | new helper | colocated test | matrix unit/e2e +lines`:

- **Slot** `e04a64c8f`: Slot.ts 41/35, no colocated test; matrix unit +654, no e2e file.
- **Presence** `77ea89ba0`: Presence.tsx 187/58; **Presence.test.tsx ADDED (+330, 11 its)**; unit +335, e2e +519.
- **RovingFocus** `088e4a70c`: .tsx 650/154; **RovingFocus.test.tsx ADDED (+200, 8 its)**; unit +201, e2e +850.
- **Field** `3b2afd0b1`: Field.tsx only 11/1 — but **drive-by edits to shared theme**: `core/theme/primitives/forms/field.ts` +17, `focus-visible.ts` +9/−3 (blame lands here); unit +45, e2e +627.
- **Switch** `7bed212af`: Switch.tsx 80/45, no colocated test change; unit +207, e2e +367.
- **Announcer** `a19418ed3`: .tsx 120/24; colocated 138/6 (12 its, TO-ANN→ANN prefixed); **Announcer.md +109, TESTS.md +283 ADDED**; unit +162, e2e +723 (added file).
- **Collapsible** `43f0b03cc`: .tsx 267/180; unit +958, e2e +490.
- **Listbox** `dcefd8d85`: .tsx 977/190; unit +204, e2e +1067.
- **Tabs** `a49fc0626`: .tsx 632/257; colocated 31/22 (2 its); unit +1181, e2e +610.
- **Tree** `b8b5f1aff`: .tsx 904/422; unit +258, e2e +810.
- **Slider** `0b1388d87`: .tsx 929/410; **slider-math.ts ADDED +186**; colocated 2/2 (no-op); unit +350, e2e +808.
- **Splitter** `c7bdd1f7c`: .tsx 978/467; **splitterMath.ts ADDED +552**; unit +512, e2e +1106.
- **NumberField** `975fec1ae`: .tsx **2270/290** (largest single-file rewrite); unit +1215, e2e +1087.
- **Accordion** `569d00567`: .tsx 303/47; unit +1031, e2e +487.
- **Menu** `42b1a2c35`: .tsx 1307/123; **menu-intent.ts ADDED +221**; colocated **35/87 — net deletion**; unit +262, e2e +788.
- **Calendar** `b19c73bee`: .tsx 1817/477; **iso.ts +303, week.ts +222, grid.ts +130 ADDED**; unit +558, e2e +1084.
- **Combobox** `c6fae977a`: .tsx 1366/259; colocated 16/2; unit +1527, e2e +890.
- **DateField** `1150c8e6e`: .tsx 1725/246; **parse.ts ADDED +270**; unit +449, e2e +588.
- Tail commits: `3e15622c6` (Showcase.book, lib index `DateRangeValue` export, matrix vitest.config, pipeline-runner, `split_commits.sh`), `f2c6e00567` (docs only), `89850d1c8` (type-only 14/14 across 6 files, incl. a Backdrop annotation).

## 4. The "mangling" (diff-evidenced)

Source edits are **mixed into every freeze commit**, not separated. Exhibits:

1. **Uncontrolled mode deleted** (breaking API change): Switch dropped `defaultChecked` + internal state — `checked` is now *required*; Slider dropped `defaultValue`/`internalValue` (diff-wide: `defaultChecked` +0/−4, `defaultOpen` +0/−15, `defaultValue` +18/−52).
2. **Motion/visuals stripped**: Switch.Thumb lost its inline `transform: translateX(...)` + `transition` (the slide animation); the auto-thumb fallback renders a bare `Span` instead of `SwitchThumb`. Diff-wide: `transition` +10/−13, `transform` +4/−9.
3. **Focus styling neutered in shared theme** (`field.ts`, via the Field commit): added `outline:none / boxShadow:none / borderColor:transparent` to `_focusVisible` and a new `&[data-focus-visible]` block — focus rings suppressed globally; `focus-visible.ts` narrowed field propagation to text inputs only. Blast radius extends beyond frozen components.
4. **Interaction state removed**: Slider lost `localFocusVisible`/`isThumbPressed`; test-probing scaffolding added instead (`Symbol.for('@reference-ui/Switch.Thumb')`, `__referencePart`, `hasStructuralThumb` fragment-walker).
5. **Colocated interaction tests replaced with static assertions**: `Menu.test.tsx` deleted keyboard-nav/Escape-focus-restore/click-to-close tests and substituted role/attribute snapshot-style checks (`role=menu`, `aria-checked`); suite renamed to "unit proofs". Tabs/Slider/Combobox colocated diffs are near-trivial (2–31 lines) while their sources were rewritten 600–1400 lines — i.e. colocated coverage did not keep pace with the rewrites.
6. Drive-bys outside frozen scope: `Overlay/parts/Backdrop.tsx` 1/1 (type annotation, harmless), `Showcase.book.tsx`, lib `index.ts`. No Overlay freeze commit exists.

## 5. Related docs

- `docs/bugs/` and `docs/missions/` **do not exist on the branch** (created later on main/reference-system). No doc on any ref names `components-quarantine`.
- `git grep -i quarantine <branch>` → **zero hits**. The one "cursed" hit on the branch (`packages/reference-rs/src/tasty/README.md:246` — "AST code is cursed…") is unrelated color, not this incident.
- `quarantine` hits under `reference-system:docs/**` (operation-forge/overmatch wording quarantines, operation-jettison `ATM-LEAF-05`, VOYAGE logs) are all mutation-testing/ATM terminology — unrelated to this branch.

## 6. Assessment: salvageable vs suspect

- **Salvageable (high value, lift with care):** the matrix corpus — 16 added unit files (~273 cases) and ~824 new e2e cases with SPEC-case IDs, plus the 18 fixture files. Caveat: fixtures/e2e were written against the *mangled* APIs (e.g. required `checked`, `SW-DOM-*` states), so they encode mangled behavior in places and need re-targeting, not blind copying. The 2 added colocated suites (Presence, RovingFocus) and Announcer's TESTS.md look genuinely additive. Pure extractions (`slider-math.ts`, `splitterMath.ts`, `iso/week/grid.ts`, `parse.ts`, `menu-intent.ts`) are likely the cleanest source to salvage but need diffing against current equivalents.
- **Suspect (do not lift):** all 18 rewritten `*.tsx` sources (uncontrolled-mode removal, stripped motion/focus styling, probing scaffolding); the shared-theme focus edits from the Field commit; the rewritten colocated Menu/Tabs/Slider/Combobox tests (weakened coverage); the tip type-fix commit only makes sense atop the rewrites.

## 7. Pull commands for the next crew (read-only)

```bash
MB=7aea45265; Q=components-quarantine
git diff --stat $MB..$Q -- packages/reference-lib matrix/lib/tests   # scope
git show $Q:matrix/lib/tests/unit/switch.test.tsx                     # any test file
git show $Q:matrix/lib/src/switch.tsx                                 # any fixture
git show $Q:packages/reference-lib/src/components/Switch/Switch.tsx  # mangled source
git diff $MB..$Q -- packages/reference-lib/src/components/Menu/Menu.test.tsx  # weakened test
git diff $MB..$Q -- packages/reference-lib/src/core/theme/primitives/forms/   # theme blast radius
for c in $(git log --format=%h --reverse $MB..$Q); do git show --stat --oneline $c; done  # all 21 commits
```
