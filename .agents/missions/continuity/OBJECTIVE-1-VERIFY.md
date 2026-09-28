# OBJECTIVE-1 VERIFY — status: COMPLETE

Mission: OPERATION CONTINUITY-01 (closed-scale resolution gap).
Crews: repro / scale / runtime. Reports land as crew-*.md in this dir.

## RUNTIME — REPORTED (crew-runtime.md)

- Warn-and-skip = unbacked miss class on DOM (paints nothing) + one
  `console.warn` per distinct miss, dev-browser only, deferred past
  `load` (H-6 hold-until-load in tree: css.ts:92-115).
- Exact template (css.ts:133-135): `[reference-ui] css(): no compiled
  class for \`<prop>: <value>\` (called at <site>). Add a static call
  site or staticCss entry; miss class emitted but unbacked, paints nothing.`
- Prod: FULLY SILENT (css.ts:125-127 early-return). Wrong layout
  undetectable at runtime. This is the scary line for HQ.
- Option B verified absent: zero insertRule/adoptedStyleSheets in
  neo runtime + atomic namer; css() returns string only.
- H-6 race pinned: pre-load "absent from styleSheets" can't
  distinguish true miss from not-yet-arrived (Vite inline styles land
  after first render). Residual: rs-side sheetsComplete, post-load HMR.
- Prior logs found: .agents/missions/sharp/h3.md (W-04 seams),
  .agents/missions/sharp/h6.md (race log, COMPLETE).

## REPRO — REPORTED (crew-repro.md) — NOT REPRODUCED, corroborates SCALE

- Real `ref sync` (the entry lib itself builds through) on /tmp fixture:
  `140r`, `137.5r`, `rgba()` ALL emit in both css() and `<Div maxW>`
  forms. Exit 0, `--json` diagnostics `[]`, zero warnings.
- Emitted: `calc(140 * var(--spacing-root))` etc.; runtime css()
  resolves all seven probes to sheet classes (no miss warnings).
- Incidental: duplicate utility rules (css()+JSX, no emitter dedup);
  `--spacing-root` is AUTHOR-DEFINED, not auto-emitted — a missing
  root var produces "paints nothing" for ALL r-values, the likely
  shape of the original sighting if observed visually.
- Recommendation: re-check the original sighting's exact location
  (legacy path? stale .reference-ui? undefined root var? unscanned
  consumer?) against fresh `ref sync`.

Pending: none. Unanimous: no closed-scale bug on the live path.

## SCALE — REPORTED (crew-scale.md) — PREMISE OVERTURNED

- NO closed r-scale table exists. Both engines compute N x root for
  arbitrary N: legacy `resolveSingleRhythmValue` (helpers.ts:64-67),
  neo `resolve_single_rhythm` f64 (rhythm/mod.rs:43-67).
- 120r-in/140r-out = HARVEST SCOPE: shipped sheet carries only
  literals seen in scanned sources (README:30-33). 120r via stories +
  smoke template, 200r via Menu.book, 140r in zero lib sources.
- Second gap (legacy path only): min/max props have ZERO rhythm
  coverage — JSX dropped (no utility, presets empty), recipes emit
  verbatim-invalid (`max-width: 36r`, browser-dropped). Neo path
  computes all props incl. min/max.
- maxW=140r neo+scanned: COMPILES (calc(140*root)). Neo+unscanned:
  miss class + dev warn (README-documented). Legacy: never paints.
- W-04 implication: loud failure incoherent for harvest misses
  (already dev-warned); coherent only for malformed (unknown props
  already UnknownProperty-rejected).
- Captain action: implement lead REBRIEFED off the r-computation
  build (exists) onto: confirm repro, verify legacy liveness +
  min/max gap, pin continuity tests. Runtime fallback NOT authorized
  (HQ policy call pending).
