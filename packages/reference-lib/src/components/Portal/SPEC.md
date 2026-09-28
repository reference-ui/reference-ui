# Portal SPEC

Current freeze, cases, and proof. Design narrative: [Portal.md](./Portal.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/portal.spec.ts` (historical; see Status)
Colocated: `Portal.test.tsx` (7 tests)
CT: `__e2e__/Portal.ct.spec.ts` (15 specs, React 17/18/19 + snapshots)
Page: `/portal`

## Legend

- `[x]` A passing Playwright CT or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts a subset.

TESTS.md checkboxes mean **specified**, not proven.

## Next agent

**API and TESTS.md are the contract.** Portal relocates children with no
wrapper: default `document.body`, or an explicit element / fragment / ref /
resolver. Stacking, focus, dismissal, inerting, and modality are Overlay's.
Positioning is Popover's. Wrapper host props do not exist.

Late resolution and SSR are the behavioral contract beyond Radix: a
supplied ref/function that resolves null renders nothing until its target
exists — never a transient body copy — and the server emits no portal
content. See Joints below for the Menu/Combobox seams.

### Surface

| Axis | Freeze |
| :--- | :--- |
| Parts | `Portal` / `Portal.Root` (transparent, no wrapper) |
| Container | omitted/`null` → body after mount; element/fragment direct; ref/function late-resolves |
| Unresolved | renders nothing; no transient body or in-place copy |
| Destination change | one documented subtree replacement (PT-REACT-05; no state promise) |
| Same destination | stable subtree across rerenders (PT-CONTAINER-06) |
| SSR | server emits nothing; client attaches after the mount gate |
| Shadow | ShadowRoot is a first-class destination; content events fire once (see Joints) |

### Status (2026-09-28 seam ledger)

| | |
| :--- | :--- |
| Engine | Mount gate + container resolution + layer/document context reset. |
| Production | **Seam done.** Relocation, late-resolve, SSR gate, and the shadow event contract are proven. |
| Named `[x]` | 17 / 25 in-dir (CT + unit titles; matrix layer out of scope) |
| CT | 15 specs (React 17/18/19 green; 6 PT-THEME color-mode proofs are extra-catalog) |
| Vitest | 7 tests (ID'd case pins plus theme/layer-scope support) |

### Gaps & incoherence

- No `[ ]` case is a behavior gap: the engine handles every catalog shape
  (fragments, empty children, keyed updates, StrictMode replay, iframe
  documents); the `[ ]` rows are unpinned coverage, not missing code.
- `NEXT.md` still cites the old matrix counts (11 E2E) and a Cosmos
  fixture milestone; the in-dir CT suite supersedes both.
- `PT-THEME-01..06` CT titles pin the Portal Color Mode Protocol, which
  lives outside TESTS.md; they are frozen regression guards, not catalog
  cases.

### Vendor

**Lift:** Radix `packages/react/portal` (mount gate, default body lookup
after mount); Base UI `packages/react/src/portal` (container mutation
handling, Shadow DOM integration).

**Leave:** Radix's default wrapper and `asChild` (Reference Portal is
always children-only); wrapper host props; proprietary portal context
contracts.

### Case index

Proven in-dir (`Portal.test.tsx` Vitest + `__e2e__` CT):

- `[x]` `PT-DOM-01` `PT-DOM-03` `PT-DOM-05`
- `[x]` `PT-CONTAINER-01` `PT-CONTAINER-02` `PT-CONTAINER-03` (unit)
  `PT-CONTAINER-04` `PT-CONTAINER-05` `PT-CONTAINER-06` (unit title)
- `[x]` `PT-REACT-01` `PT-REACT-02` `PT-REACT-05` (unit)
- `[x]` `PT-ENV-01` (unit) `PT-ENV-02` (unit) `PT-ENV-03`
- `[x]` `PT-COMP-03`
- `[x]` `PT-SHADOW-01`

Not proven (coverage work, no behavior gap):

- `[ ]` `PT-DOM-02` (mixed-children shape/order) `PT-DOM-04` (detached
  fragment) `PT-DOM-06` (empty/falsy children) `PT-DOM-07`
  (update/unmount cleanup)
- `[ ]` `PT-REACT-03` (keyed state across unrelated parent rerenders;
  the `PT-CONTAINER-06` unit half covers the mechanism but not the
  keyed/unrelated-parent shape) `PT-REACT-04` (StrictMode replay)
- `[ ]` `PT-ENV-04` (same-origin iframe owner document)
- `[ ]` `PT-COMP-01` (default-destination composition with
  update/unmount) `PT-COMP-02` (scoped overlay root composition)

Extra-catalog frozen guards (not TESTS.md IDs): `PT-THEME-01..06`
(color-mode/layer-scope protocol), `FAILURE MODE 1/2` + nested-scope
unit tests.

### Joints

**Late-resolve (Portal side, done).** A null-resolving ref (CT
`PT-CONTAINER-02`) or resolver function (unit `PT-CONTAINER-03`) renders
nothing until the target exists; resolution follows the next rerender
(layout-effect sync) plus a rAF catch for late-attaching refs. Same
destination across rerenders keeps one stable subtree (unit
`PT-CONTAINER-06`). Menu intent hover (Menu PATCHES #1: 100/300ms
timers, 5px grace) lives above the mount and relies on exactly this:
intent rerenders must never remount a submenu destination. Menu owns
the timers; Portal owns the stability. No Portal surface change.

**SSR (Portal side, done).** `resolveContainer` returns null without
browser globals and `mounted` gates first paint, so `renderToString`
emits no portal child markup (unit `PT-ENV-01`); hydration attaches one
body child after the gate with no mismatch warning (unit `PT-ENV-02`).
Overlay (`OV-ENV-01/02`) and Menu (`MN-ENV-01`) inherit the gate by
using Portal internally; no consumer re-proves it.

**Shadow ownership (joint call, done).** Three owners, no overlap:

- Portal owns placement + delivery: children land directly in the
  ShadowRoot in order with no wrapper (`PT-DOM-05`), a late-attaching
  root gets exactly one copy (`PT-ENV-03`), content handlers fire
  exactly once in logical bubble order with logical context crossing
  the boundary (`PT-COMP-03`), and a destination change into a
  never-mounted foreign root re-attaches React's container listeners
  via the `PT-REACT-05` replacement (`PT-SHADOW-01`). The ancestor
  double-dispatch artifact (React ancestors at/above the host fire
  twice) is documented in FEATURES.md and deliberately not suppressed.
- Overlay owns the destination rule: omitted `Overlay.Portal
  container` follows `trigger.getRootNode()` into a ShadowRoot,
  explicit wins (Overlay FEATURES #1, `OV-ENV-05`).
- Menu/Combobox own composed-path usage + owning-root focus: composed
  inside paths never dismiss, true outside paths dismiss once
  (`OV-OUT-09` path; Menu `MN-ENV-03` green), focus/search resolve
  against the owning root, and an omitted container forwards as
  `undefined` so the automatic rule applies (Combobox
  `shadowContainerForSource`, `CB-ENV-03` CT). Cross-engine parity
  (`CB-ENV-04`) is Combobox-owned proof over this joint.

### Work order

1. Keep the seam frozen: late-resolve, SSR gate, shadow delivery.
2. Pin remaining `[ ]` coverage in-dir (fragment/empty/update DOM
   halves, keyed/StrictMode React halves, iframe env, COMP-01/02).
3. Retire `NEXT.md` matrix counts once the catalog is fully `[x]`.

### Won't do

Wrapper props. Stacking/focus/dismissal/inerting/modality (Overlay).
Positioning (Popover). A retargeting shim for the documented ancestor
double-dispatch (breaks composed outside-press/Escape).

### Done when

Public API matches Portal.md. Every TESTS.md ID is `[x]` here. Overlay,
Menu, and Combobox catalogs stay on their owners.
