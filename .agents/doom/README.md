# Doom log

Every doom hunt ends here. Future doom agents consult this log before
hunting so each cycle gets smarter instead of re-exploring dead ends.

## Reporting duty

After every hunt — break found or clean — the doom agent writes one
markdown report to `.agents/doom/logs/`:

- Filename: `YYYY-MM-DD-<short-slug>.md` (e.g.
  `2026-09-20-harvest-sink-coverage.md`).
- Start from `../TEMPLATE.md`: Hypothesis + Verdict, nothing else.
- Record with precision, not volume: the gap, the red test, the
  outcome, the repro path. One gap per report. This log is the
  next agent's map — keep it scannable.

## Searching

The CLI re-indexes from `logs/` on **every** call — there is no
stale index, ever. This is the permanent policy (HQ 2026-09-19),
not a placeholder: measured 43ms at 10 reports, 93ms at 1000, so
a fresh index costs less than node startup for any log size we
will ever see (~1 file per hunt). Revisit only if `index` crosses
~1s: switch to mtime-checked caching then, not before.

```sh
# Search past hunts (fuzzy over title, module, theories, verdict, body):
node .agents/doom/cli.mjs search "harvest sink" --limit 5

# Machine-readable:
node .agents/doom/cli.mjs search "ladder alias" --json

# Index stats:
node .agents/doom/cli.mjs index
```

Tests (zero-dep, fixtures in temp dirs — the real log is never touched):

```sh
node --test .agents/doom/lib.test.mjs
```

Consult the index **before** hunting: if a gap was already explored,
its red test and verdict are here — do not spend a theory re-proving
it. If the log is thin on your module, say so in your report; that
itself is signal for scheduling.
