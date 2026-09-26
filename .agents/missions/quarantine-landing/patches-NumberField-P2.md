# NumberField PATCHES-remainder crew log (P2)

Mission: reference-ui; branch: reference-system (never switch; never commit).
Task: re-assess PATCHES §1–§6 vs current tree (FEATURES #1 landed: value/locale required, defaultValue deleted); land each NOW-unblocked item exactly as written; re-verify-blocked the rest (§8 HQ re-pin untouched). §7/§9/§10 landed — do not relitigate. Breaking changes ONLY as written in PATCHES doc. Visuals frozen. Prove with `pnpm agentct NumberField`. Nested ux-designer review. Touch ONLY NumberField dir + this log.
Started: 2026-09-26
Skills: test-component ✓read, ux-designer ✓read. API-STANCE ✓read.

## Timeline (one line per START/LAND + before/after every test run)
- START log header written; read PATCHES §1-§6, v1 triage, API-STANCE, SPEC/TESTS/DECISIONS/FEATURES, NumberField.md freeze contract, source+tests
- TRIAGE (grep-verified): §6 LANDABLE now (sole gate was FEATURES §1 bump, in-tree); §1-§5 re-verified-BLOCKED (see Triage); §8 untouched per orders (spinbutton x2 in src, HQ re-pin)
- START §6 implementation in NumberField.tsx (required-name union type + runtime diagnostic + null-render; default composition authors labels)
- LAND §6 implementation: NumberField.tsx (union type + useStepperName + null-render + default labels); story/book/unit in-dir migrations (54 sites); new proof (NF-TYPE-04 type title, NF-DOM-09 unit matrix + CT title, NF-STEP-01 CT rewrite); SPEC 38/148
- BEFORE verification run: pnpm agentct NumberField
- AFTER verification: green — Unit 29 passed; E2E 18/18 react19 (incl. rewritten NF-STEP-01 + new NF-DOM-09); all frozen snapshots pass unmodified
- BEFORE tsc diagnostic: pnpm --dir packages/reference-lib exec tsc --noEmit (read-only; attribute errors by kind)
- AFTER tsc: in-dir clean (zero errors in NumberField dir except 2 pre-existing data-pressed TS2339, FEATURES-attested, untouched lines); 8 out-of-dir §6 errors enumerated for captain patch (see Flag); zero unused-@ts-expect-error (all 3 NF-TYPE-04 rejections genuinely error)
- START nested ux-designer review of the §6 delta
- UX VERDICT (nested child): PASS — look PASS (zero paint lines, snapshots unmodified, Book Default live-captured intact + stepping 42→43 with press feedback); feel APPROVED x3 (named-identical, unnamed-null+diagnostic with keyboard capability preserved, type boundary); a11y clean (no invented fallback, effective-name semantics, fail-closed labelledby approx, SSR-safe). Advisories: (1) late-mounting targets don't re-verify — accepted as doc line in useStepperName comment; (2) once-per-mount diagnostic (no reset on break→fix→break) — declined, single-episode matches catalog, re-logging unrequested. Caveat: child judged null-branch from source+spec (CT PNGs rotated by concurrent Tabs run before its read; I viewed both PNGs pre-rotation: named fixture renders + steps, unnamed renders bare input)
- POST-GREEN edit: comment-only doc line for advisory 1 (zero behavior delta; green stands)
- DONE: §6 landed + proven; §1-§5 re-verified-blocked; §8 untouched; no commits; branch reference-system. Changed: NumberField.tsx/story/book/test/types/ct.spec/SPEC.md + this log. Open: captain's 8-site out-of-dir migration patch (see Flag) must land in the same commit or Field/Showcase go red.

## Triage (re-assessed vs FEATURES-#1-landed tree; grep-verified)
- §1 dirty session: BLOCKED — acceptance requires freeze 7 (snap order = §3 content) + freeze 9 (submit rules = §5 content) to hold; §3 "lands with §1" needs §2 authored rounding; §2 ICU-matrix handshake open (DECISIONS walkthrough); SPEC work order step 3 sits after HQ-blocked step 1 (§8). Markers: no data-editing/commitBehavior/dirty. No remainder (fragments-on-live-clamp rejected by DECISIONS Non-decisions).
- §2 Intl: BLOCKED — no formatOptions/NumberFormat (inputMode fixed "decimal"); ICU-matrix handshake open; SPEC step 4 after §1. No remainder.
- §3 lattice: BLOCKED — "lands with §1" (commit boundaries execute the snap/validate order); cherry-pick rejected by DECISIONS Non-decisions; snap order needs §2 authored rounding. No remainder.
- §4 Group: BLOCKED — no Group export; SPEC step 2 after step 1 (bundles HQ-blocked §8); FI-SURF-01 Field handshake open. No remainder.
- §5 form pipeline: BLOCKED — "lands after §1" (dirty/failed-boundary state drives submit blocking); no name/form/hidden markers. No remainder.
- §6 stepper names: LANDED — sole gate was the FEATURES §1 major bump ("never earlier"), now in-tree; zero open handshakes; orthogonal to §8.
- §8 textbox: UNTOUCHED per orders (HQ re-pin; spinbutton x2 still in src).

## Flag (out-of-dir §6 migration — touch-scope forbids; captain applies in same commit)
Unnamed steppers now render null + diagnose. 8 out-of-dir sites break (tsc TS2322 + runtime null; Field CT testids + Showcase CT name query fail). One-word fix each — add aria-label BEFORE the existing props:
- Field.story.tsx:235 `<NumberField.Decrement data-testid="compound-number-dec" />` → `aria-label="Decrement"`; :237 Increment compound-number-inc → `"Increment"`; :241/243 comp-number-dec/inc same; :342/347 bare Decrement/Increment → `"Decrement"`/`"Increment"`
- Showcase.book.tsx:164/166 bare Decrement/Increment → `"Decrement"`/`"Increment"` (Increment MUST be exactly "Increment": Showcase.ct.spec.ts:56 queries name 'Increment')
- Pre-existing, not mine: data-pressed TS2339 x2 (NumberField.tsx:521/639, FEATURES-attested); DateField-locale x4; ct.ts x2; Slot x2.
