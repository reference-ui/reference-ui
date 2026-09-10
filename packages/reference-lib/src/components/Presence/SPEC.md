# Presence SPEC

Current freeze, cases, and proof. Design narrative: [Presence.md](./Presence.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/presence.spec.ts`
Unit: `matrix/lib/tests/unit/presence.test.tsx`
Page: `/presence`

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
| Wait | CSS animation **and** transition; instant unmount when duration is 0 / none |
| Nested | Child Presence completion gates parent unmount |
| Skip | Hidden document |

### Status (2026-09-10)

| | |
| :--- | :--- |
| Engine | Partial. Anim/transition listeners exist. |
| Production | **No.** |
| Named `[x]` | 8 / 48 (browser smokes + thin unit DOM) |
| Playwright | 5 |
| Vitest | 3 (`PR-DOM-01`–`03`, JSDOM — not the browser contract) |

### Gaps & incoherence

- Kernel also waits on **GSAP** (`finiteGsapTweens`). Freeze is CSS only.
  Document that as a deliberate extension or remove it.
- Nested registration uses React Context, not the Zustand substrate
  `hooks.md` names.
- `PR-DOM-02` / `03` exist as unit titles; TESTS.md marks them `[browser]`.
  Unit is not the browser contract.

### Vendor

**Lift:** `vendor/radix-primitives/packages/react/presence` (machine, ref
regressions); Base UI `useAnimationsFinished` + collapsible panel interrupt
races; Zag presence (zero-duration, hidden tab); Headless `getAnimations()`
nesting as contrast.

**Leave:** enter/leave class orchestration, `forceMount`.

### Case index

- `[x]` `PR-DOM-01` (e2e + unit), `PR-INSTANT-01`, `PR-TRANSITION-01`,
  `PR-ANIMATION-01`, `PR-RACE-02`, `PR-NEST-01`
- `[~]` `PR-DOM-02`, `PR-DOM-03` — unit titles only; catalog is `[browser]`
- `[ ]` remaining `PR-DOM-*`, `PR-INSTANT-*`, `PR-TRANSITION-*`,
  `PR-ANIMATION-*`, `PR-RACE-*`, `PR-NEST-*`, `PR-REF-*`, `PR-ENV-*`,
  `PR-COMP-*`

### Work order

1. Port browser matrix for INSTANT / TRANSITION / ANIMATION / RACE / NEST /
   REF / ENV from TESTS.md.
2. Decide GSAP: freeze it as an implementation detail or delete it.
3. Align nested registration with `hooks.md`.
4. Move true DOM cases off JSDOM.

### Won't do

Overlay Presence timing (`OV-PRES-*` / `OV-RESTORE-*`). Visual enter/leave
classes.

### Done when

Every TESTS.md case ID appears in a passing **browser or specified unit**
title and is `[x]` here.
