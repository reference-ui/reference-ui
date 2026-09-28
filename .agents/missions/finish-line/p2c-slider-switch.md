# P2C Slider + Switch — DONE

Crew: finish-line slider-switch. No commits (captain commits).

## Slider: 48/73 → 73/73

- New `Slider.tail.test.tsx`: 24 colocated pins (SD-DOM-01/02/03/04/07/09/10/11,
  SD-CTRL-01/02/03/04/06/08, SD-KEY-01/05/06/08/09, SD-POINTER-11/12,
  SD-DYNAMIC-01/04, SD-COMP-02). No slider spec exists under `matrix/` on this
  branch, so the "matrix re-target" landed colocated per PATCHES/FEATURES crew
  precedent — no `matrix/` changes needed.
- `SD-POINTER-14` proven by retitling the existing real-engine CT focus-ring leg
  (it already asserted the case step-for-step; happy-dom cannot drive
  `isFocusVisible` modality).
- One source fix: `SliderThumb` is now `forwardRef` with a composed ref. As a
  plain function component, a React 19 consumer `ref` arrived via props and the
  `{...props}` spread overwrote internal registration — the thumb silently never
  registered and every interaction threw count-mismatch. Catalog requires working
  thumb refs (SD-DOM-03/KEY-06/POINTER-11/DYNAMIC-01). Paint-neutral (9 CT
  baselines unmodified).
- SPEC.md: status 73/73 Production Yes, TAIL notes, gaps struck, work order done.

Proof: unit 68/68; CT 36/36 (react19, snapshots clean), 72/72 (react17+18);
`tsc --noEmit` clean for Slider/Switch.

## Switch: 23/27 → 26/27 + 1 cut

- New `Switch.tail.test.tsx`: `SW-DOM-08` (StyleProps isolation incl. responsive
  overrides), `SW-COMP-01` (settings row), `SW-ENV-03` (real component in open
  ShadowRoot). No source changes.
- HQ calls resolved on maintainer-takes (flagged): uncontrolled preserved
  (DECISIONS §1 DECLINED); inline thumb transform/transition blessed as shipped
  contract (FEATURES #1 take — HQ to confirm or commission restyle); structural
  identity already landed (PATCHES #1, source reads no `displayName`).
- `SW-COMP-03` CUT (HQ flag): Switch-specific assertions already pinned by
  `SW-ACT-*` + `SW-DOM-08`; Overlay/roving assertions belong to those gates.
- Docs: SPEC.md status/gaps/work-order closed; TESTS.md `SW-TYPE-01` amended to
  the blessed API (`defaultChecked` public, `onChange(checked, event)`, full
  Omit list) and "Uncontrolled" removed from Out of scope; SPEC Next-agent/Surface
  drift fixed; FEATURES #1 bless recorded.

Proof: unit 9/9; CT 22/22 (react19, 7 snapshots byte-identical).

## HQ flags

1. Switch FEATURES #1: confirm the inline-transform blessing or commission the
   `data-state` restyle arc.
2. Switch `SW-COMP-03` cut: confirm, or staff the Overlay/RovingFocus joint gate.
3. Slider FEATURES #5 (single-thumb default name): still HOLD-FOR-HQ catalog
   policy; no case impact.
4. Env note: `packages/reference-lib/.reference-ui/` was found wiped mid-run
   (concurrent crew activity); regenerated via `pnpm --dir
   packages/reference-lib sync`, no fallout.
