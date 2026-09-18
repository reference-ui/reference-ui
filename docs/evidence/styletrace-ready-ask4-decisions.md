# READY ask 4 — D1–D4 defaults: confirm or override

Verdict: **confirm all four** (D1 canon-125 · D2 no · D3 (a) · D4
deferred-post-#5). Each confirmation below carries the evidence that
would have overturned it.

## D1 — primitive universe: canon 125 · CONFIRM

- Counts verified: canon `ELEMENTS`/`PRIMITIVE_JSX` = **125**
  (`canon/src/html.rs`); Neo `TAGS` = **101**
  (`reference-neo/src/primitives/tags.ts:6-109`).
- Canon-only = exactly the **24 SVG children**: Circle ClipPath Defs
  Ellipse ForeignObject G Image Line LinearGradient Marker Mask Path
  Pattern Polygon Polyline RadialGradient Rect Stop Switch Symbol Text
  Tspan Use View. Neo-only = **∅** (strict superset, as claimed).
- False-host risk on lib: **nil**. Zero lib `src` files import any of
  the 24 from `@reference-ui/react` (single-line import scan + per-name
  whole-tree scan; remaining hits are comments/strings/test text). The
  traced 53 are identical under 101 vs 125 on the real tree.
- A wrapper importing an SVG-only name is a broken import regardless
  (`undefined` at runtime — Neo never declared or exported it), so
  tracing it costs nothing anywhere.
- The follow-up (derive Neo `TAGS` from canon, retiring the "Neo-owned
  copy" comment in `tags.ts:1-4`) stays valid and stays out of this
  mission.

## D2 — provenance in the artifact: no · CONFIRM

- `NEO-SYNC-04` (`compile-request.spec.ts:80-84`) and `NEO-SYNC-10`
  (`extends.spec.ts:47-61`) assert **exact** `jsx-elements.json` objects;
  a `traced` key re-pins both, plus `sync.test.ts` artifact assertions.
  Zero-drift forbids it inside this mission — the artifact row (`local`
  = same 53, byte-identical) is the witness.
- Revisit when the test index wants discovered-vs-declared (mission's
  own note stands).

## D3 — member spellings: (a) escape hatch · CONFIRM

- Mechanism verified: `handle_namespace_target`
  (`styletrace/.../walk/jsx.rs:122-141`) returns `None` unless the
  namespace is an *imported* namespace (`import * as NS`); `const NS =
  { Panel: Div }` (`NEO-SITE-16/world/src/app.tsx:8`) yields no import
  binding → no edge. Object-literal namespaces are unmodeled, as
  claimed.
- The config path works today: extractor `allows_jsx_tag` matches the
  dotted name before the concat fallback (`atomic/src/extract/mod.rs`
  per mission §D3; concat rule verified at `allows_jsx_tag`), and
  SITE-16 pins it (`NSPanel` admits `<NS.Panel>`, twin silent).
- Lib needs nothing: its `Overlay.Content` works through the concat
  rule on traced `OverlayContent`. (b) stays available, (c) stays the
  principled Overmatch end-state; neither is needed before #5.

## D4 — package re-exports as hosts: deferred-post-#5 · CONFIRM (strengthened)

Ask-3 evidence upgrades "deferred" from prudence to necessity:

1. It **moves pixels by construction**: the Collapsible chevron alone
   mints 2 new atoms and flips sizing from the 20px `size` token to
   `1.25em`-driven utilities. Folding this into #5 breaks zero-drift
   (sheet + snapshot rows) by definition — the very thing #5 witnesses.
2. It needs **two** engine capabilities, neither of which is slice-3
   work: a source-side package entry (or compiled-`.mjs`-shape
   factories) *and* file-local alias/binding resolution (ask-3 V1/V2
   bisect: the `IconShell` alias is gap-#3 class, an Overmatch row).
3. Parity agrees: core's 53 also refuse the 3,857 re-exports, and the
   root probe reproduces that refusal exactly.

Scope guard for the D4 wave (recorded, not planned): entry preference
(`.mjs`+factory vs dist→src mapping for out-of-root packages), alias
resolution, per-icon pixel attestation starting with chevrons (landing
waves already carry chevron footnotes).
