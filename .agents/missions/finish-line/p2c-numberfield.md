# P2C NumberField — crew report

Status: DONE 2026-09-28. No commits (captain commits).
Pole moved 38/148 → **68/148** (+30). All writes confined to
`packages/reference-lib/src/components/NumberField/` plus required
consumer/fixture migrations (`Field/Field.story.tsx` NumberField fixtures
only, `Showcase.book.tsx`, consumer-smoke template) — see §5.
Other working-tree changes belong to parallel crews.

## 1. Scoreboard

| Runner (observed green, this session) | Result |
| --- | --- |
| Unit `NumberField.test.tsx` | 84/84 (was 54; +30 new) |
| Unit `types.test.tsx` | 5/5 (new NF-TYPE-03 Omit wall) |
| CT React 19 | 27/27, 14 baselines unmodified |
| CT React 18 / 17 | 27/27 each |
| Field CT (handshake) | 105/105 incl. FI-CSS-04, FI-SURF-01, FI-COMP-03 |
| Showcase CT (consumer) | 3/3, snapshots intact |
| `tsc --noEmit` | NumberField clean (5 remaining errors pre-existing in ct.ts/Accordion/Slot) |

Newly proven IDs (30): NF-DOM-01 (rewritten to freeze), NF-DOM-02/03/04/
07/08, NF-SURF-01, NF-FORM-01/02/03/04/05/06/07/08/10/13, NF-A11Y-01/02/
03/05/06, NF-DYNAMIC-03/04, NF-ENV-03/07, NF-STEP-11 (full capability;
was root+authored only), NF-STEP-13 (readOnly branch), NF-COMMIT-03/07/
10, NF-MATH-15. SPEC.md case index + status table updated to 68/148.

## 2. What landed

**PATCHES §4 — Group host.** `NumberField.Group` is now the required
single direct child: `div[role=group][data-reference-field]
[data-reference-number-field]`, owns aria-disabled/aria-invalid,
data-disabled/readonly/required/invalid/empty/editing/focused,
`status="warning"`, and Single-Input focus tracking. Root is a plain
host (role passes through, managed data wins). Render-phase anatomy
diagnostics (missing/duplicate/misplaced, part-specific messages) plus
a layout-effect registry catching nested extras; named parts outside
any Group throw instead of rendering null.

**PATCHES §5-core — form/state pipeline.** New root props
`readOnly/required/invalid/name/form`. Hidden canonical
`input[type=hidden]` (exactly one, root-direct, only when named;
canonical `String(value)`/`""`, mirrors disabled, owns name/form).
Grammar-derived `inputMode` (validate→text, sci/eng→text,
minus-grammar→text, authored-fraction-or-fractional-display-step→
decimal else numeric). Managed invalid union (app ∪ owned-constraint ∪
failed-boundary) surfacing only via aria-invalid/data-invalid; submit
blocked by failed/pending/owned-invalid only (app-invalid alone
submits; readOnly never blocks; disabled omitted natively).
Failed-boundary + pending-request lifecycle (set on invalid/incomplete/
validate-rejected commits and every un-acked request; cleared only by
new edit, echo/authoritative change, unprevented reset). Native
submit/reset listeners scoped via owned-inputs' `.form` (no
document-global lookup); reset re-syncs controlled DOM values behind
React, keeps focus, caret to formatted end. Steppers: aria-controls to
the stable Input id (explicit wins, pinned useId fallback, same-commit
retarget), capability from dirty-aware base + bounds + root/authored
state. Unnamed-Input dev diagnostic (label/aria naming counts; nothing
invented). Vetoed-blur selection resume.

**PATCHES §8 remainder.** NF-DOM-01 CT rewritten to textbox+Group;
type-level managed-Omit wall for all parts (NF-TYPE-03); stable IDs
(NF-DOM-07/NF-ENV-03) incl. cross-root collision diagnostic.

