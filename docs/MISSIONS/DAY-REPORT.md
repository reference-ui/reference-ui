# Needs from HQ (2026-09-27)

Everything crew-able is landed. These are the only inputs blocking
bring-home. Answer inline (a number + a letter each) and I execute.

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

Recommendation: **1a** (your stance has always been value/onChange).

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

## 3. W-02 snap/validate semantics (6 sub-rulings)

The crew went RAC-exact per mission order; the TESTS.md freeze and your
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
Anything you flip, I re-pin (tests + docs, pre-release cheap).

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

## 5. Snapshot tolerance policy

2% (7,680px) masks real drift; the audit found 20 lying baselines
(now regenerated). The policy:

```ts
// playwright.config.ts:26
maxDiffPixelRatio: 0.02  →  0.002 ?   // 768px ≈ 10× measured noise
```

```tsx
// FocusLock.ct.spec.ts — three 0.15 page snaps (57,600px budgets!):
await snap(page, 'fl-dom-invalid-error', { maxDiffPixelRatio: 0.15 })
// → replace with locator snaps (≤25px) or drop (text/focus
//    assertions already prove behavior)?
```

- **5a.** Adopt P1–P5 (0.002 default, locator-pairing rule, ban ≥0.01
  without a `// TOL:` comment, same-commit regen rule). I implement.
- **5b.** Adopt + decide P6: React 17/18 snapshots (per-major
  baselines, or explicit accept of 19-only coverage)?
- **5c.** Skip the policy (keep 2% + trio).

Recommendation: **5a + 5b** (state a P6 pick).

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

- **6a.** (C) Bless consumer-sync + W-04 loud failure. I dispatch the
  neo crew (W-04: `console.error`, load-gated — throw rejected as
  fatal-under-race, magenta outline infeasible from `css()`).
- **6b.** (C) now + (B) next (authorize the runtime-fallback design).
- **6c.** (B) directly (skip straight to magic).

Recommendation: **6a** (W-04 is needed under every option anyway).

## 7. Merge

```bash
git checkout main && git merge reference-system
```

- **7a.** Merge now (ruling fallout lands as follow-up commits).
- **7b.** Merge after 1–6 are implemented (one clean tree).
- Plus: merge commit (history preserved, my default) or squash?

Recommendation: **7b + merge commit** (a day's work, then clean).
