# Decisions (HQ — 2026-09-27)

Working copy of `docs/MISSIONS/DAY-REPORT.md`, moved here per HQ
request. Crew recommendations kept; prior art added under each item.
Answer inline (a number + a letter each).

Stance (HQ 2026-09-28): no freeze pressure — the library is in
development. API decisions are development, made without dogma, not
freeze-gates. The pre-release window in `API-STANCE.md` stands, but
nothing here is blocked on ceremony.

## HQ position (live)

- 1. Handler naming — leaning 1a (house `onChange` everywhere); not yet ruled.
- 2. B-36 silence vs uniform — RULED 2a (keep silence; crew
  recommendation accepted).
- 3. W-02 snap/validate — challenging the prop itself (can it just be
  `onChange`? is corporate-RAC prior art enough?); ruling after the write-up.
- 4. Splitter aliases — RULED 4a (delete; pre-production, no such thing
  as legacy, maintain no legacy props). Execution ON HOLD — decisions
  only, no code until HQ says go.
- 5. Snapshot tolerance — 0.002 questioned as the extreme other end;
  research agent out to find the reasonable value.
- 6. Compiler 140r — HQ POSITION: `<Div maxW="140r">` in a consumer app
  MUST just compile to a rhythm-unit CSS rule (H-3 continuous numerics).
  The C stopgap (loud error + `ref sync`) blames the user for a system
  gap — rejected as the end state. Open: whether C is wanted as interim.
  Back-to-drawing-board note (HQ): closed-set resolution is wrong beyond
  named tokens. Numerics (`140r`) must compute; arbitrary literals
  (`rgba(...)`) must pass through. A compiler that only emits values it
  already knows is broken by design.
  Doctrine (HQ): no Pandaisms — we fully control the stack. Extraction
  defines what compiles; tokens are a layer on top, not the gate.
  Arbitrary literals (rgba) are believed resolving; r-units are the
  suspect. Honest relook at values + extraction + new test cases owed.
  Substrate rule (HQ): r-units are foundational compiler spec, the
  deepest level — any Nr computes, no declaration. User spacing tokens
  (spacing.large) are defined AS r-values, on top. Mission handed off —
  deliver tonight.
  VERIFY RESULT (scale crew): no closed table exists — both engines
  ALREADY compute arbitrary N. 140r = harvest scope (value never in
  scanned sources). Real gaps: (a) legacy-path min/max = dropped or
  verbatim-invalid; (b) unscanned-consumer policy (dev-warns,
  prod-silent). Implement lead rebriefed. Awaiting HQ re-rule on (b).
  REPRO corroborates: real `ref sync` emits 140r/137.5r/rgba, exit 0,
  zero diagnostics. New lead suspect for the original sighting:
  `--spacing-root` undefined in the consumer (emits fine, paints
  nothing) — or stale/legacy path. Objective-1 COMPLETE, unanimous.
  HQ RULED: (1) unscanned consumer gets the dead class, no runtime
  fallback — sync is the move; (2) compiler auto-defines
  `--spacing-root` at the current value (`0.25rem`), and YES users
  can overwrite it — author definition always wins.
- 7. Merge — REMOVED per HQ (not a decision; no merge yet).

## 1. Handler naming — one spelling?

Choice items shipped both spellings; Menubar ships Radix's. Pre-release
is the moment to strip one.

```tsx
// shipped today — both work:
<Menu.CheckboxItem checked={v} onChange={setV} />
<Menu.CheckboxItem checked={v} onCheckedChange={setV} />
<Menu.RadioGroup value={s} onValueChange={setS} />
<Menubar value={m} onValueChange={setM} />
```

