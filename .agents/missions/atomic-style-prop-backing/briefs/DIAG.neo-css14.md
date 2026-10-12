# DIAG.neo-css14 — harvest floor missing (pre-existing red)

Reply with `STATUS: DONE` (or `STATUS: REFUSED`) as your first line. Read-only: do
not edit product code, this brief, or `STYLE_PROP_EXTERNAL.md`.

## Context

`NEO-CSS-14` (the "harvest floor" case) is **RED on `public-release` HEAD**,
independent of the in-flight fan-out mission. Proven by isolation: with every
mission change stashed and the engine rebuilt from HEAD, the case fails with the
identical assertion. The fan-out engine work (T01–T05, uncommitted) is exonerated.

## The case

- Dir: `packages/reference-neo/tests/cases/css/NEO-CSS-14/`
- `README.md`: *"A dynamic-site color from a palette array no static site reads
  paints through harvested plans, while an unwritten color paints nothing with
  exactly one dev console diagnostic — and both published bundles carry the floor."*
- Ledger `packages/reference-neo/tests/cases/css/TESTS.md:20` marks it **`done`**.
- `world/src/app.ts`: `const palette = ['red', 'blue']`; `function paint(i) { return css({ color: palette[i] }) }`; `el('probe').className = paint(0)`; `window.__cssProbe = (shade) => css({ color: shade })`.
- `world/src/global.ts`: `globalCss({ body: { color: '#111111' } })`.
- `world/ui.config.ts`: `name: 'neo-css14'`, `include: ['src/**/*.{js,ts,tsx}']`, **no `extends`/`layers`**.
- Spec: `specs/paint.spec.ts` — fails at **line 53**:
  `assert.ok(styles.includes('.neo-css14__c_red {'), 'sheet carries the harvested red floor')`.

## Symptom

After the runner syncs the world, `world/.reference-ui/styled/styles.css` is
**preamble-only**: `@layer root`, then `@layer neo-css14` containing `reset` +
`global` and **no `@layer utilities` content at all** — zero `neo-css14__*`
classes. The harvest floor is entirely absent (not just red).

The spec elsewhere expects the compile to report `ATM-I-HARVEST-SINK` with
`"color under []: 3 harvested values minted"`, two dynamic-site warnings
(`ATM-W-DYNAMIC-MEMBER`, `ATM-W-DYNAMIC-IDENTIFIER`), and the floor fanned into
both `styled/runtime-data.mjs` and `react/react.mjs`.

## What we know

- The harvest pass mints wants from dynamic-site refusals (`extract/harvest/**`);
  `push_harvested` / `mint_sink` / the pool offer logic are the relevant bodies.
- `extract/harvest/**`, `static_css.rs`, and `assembly.rs` were touched by the
  in-flight fan-out mission (T01/T05) in the working tree — but the failure
  **predates** them (isolation proof). The working tree is the fan-out tree; the
  HEAD tree fails too.

## Ask (answer each from the bodies; do not trust this summary)

1. **Root cause.** Why does this world compile with **no utilities**? Determine
   which link is broken: (a) the include glob / source scan not seeing `app.ts`;
   (b) `css({ color: palette[i] })` not being refused as a dynamic site (so no
   sink); (c) the harvest pool offering/minting nothing; (d) minted wants being
   dropped before emission; (e) the `styled/styles.css` write path. Name the
   exact `file:line` and mechanism. Trace the data flow from the dynamic member
   read to the emitted `.neo-css14__c_red` rule.
2. **History.** Was this case ever green on this commit/branch? Check git history
   for the case and for the harvest mechanism around it (e.g. recent changes to
   `extract/harvest/**`, the `harvest-sink` info code, or the `styled/styles.css`
   emission path). Name the commit that plausibly broke it, if any.
3. **Fix.** The smallest correct change, its `file:line` surface, and the decisive
   proof: `pnpm agentneo run NEO-CSS-14` green, plus which Rust unit/seam tests
   (`pnpm agentrs v atomic` / `c atomic`) should pin it.
4. **Findings** in the skill format (ID, severity, file:line, evidence,
   recommendation, validation gap) and a verdict line.

Do not re-derive the fan-out mission; this is an independent pre-existing bug.
