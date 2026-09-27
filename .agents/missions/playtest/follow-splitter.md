# Splitter follow-up crew log

Status: **COMPLETE** (branch `reference-system`, no commits — captain commits)

Scope: `packages/reference-lib/src/components/Splitter` only (+ colocated tests/stories).
4 files changed, +204/−6. No other dirs touched.

## H-1 — dynamic `flex: "0 0 N%"` strings — FIXED (verified + last template moved)

Finding: current `src` has **zero** dynamic flex strings. The drag tick writes
geometry via `style.setProperty` (inline CSS vars), Panel flex is the static
inline `1 1 var(--reference-splitter-panel-size)`, Handle flex is the static
`flex="0 0 auto"`, and all ternaries (`flexDirection`/`width`/`height`/
`margin`/`cursor`) are finite static branches StyleTrace resolves. The
packaging crew's sighting does not reproduce at HEAD `src` (stale-`dist`
ghost, same class as the B-10 lib-internal misses).

Fix: moved the one remaining dynamic template reaching `css()` —
`SplitterThumb gap={`${dotGap}px`}` — into the existing inline `style`
object (`Splitter.tsx`). Post-fix sweep for backtick style props in the
Splitter dir: zero matches. `sync --verbose`: zero Splitter warnings.

## B-28 REOPENED — `minSize`/`maxSize` leak into `css()` — FIXED

Actual prop path (root cause): pre-rename call sites pass
`minSize`/`maxSize`/`index` (exactly the consumer-smoke template shape).
`minSize`/`maxSize` **are real CSS style props** (`min-size`/`max-size` in
`stylePropNames`), so the old `...props` → `Div` spread routed them into
`css({minSize: 10})` → "no compiled class for minSize: 10", and the
constraint never reached the solver. The earlier fix only covered the
renamed `min`/`max` (+ `collapsible`/`collapsedSize`); the legacy names
were the uncovered path. `index` (deleted API, not a style prop) leaked
onto the DOM as an unknown attribute.

Fix (`Splitter.tsx`):
- `SplitterPanelProps` omits `minSize`/`maxSize` from the CSS surface and
  redeclares them as deprecated solver aliases (`min`/`max` win when both
  set). Destructured before spread — never reach `css()` or the DOM.
- Legacy `index` stripped at runtime on Panel **and** Handle (stays a type
  error by design; SP-TYPE-01 pins untouched).

Regression tests (zero leak + zero miss warnings + solver aliasing):
- Unit (`Splitter.contract.test.tsx`): legacy mount asserts
  `aria-valuemin/max` = 10/90, no `minsize`/`maxsize`/`index` DOM attrs,
  zero leak-signature console errors/warnings; plus a `min`/`max`-wins
  precedence test.
- CT (`Splitter.ct.spec.ts` + new `LegacyProps` story): same assertions in
  a real browser, warnings captured via console listener (targeted leak
  signature only — blanket zero-warnings would catch H-6 dev-race noise).

Negative control (both levels): with the `Splitter.tsx` fix stashed, the
new tests fail exactly on the leak signature (`aria-valuemin` "5" instead
of "10" — `minSize` swallowed by `css()`); with the fix, green.

## Verification (suites with Failed counts)

- `pnpm --dir packages/reference-lib sync`: clean, 255.9 KB CSS, 0 Splitter
  warnings. **Failed: 0.**
- `pnpm agentct Splitter --unit`: 35/35 passed (25 math + 10 contract,
  incl. 2 new). **Failed: 0.**
- `pnpm agentct Splitter --e2e` (React 19): **67/67 passed, Failed: 0**
  (×2 consecutive full greens; one earlier run showed 11 transient
  failures that cleared with no code change — parallel-crew interference
  on the shared gallery, not this diff).
- Negative controls: unit 1 failed/34 passed without fix; CT 1/1 failed
  without fix — both fail on the leak signature. **Proves the guard.**
- `tsc --noEmit`: zero Splitter errors (remaining errors in
  Accordion/Slot — foreign crews' files).

## Flags for HQ

1. `minSize`/`maxSize` on `Splitter.Panel` now mean solver constraints,
   not CSS `min-size`/`max-size` (names collided; constraint meaning wins
   as the pre-rename API). A consumer setting genuine CSS min-size on a
   Panel must use `style={{ minWidth/minHeight }}` instead.
2. The consumer-smoke template still mounts the pre-rename API
   (`index`/`minSize`/`maxSize`); it now passes silently with working
   constraints. Consider updating the template to `min`/`max` (out of my
   scope) so the gate exercises the current API.
3. First e2e run flaked 11 failures under parallel-crew load, then went
   67/67 twice untouched — if the mission wants a quieter signal, CT runs
   should avoid overlapping `sync` + multi-crew edit windows.
