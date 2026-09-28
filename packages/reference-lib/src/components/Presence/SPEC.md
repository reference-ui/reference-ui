# Presence SPEC

Current freeze, cases, and proof. Design narrative: [Presence.md](./Presence.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright CT: `__e2e__/Presence.ct.spec.ts` (React 19; `pnpm agentct Presence`)
Unit: `Presence.test.tsx` + `elementRef.test.tsx` (colocated Vitest)

## Legend

- `[x]` A passing Playwright or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts the prototype, not the freeze.

TESTS.md checkboxes mean **specified**, not proven.

## Next agent

**API and TESTS.md are the contract.** Presence owns CSS animation +
transition exit. Overlay already uses it; do not re-audit Overlay teardown
here.

Visual polish is not this gate. No public `forceMount`, no enter/leave class
API, no extra host node.

### Surface

| Axis | Freeze |
| :--- | :--- |
| Props | `present` + one element child |
| Wait | CSS animation **and** transition **and** finite GSAP tweens; instant unmount when duration is 0 / none |
| Nested | Child Presence completion gates parent unmount |
| Skip | Hidden document |

### Status (2026-09-28 — p2f-presence: CT browser matrix complete, GSAP kept)

| | |
| :--- | :--- |
| Engine | Hardened. Multi-effect exit machine + stable refs + child validation (CT + colocated-proven). |
| Production | **No.** (CT browser matrix complete; production call is HQ/captain's) |
| Named `[x]` | 60 / 60 (45 CT specs + 20 colocated unit its; `PR-GSAP-01` added this round) |
| Playwright | 45 (CT, React 19) |
| Vitest | 20 colocated (`PR-DOM-06`–`08`, `PR-REF-01`–`05`, `PR-ENV-01`–`03`, `PR-NEST-04`, `PR-EXIT-07`–`08`) |

### Gaps & incoherence

- ~~Kernel also waits on **GSAP** (`finiteGsapTweens`). Freeze is CSS only.~~
  **Resolved 2026-09-28:** kept as a deliberate extension. Collapsible is a
  proven in-repo consumer (`<Presence present>` + GSAP-owned
  `animateCollapse` exit; `CO-PRES-02`/`03`). Documented in
  [Presence.md](./Presence.md), proven by `PR-GSAP-01`. Do not delete.
- Nested registration uses React Context, not the Zustand substrate
  `hooks.md` names. (Untouched this round — needs an HQ call.)
- ~~`PR-DOM-02` / `03` exist as unit titles; TESTS.md marks them `[browser]`.~~
  **Resolved 2026-09-28:** re-proven in the CT browser runner.

### Vendor

**Lift:** `vendor/radix-primitives/packages/react/presence` (machine, ref
regressions); Base UI `useAnimationsFinished` + collapsible panel interrupt
races; Zag presence (zero-duration, hidden tab); Headless `getAnimations()`
nesting as contrast.

**Leave:** enter/leave class orchestration, `forceMount`.

### Case index

- `[x]` `PR-DOM-01`–`05` (CT e2e; `06`–`08` colocated unit)
- `[x]` `PR-INSTANT-01`–`07` (CT e2e)
- `[x]` `PR-TRANSITION-01`–`06` (CT e2e)
- `[x]` `PR-ANIMATION-01`–`07` (CT e2e)
- `[x]` `PR-RACE-01`–`06` (CT e2e)
- `[x]` `PR-NEST-01`–`03`, `PR-NEST-05`, `PR-NEST-06` (CT e2e); `PR-NEST-04` (colocated unit, StrictMode)
- `[x]` `PR-EXIT-01`–`06` (CT e2e); `PR-EXIT-07`, `PR-EXIT-08` (colocated unit)
- `[x]` `PR-REF-01`–`05` (colocated unit)
- `[x]` `PR-ENV-01`–`03` (colocated unit)
- `[x]` `PR-COMP-01`–`03` (CT e2e)
- `[x]` `PR-GSAP-01` (CT e2e; added 2026-09-28)

### Work order

1. ~~Port browser matrix for INSTANT / TRANSITION / ANIMATION / RACE / NEST /
   REF / ENV from TESTS.md.~~ Done 2026-09-28 (CT is the browser runner on
   this branch; `matrix/lib` does not exist).
2. ~~Decide GSAP: freeze it as an implementation detail or delete it.~~
   Done 2026-09-28: kept as a documented deliberate extension.
3. Align nested registration with `hooks.md`.
4. ~~Move true DOM cases off JSDOM.~~ Done 2026-09-28 (`PR-DOM-02`/`03` re-proven in CT).

### Won't do

Overlay Presence timing (`OV-PRES-*` / `OV-RESTORE-*`). Visual enter/leave
classes.

### Done when

Every TESTS.md case ID appears in a passing **browser or specified unit**
title and is `[x]` here.
