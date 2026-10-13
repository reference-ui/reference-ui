# Atlas cases

Each direct subfolder of this directory is one Atlas scenario. Folders are named by
the raw station id (`ATL-<AREA>-NN`); the descriptive slug lives in the first line of
the case README.

The intended layout mirrors Tasty closely, but Atlas is still earlier in its
implementation. Each case should own:

- `input/app/` — the project root Atlas analyzes
- `input/demo-ui/` or other support packages — local library-style modules used by the app
- `spec.ts` — the station specification: scenario-local assertions
- `output/` — reserved for known analysis output once Atlas emits real artifacts

Current seed case:

- `ATL-SURF-01/` — local wrappers, local composition, and library component usage
- `ATL-NAME-02/` — renamed local imports still map back to the canonical component
- `ATL-PKG-01/` — namespace imports still resolve included package components
- `ATL-EXPT-01/` — default-exported components and default imports still map cleanly
- `ATL-REXP-01/` — local barrel exports still resolve component identity and usage
- `ATL-REXP-02/` — `export { default as Button }` chains still resolve canonical component identity and aliased call sites
- `ATL-BAR-01/` — local namespace imports routed through barrels still resolve component inventory and usage
- `ATL-WRAP-01/` — `memo(...)`, `forwardRef(...)`, destructured props, and aliased wrapper call sites still map cleanly
- `ATL-VAL-01/` — dynamic JSX expressions still count prop usage without inventing literal value observations
- `ATL-NAME-01/` — same-named local components remain distinct by source and usage
- `ATL-BAR-02/` — local wrappers and included package surfaces resolve through package entrypoint re-exports
- `ATL-BAR-03/` — package default exports forwarded through entrypoint barrels still resolve inventory and interface mapping
- `ATL-PAIR-01/` — common co-usage stays deterministic and ranks more-common neighbors higher
- `ATL-PROP-01/` — unresolved props types preserve partial results and emit diagnostics
- `ATL-TYPE-01/` — unsupported inline props annotations emit diagnostics instead of vanishing silently

Atlas global setup now writes known outputs per case under `output/`:

- `analysis.json` — structured Atlas analysis for the case app root
- `diagnostics.json` — current Atlas diagnostics payload for the case

As Atlas grows, the same folders should keep driving real end-to-end analysis
and golden outputs.

Current release-bar case families are finite and focused:

- direct local components
- local wrappers and composition
- aliased imports and renamed call sites
- default exports and default imports
- local barrel re-exports
- default re-export alias chains
- local namespace barrel imports
- namespace package usage
- package barrel resolution
- package default-export barrel resolution
- same-name local collisions
- dynamic prop expressions
- deterministic co-usage
- unresolved props diagnostics
- unsupported inline props diagnostics

Those are release-bar cases because they support the real Atlas contract:

- components available
- component usage
- interface/props mapping
- common co-usage

Implementation-detail hardening cases still matter, but they are secondary to
those outputs:

- `ATL-WRAP-01/` — ensures helper forms like `memo(...)` and
  `forwardRef(...)` do not break the core contract

Recommended next hardening cases:

- `ATL-BAR-03/` — package entrypoints that forward default exports
- `ATL-BAR-01/` — local namespace imports routed through barrel files
- `deeper_wrapper_indirection/` — one more helper layer that should still preserve the same outputs
