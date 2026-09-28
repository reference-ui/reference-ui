# Collapsible SPEC

Current freeze, cases, and proof. Design narrative: [Collapsible.md](./Collapsible.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `__e2e__/Collapsible.ct.spec.ts` (colocated CT; quarantine matrix cases re-targeted here)
Vitest: `Collapsible.test.tsx`, `Collapsible.mount.test.tsx` (colocated)
Page: `/collapsible` (quarantine matrix fixture; CT mounts `Collapsible.story.tsx` fixtures)

## Legend

- `[x]` A passing Playwright or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts the prototype, not the freeze.

TESTS.md checkboxes mean **specified**, not proven.

## Next agent

**API and TESTS.md are the contract.** Controlled disclosure + Presence exit +
measured size vars. Accordion owns collection policy.

Visual polish is not this gate. No default chevron, no `hideIcon`, no GSAP as
public motion.

### Surface

| Axis | Freeze |
| :--- | :--- |
| Parts | Transparent root; Trigger `button`; Content `div` |
| State | controlled `open` / `onChange`; omitted outside Accordion → controlled false |
| Exit | Presence; `aria-controls` stays through exit |
| Size | `--reference-collapsible-content-{height,width}` |
| Find | `hiddenUntilFound?`; closed content stays Ctrl+F-discoverable; `beforematch` opens it and skips author motion once |

### Status (2026-09-25 landing)

| | |
| :--- | :--- |
| Engine | Hardened disclosure + Presence exit + measured size vars (landing). |
| Production | **No** — freeze items 1–3 superseded, see Landing note. |
| Named `[x]` | 49 / 49 (39 freeze + 10 CO-MOUNT) |
| Playwright | 25 (22 + 3 CO-MOUNT-CT) |
| Vitest | 30 (20 + 10 CO-MOUNT) |

### Landing note (quarantine-landing, 2026-09-25)

Quarantine ported as **tests + hardening only**. Deliberate divergences
from the freeze catalog above, per recon (mangling exhibits 1–2) and
LANDING.md (visuals frozen):

- Uncontrolled mode (`defaultOpen` + internal store) and the
  `onOpenChange` alias are **preserved**, not removed. Freeze
  work-order item 1 is superseded.
- Default chevron (`hideIcon` / `icon`) and the trigger border chrome
  are **preserved**. Visuals are frozen per LANDING.md.
- GSAP `animateCollapse` is **preserved** as the owned exit motion.
  Freeze work-order item 3 is superseded; apps do not own collapse CSS.
- `hiddenUntilFound` / `beforematch` reveal + `forceMount` **landed**
  2026-09-28 (CO-MOUNT-01–10; unit + CT on React 17/18/19). Root
  `hiddenUntilFound` default, Content override wins; `untilFound` wins over
  `forceMount`; `beforematch` opens with enter motion skipped once (deferred
  past dispatch so a later-registered consumer cancel wins); rejected
  `beforematch` arms the skip consumed by the next committed open;
  `forceMount`-alone closed Content stays visible/interactive with no
  collapse styles and no focus evacuation.
- `CO-ACT-05` post-close content may be a closed exiting node (GSAP
  suspends unmount in happy-dom); the case pins controlled-following +
  no echo.
- `CO-ACT-10` is re-targeted: omitted state starts closed and toggles
  through the internal store by design.
- `CO-PRES-02` is re-targeted: the CT harness disables CSS keyframes,
  so the port pins descendant end-events ignored + GSAP completion
  unmounting (keyframe-exit completion is Presence-suite territory).
- `CO-PRES-03` is re-targeted: a reduced-motion stub zeroes the GSAP
  exit, pinning fast unmount on the zero-motion path.
- `CO-PRES-05` is re-targeted to GSAP: inline-height probe for the
  mount skip + close/reopen/close fresh lifecycle.
- `CO-SIZE-01 (exact)` pins border-box measurements: the collapse
  engine forces `border-box`, so authored 120px + padding + border
  measure 120px (quarantine content-box math does not apply).
- Source hardening (no visual change): Trigger forwards ref;
  `aria-controls` kept through exit and removed after unmount, never
  dangling; atomic layout-effect id registration; `React.useId`
  content ids; primary-button activation guard; managed
  `aria`/`data-state`/`disabled` win over consumer conflicts; focus
  evacuation to trigger (body fallback); exiting Content is
  `inert` + `aria-hidden` with consumer overrides preserved.

### Gaps & incoherence

- `defaultOpen`, `onOpenChange` alias, internal open store. Freeze is
  controlled-only.
- Default chevron + `hideIcon` / `icon` chrome — not in the API.
- GSAP `animateCollapse`. Freeze: apps own CSS from measured vars.
- `aria-controls` only when open. `CO-DOM-03`: keep through Presence exit.
- ~~No `hiddenUntilFound` / `beforematch`.~~ Landed 2026-09-28
  (CO-MOUNT-01–10): closed content stays find-in-page discoverable and
  opens on match, skipping motion once; `forceMount` escape hatch included.

### Vendor

**Lift:** Radix collapsible + Presence/measure; Base UI panel interrupt /
measure tests + `hiddenUntilFound` / `beforematch` reveal
(`vendor/base-ui/.../collapsible/panel/useCollapsiblePanel.ts`); Aria
Disclosure.

**Leave:** uncontrolled `<details>` / `defaultOpen`.

### Case index

- `[x]` `CO-DOM-01`, `CO-DOM-02`, `CO-DOM-03`, `CO-DOM-04`, `CO-DOM-05`,
  `CO-DOM-06`, `CO-DOM-07`, `CO-DOM-08`, `CO-DOM-09`, `CO-DOM-10`
- `[x]` `CO-ACT-01`, `CO-ACT-02`, `CO-ACT-03`, `CO-ACT-04`, `CO-ACT-05`
  (re-targeted, see Landing note), `CO-ACT-06`, `CO-ACT-07`,
  `CO-ACT-08`, `CO-ACT-09`, `CO-ACT-10` (re-targeted, see Landing note)
- `[x]` `CO-PRES-01`, `CO-PRES-02` (re-targeted), `CO-PRES-03`
  (re-targeted), `CO-PRES-04`, `CO-PRES-05` (re-targeted),
  `CO-PRES-06`, `CO-PRES-07`, `CO-PRES-08`
- `[x]` `CO-SIZE-01` (+ exact border-box pin), `CO-SIZE-02`,
  `CO-SIZE-03`, `CO-SIZE-04`
- `[x]` `CO-NEST-01`, `CO-NEST-02`
- `[x]` `CO-ENV-01`, `CO-ENV-02`
- `[x]` `CO-COMP-01`, `CO-COMP-02`, `CO-COMP-03`
- `[x]` `CO-MOUNT-01`, `CO-MOUNT-02`, `CO-MOUNT-03`, `CO-MOUNT-04`,
  `CO-MOUNT-05`, `CO-MOUNT-06`, `CO-MOUNT-07`, `CO-MOUNT-08`,
  `CO-MOUNT-09`, `CO-MOUNT-10`

### Work order

1. Controlled-only; remove `defaultOpen` / icon chrome.
2. Keep `aria-controls` through exit; Presence wiring.
3. Publish size vars; stop owning GSAP collapse as the kernel.
4. ~~`hiddenUntilFound` + `beforematch` reveal (skip motion once).~~ Done 2026-09-28.
5. Port `CO-PRES` / `CO-ACT` browser cases.

### Won't do

Accordion collection policy. Prescribed visual height recipe.

### Done when

Public API matches Collapsible.md. Every TESTS.md ID is `[x]` here.
