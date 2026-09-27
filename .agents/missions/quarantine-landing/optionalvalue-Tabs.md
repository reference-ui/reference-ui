# Optional-value Tabs crew — log

## Checkpoint plan
1. Read stance + Tabs.tsx + tests/story/book/docs (incremental) — DONE (Tabs.tsx 1-805, stance, grep map)
2. Grep in-repo Tabs defaultValue consumers (stories/books/Showcase/tests/TSX)
3. Edit Tabs.tsx: delete defaultValue prop + logic; value optional; uncontrolled seeds first tab
4. Rewrite Tabs.test.tsx defaultValue tests → optional-value pins
5. Scrub Tabs.md/SPEC.md/FEATURES.md/book comment (DECISIONS.md history stays)
6. `pnpm agentct Tabs` unit+e2e green, snapshots unmodified
7. UX review (nested ux-designer or self-review by method + flag)
8. Report

## Progress
- Step 1: Tabs.tsx read. Current shape: dual-mode `value?` + `defaultValue?: string | null`, uncontrolled seeds `defaultValue ?? ''` (nothing selected when omitted). defaultValue sites: Tabs.tsx (5), Tabs.book.tsx (1 comment), Tabs.md (2), Tabs.test.tsx (5 + 2 native-input, keep), SPEC.md (5), FEATURES.md (3), DECISIONS.md (1, stays).
- Step 2: consumer grep — ZERO in-repo `<Tabs … defaultValue` consumers outside the Tabs dir (repo-wide combined regex empty; other hits are Accordion/native inputs/infra). No call-site migration needed.
- Step 3: Tabs.tsx — `defaultValue` deleted (type + destructure + init); `value?` optional; uncontrolled `internalValue: string | null` (null = unseeded), natural-zero seed effect pins first-enabled, no onChange. Grep-clean.
- Step 4: Tabs.test.tsx — 5 proofs rewritten (first-tab seed + no onChange on seed; disabled-lead seed; arrows funnel; stick-no-reseed; controlled exact) + 1 type-deletion pin. Native `<input defaultValue>` x2 kept (React's own prop).
- Step 5: scrubbed Tabs.md, SPEC.md, FEATURES.md, Tabs.book.tsx. DECISIONS.md history stays per directive.
- Step 6: `pnpm agentct Tabs` — Unit 35/35, E2E 10/10 react19, snapshots unmodified (all `expected`).
- Step 7: nested ux-designer review — Look APPROVE, Feel APPROVE x3, A11y no findings. Non-fail observation: uncontrolled first paint is unselected for one frame until the passive seed pins (kept passive for consistency with sibling repair effects; reviewer's explicitly author's call).
- Step 8: done. Branch untouched (reference-system), no commits.
