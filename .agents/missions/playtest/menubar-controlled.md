# Menubar controlled-only fix

Status: COMPLETE

## Violation
`Menubar.tsx` shipped dual-mode `value`/`defaultValue` + `isControlled` branching,
violating `docs/MISSIONS/API-STANCE.md` (controlled-only; no `defaultValue`
props anywhere; Menubar has no Accordion/Tabs optional-value exception).

## Fix
- `MenubarProps`: `value: MenubarValue` required (null = all closed),
  `onValueChange: (value) => void` required. Deleted `defaultValue`,
  `internalValue` useState, `isControlled`/`controlledRef` branching.
  Kept the identical-value guard in `requestValue`.
- `Menubar.test.tsx`: added `ControlledMenubar` harness (forwardRef,
  `initialValue` + `seen` recorder); all renders controlled. The
  already-controlled same-value test untouched.
- `Menubar.story.tsx`: Basic/Submenu/Loop/Rtl/Disabled now hold
  `value` state + `onValueChange={setValue}`; Controlled story unchanged.
- `SPEC.md` / `TESTS.md`: dual-mode language removed (no `defaultValue`,
  no "both modes", MB-OPEN-04 is a controlled cycle).
- `menubar-nav.test.ts`, `Menubar.ct.spec.ts`: verified zero
  dual-mode references — no changes needed.
- Did NOT rename `onValueChange` (HQ HOLD). Did NOT touch `Menu/` or `src/index.ts`.
- No in-repo Menubar consumers outside the dir (only barrel re-export + comments).

## Files
- packages/reference-lib/src/components/Menubar/Menubar.tsx
- packages/reference-lib/src/components/Menubar/Menubar.test.tsx
- packages/reference-lib/src/components/Menubar/Menubar.story.tsx
- packages/reference-lib/src/components/Menubar/SPEC.md
- packages/reference-lib/src/components/Menubar/TESTS.md

## Verify (reference-system, no commit)
- `pnpm --dir packages/reference-lib sync` — clean
- `pnpm agentct Menubar --unit` — 17 passed, 0 failed
  (Menubar.test.tsx 9 + menubar-nav.test.ts 8)
- `pnpm agentct Menubar --e2e` (React 19) — 23 passed, 0 failed
