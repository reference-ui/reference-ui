# PATCHES crew log — NumberField

Mission: implement `packages/reference-lib/src/components/NumberField/PATCHES.md` exactly (10 items).
Branch: reference-system (never switch; never commit). Touch ONLY NumberField dir + this log.
Guardrails: API-STANCE.md (breaking ONLY as written in PATCHES); visuals frozen (snapshots pass unmodified; STOP+flag if visual change required); prove with `pnpm agentct NumberField`; nested ux-designer review.
Skills: test-component ✓read, ux-designer ✓read.

## Timeline (one line per START/LAND + before/after every test run)
- 13:35 START log header written; reading PATCHES/API-STANCE/SPEC/DECISIONS/FEATURES + current source
- 14:05 TRIAGE done (code-verified): §1-§6 + §8 BLOCKED (see Triage), §7 LANDABLE standalone, §9 LAND (assertion-only CT), §10 LAND (book labels)
- 14:05 START §7 hold-repeat implementation in NumberField.tsx
- v2 START: triage re-verified via grep (§1 no data-editing/commitBehavior; §2 no formatOptions/NumberFormat; §4 no Group; §5 no hidden/form props; §6 English fallbacks; §8 spinbutton pinned in src+tests) — all verified-BLOCKED, untouched
- v2 START: §7 state check — v1 hook fully wired in both steppers (immediate/400/60, leave/re-entry, touch>8px, pinch, blur/unmount/disable cleanup, compat-click suppression, no forced touch focus); continuing, not redoing
- v2 BEFORE baseline test run (unmodified v1 tree): pnpm agentct NumberField
- v2 AFTER baseline: green — Unit 15 passed; E2E 16/16 react19 (v1 §7 code breaks nothing)
- v2 START §7 proof: unit hold-repeat suite (fake timers + pointer harness) in NumberField.test.tsx
- v2 BEFORE §7 unit run: pnpm agentct NumberField --unit
- v2 AFTER §7 unit: green — Unit 24 passed (15 pre-existing + 9 new §7: NF-STEP-03/04/05/06/07/08/10/12/13/14/15)
- v2 LAND §7: v1 hook kept as-is; proof = 9 fake-timer + pointer unit tests (400/60 boundaries, leave/re-entry, touch 8px/pinch, cancel/capture, disable/bound, unmount/blur/removal)
- v2 START §9 wheel assertion-only CT + §10 book labels
- v2 LAND §9: one assertion-only CT title NF-EDIT-19 (scrollable ancestor, 4 wheel variants, consumer receipt + defaultPrevented false + value/callback/text/selection/aria-valuenow unchanged)
- v2 LAND §10: aria-label="Quantity" on Default + Disabled book Inputs (WithBounds already named; docs naming line pre-exists NumberField.md L14-16)
- v2 SPEC flip: NF-EDIT-19 + NF-STEP-03/04/05/06/07/08/10/12/13/14/15 → [x]; 36/148; CT 17; unit 27 IDs/24 tests
- v2 BEFORE full verification run: pnpm agentct NumberField
- v2 AFTER full run: green — Unit 24 passed; E2E 17/17 react19 (incl. new NF-EDIT-19); all frozen snapshots pass unmodified, no rebaseline attempted
- v2 START nested ux-designer review of the delta
- v2 UX VERDICT: APPROVE (nested child, no fails) — look PASS (snapshots byte-unmodified, data-pressed has zero style consumers); all §7 feel changes approved; §10 labels approved; a11y no findings (spinbutton-kept-per-freeze noted, data-pressed correctly not aria-pressed). Method limit: Playwright MCP down, pnpm capture fallback resting-only; feel from full code read. Non-blocking: no distinct visual hold indicator for data-pressed yet (future styling pass, visuals frozen now)
- v2 DONE: landed §7+§9+§10; §1-§6+§8 verified-blocked untouched; no commits; branch untouched. Changed: NumberField.tsx (v1 §7, kept as-is), NumberField.test.tsx (+9 §7 unit), __e2e__/NumberField.ct.spec.ts (+NF-EDIT-19), NumberField.book.tsx (§10 labels), SPEC.md (36/148)

## Triage (grep-verified against NumberField.tsx + tests + docs)
- §1 dirty session: BLOCKED — zero markers (no data-editing/commitBehavior/dirty); PATCHES gates on controlled value after FEATURES §1 (unlanded: defaultValue + optional locale='en-US' still in types). No remainder.
- §2 Intl: BLOCKED — no formatOptions/NumberFormat; inputMode fixed "decimal"; SPEC step 4 after §1 + ICU handshake. No remainder.
- §3 lattice: BLOCKED — stepping is current±step+clamp; "lands with §1"; cherry-pick rejected by DECISIONS Non-decisions. No remainder.
- §4 Group: BLOCKED — no Group export (only root role=group); SPEC step 2 after step 1 (FEATURES §1 + §8); FI-SURF-01 Field handshake open. No remainder.
- §5 form pipeline: BLOCKED — no name/form/required/readOnly/invalid props, no hidden input; lands after §1. No remainder.
- §6 stepper names: BLOCKED — English fallbacks present; PATCHES says same major as FEATURES §1, never earlier. No remainder.
- §7 hold-repeat: LANDABLE — "separable from the rewrite — may land as a standalone behavior PR". Adapting freeze-dirty clauses to live-clamp engine (steppers step current value; single-request steps).
- §8 textbox: BLOCKED — spinbutton+aria-value* pinned by engine + unit (NF-TYPE-03/NF-DOM-06, NF-ENV-01) + CT titles; needs HQ-verified rebaseline (HQ out) + SPEC-step-1 bundling with FEATURES §1 strip. No remainder now; STOP per visuals rule.
- §9 wheel: LANDABLE — zero wheel code confirmed; one assertion-only CT title.
- §10 story names: LANDABLE — book Default/Disabled Inputs unnamed (WithBounds already named); docs line pre-exists (NumberField.md L14-16 + Deliberately-left).