Real bugs fixed along the way: Input's own `id={undefined}` spreading
over the managed id (now stripped); stale click-suppression swallowing
the next keyboard activation after disable-mid-hold (disarmed; at-bound
correctly stays armed); `<label htmlFor>` false-positive unnamed
diagnostic (now counts as named).

## 3. Maintainer-takes (proceed + flag — HQ please rule)

1. **Textbox (HQ call listed): taken as textbox.** Unanimous in
   NumberField.md/TESTS.md/FEATURES.md; engine + proofs are textbox.
2. **Validate: KEEP W-02 reject** (revert + `onInvalidCommit`, no
   onChange). TESTS.md NF-MATH-13/NF-COMMIT-06 want retain-and-report-
   invalid, but W-02 is signed-off, NumberField.md Defaults says reject,
   and the retained `onInvalidCommit` API ("reports rejected validate-
   mode attempts") is incoherent without rejection. NumberField.md
   contradicts itself (Defaults vs body). Flagged; flipping means
   rewriting signed-off tests + killing the API.
3. **Snap lattice: KEEP W-02** (min-anchored, half-up ties,
   lattice-clamped max). TESTS.md freeze wants zero-anchored,
   away-from-zero ties, endpoint preservation (NF-MATH-03/04/09/10/11/
   12). Same rationale as (2); flagged.
4. **No live edit requests this turn.** TESTS.md NF-EDIT-03/05 wants
   live requests; pinned B-19 titles assert commit-only. Needs HQ
   reconciliation (rewrite B-19 titles) — flagged as the key remaining
   behavior gap.
5. **`none` derives inputMode like snap** (NumberField.md specifies only
   validate/snap). Currency-default cents do NOT admit decimals (explicit
   grammar required, NF-COMP-03 direction). Flagged.
6. **`none` has no owned numeric-invalid** (historic clamp-only).
   Flagged.

## 4. Remaining (80 cases)

Intl parser epic (NF-PARSE-*/NF-FORMAT-*), beforeinput/paste/composition/
caret filtering (PATCHES §1 completion: NF-EDIT-02/06/07/08/09/11/12/15/
16), live-request set (§3.4), lattice set (§3.3), validate-retain set
(§3.2), event-order tails (NF-COMMIT-01/02/04/05/09/11, NF-FORM-09/11/
12/14, NF-KEY-06, NF-DYNAMIC-01/02/05, NF-ENV-02/04/06), NF-COMP-*,
NF-MANUAL-* (4 gates). Runner note: `pnpm agent vitest lib -t "X"`
(AGENTS.md form) crashes CAC parsing in this runner rev — `pnpm agent
vt <path>` used instead (same finding as P2F).

## 5. Files touched

- `NumberField/NumberField.tsx` — the work (~600 lines added/rewritten).
- `NumberField/NumberField.test.tsx` — 58 renders migrated to Group,
  2 freeze rewrites (NF-TYPE-03/DOM-06, NF-DOM-05), 30 new tests.
- `NumberField/types.test.tsx` — Group/new-props/Omit wall.
- `NumberField/NumberField.story.tsx` — 12 fixtures migrated + named,
  new `NamedFormFixture`; `__e2e__/NumberField.ct.spec.ts` — chrome
  retargeted root→Group, 4 new titles (NF-DOM-01/02, NF-SURF-01,
  NF-FORM-02). `NumberField.book.tsx` — 6 stories migrated.
- `SPEC.md` — 68/148, gaps/work-order rewritten.
- Handshake migrations (breaking freeze requires them): `Field/
  Field.story.tsx` NumberField fixtures only (testids moved to Group,
  forged state attrs replaced with real root/Group props — untouched
  TokenPicker/Range regions left for their crews), `Showcase.book.tsx`,
  consumer-smoke template. `components.md`/`library-catalog.ts` already
  documented Group — untouched. No snapshot baselines modified anywhere.
