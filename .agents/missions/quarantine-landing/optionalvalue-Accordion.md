# Optional-value Accordion crew log

Mission: HQ optional-value directive (API-STANCE.md EXCEPTION 2026-09-26 refined).
Branch: `reference-system` (never switch; never commit).
Scope: Accordion dir + this log + in-repo Accordion-consumer call sites only. Read-only elsewhere.

## Checkpoint plan

1. [x] Recon: inventory Accordion dir + all defaultValue consumers + out-of-scope hits
2. [ ] `Accordion.tsx`: delete `defaultValue` (type + logic + validation); `value?` optional docs
3. [ ] Migrate consumers: `Accordion.book.tsx` (2), `Accordion.story.tsx` Multiple, `Showcase.book.tsx`, `Accordion.test.tsx` (2 rewrites + freeze pin)
4. [ ] Scrub docs: `Accordion.md`, `SPEC.md`, `TESTS.md` (DECISIONS.md historical entries stay)
5. [ ] Grep-clean verify (Accordion scope)
6. [ ] `pnpm agentct Accordion` unit+e2e green, snapshots unmodified
7. [ ] UX review (nested ux-designer; self-review by method if pool-full + flag)
8. [ ] Report

## Recon (checkpoint 1)

Current shape: dual-mode. `value?` optional already; `defaultValue?` seeds
`internalValue`; neither-provided zero = `null` (single) / `[]` (multiple).
Omitted-value behavior is already pinned by AC-DOM-07 (single) + AC-MULTI-07
(multiple) — the rewrite keeps that exact zero, no new zero invented.

In-scope consumers (all `defaultValue`, all to migrate):
- `Accordion.book.tsx:10` SingleExpansion `defaultValue="item-1"` → controlled `useState('item-1')`
- `Accordion.book.tsx:40` MultipleExpansion `defaultValue={['a','b']}` → controlled `useState(['a','b'])`
- `Accordion.story.tsx:66` Multiple `defaultValue={['item-1','item-2']}` → controlled `useState` (SNAPSHOTTED — initial paint must stay both-open)
- `Accordion.test.tsx:1038` single defaultValue test → omitted-value zero+toggle pin
- `Accordion.test.tsx:1076` multiple defaultValue test → omitted-value zero+toggle pin
- `Showcase.book.tsx:411` DisclosureRow `defaultValue="item-1"` → controlled `useState` (matches file's tabsValue pattern)

In-scope docs to scrub: `Accordion.md`, `SPEC.md`, `TESTS.md`. `FEATURES.md`/`PATCHES.md` clean. `DECISIONS.md` stays (directive-exempt).

No-op (controlled `value`, no `defaultValue`): `Collapsible.story.tsx` AccordionNest, `Collapsible.test.tsx`, all other stories, `__e2e__` spec, `components.md` (its hits are NumberField/DateField/Calendar).

OUT OF SCOPE (read-only; will break or go stale — flagging, not touching):
- `packages/reference-mcp/tools.md:156` — Accordion example uses `defaultValue="item-1"`
- `matrix/tests/mcp/tests/unit/get-component.test.ts:96` — asserts Accordion props contain `defaultValue` (will FAIL after this change; MCP crew must update)
- `packages/reference-mcp/src/pipeline/library-catalog.ts` — Accordion example already controlled (fine); check whether its `props` list carries defaultValue (did not edit; MCP crew owns regen)

## Progress
- [x] Checkpoint 2: `Accordion.tsx` — prop type + destructure + both validation branches + seeding init deleted; Omit trimmed; docs reworded. Grep-clean.
- [x] Checkpoint 3: consumers migrated — book (2 → controlled `useState`), `Multiple` story (→ controlled `useState`, both-open paint preserved), Showcase DisclosureRow (→ controlled `useState`), tests (2 rewritten as omitted-value zero pins + 1 `@ts-expect-error` freeze pin).
- [x] Checkpoint 4: docs scrubbed — `Accordion.md`, `SPEC.md` (+ optional-value note), `TESTS.md`. `DECISIONS.md` untouched (exempt).
- [x] Checkpoint 5: grep-clean in scope except intentional freeze pin (mirrors Listbox/Splitter/Slider idiom) + exempt DECISIONS.md.
- [x] Checkpoint 6: `pnpm agentct Accordion` — Unit 26/26, E2E 20/20 react19, snapshots unmodified (git-clean).
- [x] Checkpoint 7: nested ux-designer review — Look APPROVED (no change); Feel all approved (controlled, omitted-value zero, onChange both modes, deletion per-brief, keyboard unchanged); A11y no new issues (one pre-existing focus-ring observation, not a failure). Artifacts: 4 baselines + 2 run end-states + code diff.

## Files changed (mine only)
- `packages/reference-lib/src/components/Accordion/Accordion.tsx`
- `packages/reference-lib/src/components/Accordion/Accordion.test.tsx`
- `packages/reference-lib/src/components/Accordion/Accordion.story.tsx`
- `packages/reference-lib/src/components/Accordion/Accordion.book.tsx`
- `packages/reference-lib/src/components/Accordion/Accordion.md`
- `packages/reference-lib/src/components/Accordion/SPEC.md`
- `packages/reference-lib/src/components/Accordion/TESTS.md`
- `packages/reference-lib/src/components/Showcase.book.tsx` (DisclosureRow consumer only)
- `.agents/missions/quarantine-landing/optionalvalue-Accordion.md` (this log)

## Flagged (out of scope, read-only)
- `packages/reference-mcp/tools.md:156` — Accordion example still uses `defaultValue` (stale doc).
- `matrix/tests/mcp/tests/unit/get-component.test.ts:96` — asserts Accordion props contain `defaultValue`; WILL FAIL until MCP crew updates it.
- Pre-existing a11y observation from UX review: no visible focus ring on programmatically focused trigger (`disclosureChrome.ts` has `_hover` but no focus-visible styling) — chrome-level, separate brief, not caused here.
