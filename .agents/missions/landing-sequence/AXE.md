# AXE infra — objective log

IN PROGRESS — crew: axe-infra. Box: 60 min from 16:05 UTC; hard stop on new work 16:55, report by 17:05.

## 16:17 — Scope + prior art (recon complete)

**Scope:** repo-level axe infra that the A11Y scanner halves plug into. Infra
only — no component edits, no API surface, no NumberField contact.

**"Halves" decoded (evidence):** per-component `*-A11Y-01` cases are each split
into a structural half (landed: explicit role/name/state asserts) and a
scanner half (blocked). The contract text is Listbox TESTS.md `LB-A11Y-01`:
"run the **configured accessibility scanner** after their relevant state
changes. Assert no violations plus the case-specific roles, names, states,
and relationships; automated checks supplement rather than replace focus and
callback assertions."

**Prior art — what exists:**
- Zero axe anywhere: no `axe` in any package.json, nothing in
  node_modules/.pnpm (verified by search + ls).
- Handmade stand-ins per component: Combobox `scanA11y(page)` in-spec
  (`Combobox.ct.spec.ts:173`, ID/dangling-ref/required-attr checks);
  Listbox/Splitter/Menu/Menubar explicit-assert sweeps with `no axe in repo`
  NOTE comments (Listbox.ct.spec.ts:1890, Splitter.ct.spec.ts:1509,
  Menu/SPEC.md:99, Menubar/TESTS.md:211).
- Waiting scanner halves: LB-A11Y-01, CB-A11Y-01 ("same bar as LB-A11Y-01"),
  SD-A11Y-01 (PATCHES: "checker green"), SP-A11Y-01 (PATCHES #7 "checker sweep
  execution"), CA-A11Y-01 (PATCHES #3), MN-A11Y-01, MB-A11Y-01, TO-A11Y-01,
  TB-A11Y-01, TR-A11Y-01, AC-A11Y-01, NF-A11Y-* (FORM lane — no touch),
  TT-A11Y-01 (unchecked). Finish-line p2a: "LB-A11Y-01 scanner half →
  repo-level axe infra (none configured)."

**Where it plugs in:** Playwright CT in `packages/reference-lib`. Specs import
`../../../../playwright/ct` and mount gallery stories; canonical runner is
`pnpm agentct` (test-component skill; daemon gallery :3101). Matrix/FF-WebKit
is SWEEP's lane, not mine.

**Feasibility:** registry reachable — `@axe-core/playwright@4.13.0`,
`axe-core@4.13.0`, peer `playwright-core >= 1.0.0` vs repo
`@playwright/test@1.62.1`. Clean.

## Plan (solution is clear and clean → implement)

1. `pnpm --dir packages/reference-lib add -D @axe-core/playwright` (devDep
   only: not shipped, not API surface; pulls axe-core transitively).
2. New `packages/reference-lib/playwright/axe.ts`: `expectNoAxeViolations(
   page|locator, { include?, disableRules?, options? } )` — AxeBuilder
   wrapper, repo-default rule set, readable violation formatting. Import
   mirrors ct.ts (`../../../../playwright/axe`).
3. Proof: TEMP probe spec under Listbox `__e2e__` (deleted after green),
   mounting `A11yShapes` + a Combobox shape, run via `pnpm agentct -g`;
   quote output. Report-only first to learn the default rule-set reality
   (dark-scheme gallery vs color-contrast), then pin the default.
4. Final report here + result. Never commit. If any step blocks >15 min, log
   as HQ question and ship the plan instead.

## 16:50 — LANDED (verified, uncommitted — captain commits)

**Landed (4 files, my lanes only):**
- `packages/reference-lib/playwright/axe.ts` (NEW): `expectNoAxeViolations(
  page, { include?, exclude?, disableRules?, withTags? })`,
  `scanAxe()` (report-only), `formatAxeViolations()`,
  `DEFAULT_DISABLED_RULES`. Usage: `import { expectNoAxeViolations } from
  '../../../../playwright/axe'` — mirrors the ct.ts import every spec uses.
- `packages/reference-lib/package.json`: +2 devDeps (`@axe-core/playwright
  ^4.13.0`, `axe-core ^4.13.0`). Exports/files/deps untouched — not API
  surface, not shipped.
- `pnpm-lock.yaml`: +axe entries; the 53 deleted lines are stale
  `esbuild@0.27.3`-keyed peer snapshots pruned on re-resolve (0.28.2
  snapshots already in-tree remain). No referenced package removed; CT green
  after the install.
- This log.

**Design decision (probe data, not grind):** default-disables the
page-skeleton trio (`landmark-one-main`, `page-has-heading-one`, `region`) —
a bare gallery mount can never satisfy them and landmarks/headings are
application-owned (same ownership line Combobox documents for input names).
Caller `disableRules` merge over the default. Red output is a compact string
report, not an AxeResults object dump.

**Proof quoted (canonical runner, temp probe since deleted):**
- `pnpm agentct Listbox --e2e -g "AXE-PROBE"` → `3 passed`, `react19:
  3 passed | 0 failed`: Listbox A11yShapes `axe: 0 violations (passes=24)`;
  Combobox BothLog closed green; injected unnamed `<button>` caught as
  `button-name [critical]` with a loud `Accessibility scan found violations`
  message.
- `tsc --noEmit`: zero errors in `playwright/axe.ts`. (Tree still red in
  files I never touched: ct.ts×2, Accordion×1, NumberField×11,
  Slot×2 — sibling WIP/pre-existing, not mine.)
- One `@axe-core/playwright` Page-type bridge (`page as unknown as AxePage`,
  single documented line): its playwright-core peer resolves to workspace
  1.63 while CT runs 1.62 — runtime-compatible, proven by the greens.

**Handoff finding for the CB-A11Y-01 scanner-half author (not infra's to
fix):** BothLog with the popover OPEN reports `aria-input-field-name
[serious]` on the input — the story input is unlabeled, consistent with the
spec's own "names are application-owned" note. The scanner half dispositions
it (label the fixture or scope the scan); helper supports both via
include/exclude/disableRules.

**HQ questions:** none. No 15-min blocks hit.

**Resume checklist:** `git status` shows only AXE.md, package.json,
pnpm-lock.yaml, axe.ts as mine (+ REDS.md = REDS crew). Captain: verify with
`pnpm agentct Listbox --e2e -g "LB-A11Y-01"` (structural half untouched) +
re-add any one-line `expectNoAxeViolations(page)` probe if firsthand proof
wanted, then commit.

## Captain verification + landing

- Firsthand temp probe (deleted after, never committed): green path passes,
  injected unnamed button caught as `button-name` — 2/2 on React 19.
- `pnpm agentct Listbox --e2e -g "LB-A11Y-01"` → 1/1 (structural half intact).
- Lockfile audited: removals are only the 3 stale esbuild@0.27.3 peer
  snapshot blocks; axe entries added. No referenced package removed.
- Committed `584782b5e` (axe.ts + package.json + lock). AXE.md closeout next.
- Scanner halves (LB/CB/SD/SP/CA/MN/MB/TO/TB/TR/AC-A11Y-01) now unblocked on
  infra; each case author dispositions fixture labeling via include/exclude/
  disableRules. Note CB open-popover `aria-input-field-name` handoff in log.
