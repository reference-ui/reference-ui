# microbundle release readiness

## Verdict

Release-ready for internal use.

## Why

This helper is central to some of the most important flows in `reference-core`:

- config loading
- fragment execution
- generated runtime assembly

That makes it high leverage, so it needed direct tests to pin down its own
contracts before earning a release-ready label.

Those tests now exist for:

- default option shaping
- explicit overrides
- `external` filtering
- output format selection (`esm` / `cjs` / `iife`)
- `alias` plugin exact-match behavior
- error surfacing when esbuild fails
- empty-output behavior

## Remaining limits

- broader confidence still depends on downstream consumers like config and
  fragments
- esbuild integration is lightly mocked in one test rather than exercised
  exhaustively against real files

## Practical judgment

For its role as an internal bundling primitive, this module is now solid enough
to ship as part of Reference UI.
