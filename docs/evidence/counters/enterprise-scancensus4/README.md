# enterprise-scancensus4: wave-4 scan-recon per-file-class libc census

Aside-shim census (stock `counters-interpose.c` + class tagging, see REPORT
`scan-recon4` for the build record): 3 scored runs (A/B/C) on tip
`b8a75b0bd74c`, frozen enterprise load (3000 style + 12000 dead + 120 recipe,
seed 7), bench-locked, binaries sha-verified.

- `<tag>-census.json`: stock schema-1 libc totals (bit-exact cross-check base).
- `<tag>-class.json`: schema-2 per-call × per-class counts/ns/bytes/min/max +
  first-4 + last-4 path samples. Classes: unknown/other/style/dead/recipe/dir.
- `<tag>-pivot.json`: phase × call × class rows (same-run phase windows).
- `<tag>-phases.json`: agentrs-phases/1 marks + stopwatches.
- `<tag>-run.json`: worker sample + generated-repo layout stats.
- `<tag>-events.json.gz`: schema-2 timestamped events
  `[callIdx, ticks, durNs, bytes, classIdx]`; calls/classes arrays in header.

Raw (unsliced) events live in the captain's pickup at the paths in REPORT.md.
