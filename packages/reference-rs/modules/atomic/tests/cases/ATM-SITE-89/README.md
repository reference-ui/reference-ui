# ATM-SITE-89 — An on-disk file whose style trace fails warns STT-W-SKIPPED-FILE once instead of silently losing its wrappers

Card's props type comes from `types`, which does not parse. Card's style
trace fails at that import, so Card is not a traced host and `App`'s
`<Card mt="4r" />` extracts nothing. The host trace re-parses each on-disk
entry and reports the failure once, naming `Card` and the styletrace error
text. The failed fold in the parallel lane stays silent for on-disk files on
purpose, so the same failure is never named twice. `types` reports its own
parse failure, and `App` gets the missing-graph error from extraction.
Contract: SPEC. Siblings: ATM-SITE-57 (unparsable entry
file, one located warning), ATM-SITE-13 (missing host graph).

> Search terms: style trace failure, STT-W-SKIPPED-FILE, fold_trace_module, wrapper, silent, warning
