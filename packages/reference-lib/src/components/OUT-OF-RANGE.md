# Clamp-or-warn contract for out-of-range controlled values (W-35)

One shared contract, stated once. Source: `docs/MISSIONS/WANTS.md` W-35,
`docs/MISSIONS/PLAYTEST-REQUIREMENTS.md` Part 2 W-35. Landed for
Slider/Splitter by the wants-contract crew; the audit table below is the
handoff for follow-up crews.

## The contract

Every component receiving an out-of-range controlled value either **clamps**
(render + ARIA agree) or **dev-warns** — never silently degenerate, never
lying ARIA. Clamp-silently matches Radix Slider (#1988), React Aria
`snapValueToStep`, and native `<input type="range">`; the dev-warn half is
our addition and stays dev-only (evidence:
`.agents/missions/playtest/prior-art.md`, W-35 rows).

Per component, pick clamp, warn, or both — and document the pick here, not
as per-component folklore.

## Warning format

- Dev-only `console.error`, stripped in production via the `globalProcess`
  `NODE_ENV` guard (the package declares no node types; `process` comes via
  `globalThis`). See `warnSlider` in `Slider/Slider.tsx`, `warnSplitter` in
  `Splitter/Splitter.tsx`.
- Every warning names all four parts: **component, prop, value, valid
  range**. Example:
  `[Reference UI Slider] value (999) is outside [0, 24]; rendering and ARIA are clamped to the range.`
- Shape precedent for unmatched-value warnings: W-16 (Tabs warns naming
  component, bad value, registered values).

## Landed policy

| Component | Out-of-range input | Policy | Proof |
|---|---|---|---|
| Slider | `value` outside `[min, max]` (scalar or array entry) | Clamp + warn: thumb at 0%/100%, `aria-valuenow`/`min`/`max` agree, dev warning names all four parts | `Slider.contract.test.tsx` B-29 + W-35; `__e2e__/Slider.ct.spec.ts` B-29 + W-35 |
| Splitter | entries not summing to 100%, negative/NaN/non-finite entries | Warn (dev `validateLayout` diagnostic); panels still mount with declared sizes | `Splitter.contract.test.tsx` W-35 (off-100); `__e2e__/Splitter.ct.spec.ts` W-35 (`BadLayout` story) |
| Splitter | `value` length vs mounted Panel count (e.g. `[10,10,80]` on 2 panels) | Warn + throw: dev warning carries the diagnostic, then the FEATURES #9 structural error throws — never the B-11 silent ~13px collapse | `Splitter.contract.test.tsx` W-35 (count mismatch); `StructureErrors` story `value-long` case + SP-DOM-02 CT |

Acceptance mapping: `value={999} max={24}` → thumb at 100% AND
`aria-valuenow="24"` (B-29 clamp) plus the dev warning (W-35);
`value=[10,10,80]` on 2 panels → dev warning naming `value has 3 entries
but 2 Panels are mounted`, then the structural throw.

Known edge: SSR renders before Panel registration, so a count mismatch on
the server renders fallback geometry with no diagnostic; the client warns
and throws on hydration. Fail-closed there would need the value/children
count without registration — follow-up if HQ wants it.

## Audit (read-only, 2026-09-27) — follow-up crews, not wants-contract

Observed from source; nothing below was changed by this crew.

| Component | Out-of-range input today | Status | Evidence |
|---|---|---|---|
| NumberField | Controlled `value` outside `[min, max]` renders verbatim (e.g. `999` with `max={10}`), no clamp, no warning | NON-COMPLIANT (render path) | `NumberField.tsx`: `displayValue` formats raw `value`; `numberFieldDevDiagnostic` only used for stepper naming. Partial credit: W-02 `commitBehavior` snap/validate covers the *commit* path; no ARIA can lie (plain textbox, B-26). Likely fix: dev warning — clamping display would replay B-19 mid-typing. |
| Calendar | Controlled `value` outside `[min, max]` renders `aria-selected` on a disabled day, no warning | NON-COMPLIANT | `Calendar.tsx`: `isDateSelected` compares raw `value` with no bounds check; `validateCalendarProps` gates formats/contradiction only. Note: B-17/W-21 day-disabling was in-flight during this audit. |
| Listbox | Controlled `value` matching no option renders nothing-selected, zero console output | NON-COMPLIANT (silent) | `Listbox.tsx`: no `console.*` calls at all; selection is pure `combobox.value === value` matching. W-16 (Tabs) is the accepted warning shape to mirror. |
| Tree | Unknown selected/expanded ids pass through silently (pinned: `unknown-*` ids keep trailing order) | NON-COMPLIANT (silent) | `Tree.tsx`: no `console.*` calls; `Tree.test.tsx` pins unknown-id passthrough. Decide: warn (W-16 shape) vs documented passthrough. |

Suggested routing: fields crew (NumberField), calendar crew (Calendar),
combo-list crew (Listbox), nav crew (Tree) — each picks clamp/warn/both
per the contract and extends the landed-policy table above.