- **1a.** House `onChange` everywhere (strip the Radix aliases, rename
  Menubar's prop). Consistent with value/onChange stance.
- **1b.** Radix spellings (`onCheckedChange`/`onValueChange`) everywhere
  (strip `onChange` canonical). Consistent with prior art.
- **1c.** Keep both (status quo — mild parallel API).

Recommendation: **1a** (stance has always been value/onChange).

Prior art:
- Radix: `onCheckedChange` (Checkbox), `onValueChange` (RadioGroup,
  Menubar) — `vendor/radix-primitives/packages/react/checkbox/src/checkbox.tsx:49`,
  `menubar/src/menubar.tsx:63`. W-28 mirrored these exactly
  (`.agents/missions/playtest/prior-art.md`).
- Base UI: same split — `onCheckedChange`
  (`checkbox/root/CheckboxRoot.tsx:473`), `onValueChange`
  (NumberField).
- House: `API-STANCE.md` controlled-only rule is value + onChange;
  Switch is `onChange(checked, event)`. 1a = house consistency,
  1b = vendor consistency.

## 2. B-36 — silence or uniform requests?

```tsx
<Combobox value="Borealis" onChange={...} />
// today: blur with "Borealis" still showing → NO onChange (silent on
// Enter/Space/click/Tab when the value is identical). Calendar +
// NumberField match. But FEATURES #13 deliberately triaged the
// opposite: uniform requests (every commit attempt emits).
```

- **2a.** Keep silence (the filed bug asked for it; FEATURES #13 note
  gets superseded).
- **2b.** Restore uniform requests (revert the silence guards).

Recommendation: **2a** (B-36 is unambiguous; #13 predates it).

Prior art:
- Silence: DOM `change` semantics (no event when the value is
  unchanged); Listbox-single parity (`Combobox/SPEC.md`); NumberField
  no-change commits emit nothing (`NumberField.test.tsx` W-02);
  Calendar `CA-SINGLE-01..03`. RAC `commit()` fires `onChange` "with
  the new value" (implies new).
- Uniform: Calendar FEATURES #13 triage — every commit attempt emits
  so downstream effects re-fire. Superseded by B-36 per
  `Calendar/TESTS.md:798` and `Calendar/SPEC.md:56,128`.

## 3. W-02 snap/validate semantics (6 sub-rulings)

The crew went RAC-exact per mission order; the TESTS.md freeze and the
sign-off disagree in 6 places. Each is one line:

```tsx
<NumberField min={0} max={10} step={3} commitBehavior="snap" />
// (i)   type 10, commit → today 9 (RAC min-anchored lattice).
//       Freeze demanded 10 (zero-anchored + endpoint preservation).

<NumberField step={1} commitBehavior="snap" />
// (ii)  type -2.5, commit → today -2 (signed-off round-half-up).
//       RAC gives -3 (sign-based); freeze gives -3 (away-from-zero).

<NumberField step={1} commitBehavior="validate" />
// (iii) type 2.5, commit → today: reverts + onInvalidCommit, NO onChange.
//       RAC instead publishes 2.5 and marks invalid.

// (iv)  value both out-of-range AND off-step → today reports
//       out-of-range first. Keep?
// (v)   steppers clamp-step even in validate mode (commitBehavior
//       governs typed commits only). Keep?
// (vi)  modest parser: "1,000" parses; "1e999"/"Infinity"/de-DE "2.5"
//       revert. Keep (full NF-PARSE deferred)?
```

Answer per numeral, e.g. `3: i-RAC ii-signed iii-signed iv-keep v-keep
vi-keep`, or `3: all-RAC` / `3: all-freeze` to pick a side wholesale.
Anything flipped gets re-pinned (tests + docs, pre-release cheap).

Prior art (and HQ's "can this just be onChange?" challenge):
- Yes, it *is* onChange — as mechanism. RAC `useNumberFieldState.commit()`
  clamps + snaps and "will fire the `onChange` prop with the new value".
  But upstream still ships the prop, so docs-guidance was rejected:
  the prop declares policy (coerce vs reject vs keep), onChange is the
  transport. Without it every consumer reimplements lattice, rounding,
  revert, and invalid-reporting differently.
- RAC ships `commitBehavior?: 'snap' | 'validate'`, default `'snap'`,
  verbatim (NumberField v1.17.0, `adobe/react-spectrum#9679`) —
  `vendor/react-spectrum/packages/react-stately/src/numberfield/useNumberFieldState.ts:53,131`.
- Snap math is RAC `snapValueToStep`
  (`react-stately/src/utils/number.ts`): min-anchored lattice
  (`(value - (min ?? 0)) % step`), sign-based ties
  (`Math.sign(remainder)` → -2.5 gives -3), endpoint clamp-down
  (`min + floor((max-min)/step)*step` → 10 gives 9).
- Third value `'none'`: behavior traced via Mantine
  `clampBehavior="none"` and Chakra `clampValueOnBlur` +
  `keepWithinRange` dual-false; the name spelling is ours. Our default
  stays `'none'` (today's behavior); Spectrum defaults `'snap'`.
- Native `validate` analogue: off-step → `validity.stepMismatch`,
  `:invalid`, blocks submit, never coerces (MDN ValidityState).
- Signed-off deltas already in tree: round-half-up ties (toward
  +Infinity), validate reverts + `onInvalidCommit` with no `onChange`,
  steppers clamp-step even in validate, modest parser
  (`WANTS.md` W-02; `.agents/missions/playtest/prior-art.md`).

## 4. Splitter legacy aliases — keep or delete?

```tsx
<Splitter.Panel minSize={10} maxSize={90} />  // legacy: works today,
<Splitter.Panel min={10} max={90} />          // canonical: wins if both set
```

`minSize`/`maxSize` are real CSS props, so they were swallowed by
`css()` — now redeclared as deprecated solver aliases. Deletion is
breaking NOW (pre-release legal); keeping costs one line each.

- **4a.** Delete the legacy names (clean shipped API).
- **4b.** Keep as deprecated aliases (forgiving; the smoke consumer
  shape uses them).

Recommendation: **4b** (deletion buys nothing; a silent constraint
loss is worse than cruft).

Prior art:
- `minSize`/`maxSize` is react-resizable-panels' Panel API verbatim
  (numbers = px, unitless strings = %) —
  `vendor/react-resizable-panels/lib/components/panel/types.ts:22-23,176-183`.
- Canonical `min`/`max` matches house vocabulary (NumberField, Slider).
  The rename was forced by the `css()` collision, not taste
  (`Splitter.tsx:182` strips the CSS props; `:217-218` canonical wins).
- `API-STANCE.md` says no shims for never-released API (argues 4a);
  the counter is that a dropped constraint fails silently (argues 4b).

## 5. Snapshot tolerance policy

2% (7,680px) masks real drift; the audit found 20 lying baselines
(now regenerated). The policy:

```ts
// packages/reference-lib/playwright/playwright.config.ts
maxDiffPixelRatio: 0.02  →  0.002 ?   // 768px ≈ 10× measured noise
```

```tsx
// FocusLock.ct.spec.ts — three 0.15 page snaps (57,600px budgets!):
await snap(page, 'fl-dom-invalid-error', { maxDiffPixelRatio: 0.15 })
// → replace with locator snaps (≤25px) or drop (text/focus
//    assertions already prove behavior)?
```

- **5a.** Adopt P1–P5 (0.002 default, locator-pairing rule, ban ≥0.01
  without a `// TOL:` comment, same-commit regen rule).
- **5b.** Adopt + decide P6: React 17/18 snapshots (per-major
  baselines, or explicit accept of 19-only coverage)?
- **5c.** Skip the policy (keep 2% + trio).

Recommendation: **5a + 5b** (state a P6 pick).

Prior art: repo-local, not vendor. The 0.02 default is ours (config
above); Playwright supplies the per-assertion `maxDiffPixelRatio` /
`maxDiffPixels` mechanism. The audit evidence is 20 regenerated
baselines; CT runs React 17/18/19 green while snapshots are
effectively 19-pinned — that is the P6 question.

## 6. Compiler decision — 140r (H-3 ranking ready)

```tsx
<Div maxW="140r">…</Div>  // 140r appears nowhere in lib sources
// C: dev console.error naming maxW/140r/call-site (after load —
//    H-6 race makes anything earlier unsound). Zero bytes. To paint
//    it, the consumer runs `ref sync` (blessed path, already exists).
// B: it just paints — runtime injects the compiled-equivalent rule.
//    Magic, but permanent JS/Rust parity maintenance + CSP/SSR caveats.
// A: compiler pre-emits 0r..400r × every dimensional prop. Never.
```

- **6a.** (C) Bless consumer-sync + W-04 loud failure. Dispatch the
  neo crew (W-04: `console.error`, load-gated — throw rejected as
  fatal-under-race, magenta outline infeasible from `css()`).
- **6b.** (C) now + (B) next (authorize the runtime-fallback design).
- **6c.** (B) directly (skip straight to magic).

Recommendation: **6a** (W-04 is needed under every option anyway).

Prior art:
- Static extraction (Panda): unknown values warn-and-skip — today's
  behavior, and the silent-wrong-layout complaint behind W-04.
- Class spray (Tailwind): unknown classes silently no-op in HTML —
  same silence, nobody proposes pre-emitting every numeric (option A
  is that, combinatorially worse: 400 values × every dimensional prop).
- Runtime injection (Emotion/styled): always paints, JS-owned — option
  B, with permanent parity + CSP/SSR cost.
- W-04 caveat (`WANTS.md`): `120r`/`200r` compile, so `140r` is a
  continuity gap in the scale, not a malformed value — loud failure
  should not blame the user for a system gap. Genuinely malformed
  values (unknown props, garbage strings) are the uncontested W-04 core.

---

## Closeout amendments (2026-09-29, captain's rulings under user autonomy directive — all reversible by veto)

Full record: `docs/archive/FINISH.md` change control + `.agents/missions/finish-line/`.

- **§1 Handler naming → RULED 1a, LANDED.** House `onChange`
  everywhere; Radix aliases stripped (Menu), Menubar's prop renamed
  (`30e738184`, `b30e7272a`). No shims.
- **§3 W-02 numerals → RULED + LANDED.** i-freeze (zero-anchor +
  endpoint preserve), ii-freeze (away-from-zero), iii-retain-and-report
  (advisory onInvalidCommit, range-first), iv-keep, v-keep, vi-keep
  SUPERSEDED by the landed SPEC'd Intl parser (deleting it would be
  perverse; recorded in `C-NF.md`). Engine was already landed by NFLAST
  missions (verified firsthand); the flip was audit + re-pins, zero
  behavior change (`b285a62b3`). B-19 re-pinned to live-request titles.
- **§5 Snapshots → RULED 5a-modified + P6 19-only, LANDED.**
  Default `0.001` (FINISH-07 measured: 12× headroom, `154599d2f`),
  ≤25px locator rule, ≥0.01 TOL-ban; trio → locator snaps; 64
  baselines regenned with per-baseline eyeball classification
  (`02f306ee0`, `a21644351`, `83dda8f56`); 31 orphans pruned (349=349).
  Per-browser r19 baselines DEFERRED to first follow-up (two boxes
  consumed by Chromium fallout; zero release-blocking value; all
  vehicles preserved). FF/WK paint stays behavior-only + page snaps
  vs shared Chromium (7.2× headroom proven) until adoption.
- **NumberField least-surprise flags (A2) → ADOPTED** as specified in
  `NumberField/DECISIONS.md` (a)(b)(c) + Intl i–xvi (already landed).
- **C-SWITCH/SLIDER/DATE → VACUOUS** (no written takes exist).

