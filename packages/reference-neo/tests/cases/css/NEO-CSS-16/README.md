# NEO-CSS-16 — arbitrary rhythm computes end to end, an unscanned step misses loud

The world pins `--spacing-root` and calls `css()` with `maxWidth: '140r'`
and `maxWidth: '137.5r'` — magnitudes no scale table lists, on a min/max
prop the legacy Panda path never covered. The spec checks the sheet
carries both root calc formulas, each probe carries its runtime class,
and both paint their computed pixels at the known root. A third probe
takes its width from a `data-w` attribute no scan reads. Harvest mints
the pooled `0.25rem` root length onto that dynamic site as a floor rule,
but `999r` itself has no rule: it carries its constructed miss class,
computes `max-width: none`, and reports exactly one browser-dev
diagnostic naming the prop, the value, and the call site. Scanned steps
paint; unscanned steps warn.

Evidence: OPERATION CONTINUITY-01 (`140r`/`137.5r` emit with exit 0, zero
diagnostics); `[atm]` ATM-RHYTHM-06 (compile seam, JSX aliases);
contrast `NEO-CSS-12` (small steps) and `NEO-NAMER-03` (color miss shape).

> Search terms: continuity, arbitrary rhythm, unseen scale value, min max width rhythm, harvest miss, unscanned value, miss class, dev diagnostic, computed max-width, spacing root
