# Neo Benchmark

Synthetic-load harness for `sync()`: how much memory, how much time, how big
a bundle — for a tiny product all the way to a large messy app.

## What it is

One benchmark invocation runs every scale in the default suite, syncs each
for real through the native compiler, and pins one report with the combined
result. The report keeps two files: a JSON record for machines and a
markdown readout for humans. Three numbers lead every scale because they
are the whole point: peak RSS during sync, sync wall time, and total bundle
size (`styles.css` + `runtime-data.mjs`, raw and gzip). Beside them sits
the load that produced them: generator, style files, `css()` calls,
recipes, tokens, and the messiness ratios. Generation time is reported as
context and never counted as sync.

## Generators

A scale names a generator plus numeric knobs. Templates write one file kind
each (tokens, config, component, recipe, dead util); the generator
assembles them into a repo. Two generators, different physics:

- app — a product-shaped repo. Components scope 1–4 `css()` calls in
  function bodies, some with one recipe call; one-off values collide
  through small Zipf pools, so the same white, black, and brand hexes
  recur by the thousand; dead files are ~80% of the glob; recipes come
  as part groups (root plus two or three parts) fanning three or four
  variant axes with compounds; tokens read like a palette.
- churn — a namer and atom-table stress. Flat modules of 8–14 top-level
  `css()` exports, every one-off a freshly minted hex. Useful fuzz, not
  an app; opt-in so routine benches skip it.

`uniqueRatio` means “not a token” under both generators. Under app the
one-offs collide; under churn each is a new value. Overrides (`--files`,
`--calls`, `--unique`, `--seed`) bend the selected scale's knobs without
switching its generator.

## Scales

The suite is three fixed rungs, always run in this order:

- small: 60 component files (+240 dead), 1–4 calls each, 6 recipe
  groups, 80 colors / 30 spacing, unique 0.15 — a tiny product, the
  bottom of the curve.
- medium: 250 files (+1,000 dead), 1–4 calls each, 24 recipe groups,
  150 colors / 48 spacing, unique 0.25 — a tidy mid-size app.
- enterprise: 3,000 files (+12,000 dead), 1–4 calls each, 120 recipe
  groups, 300 colors / 64 spacing, unique 0.35 — a large messy
  product, token leakage with reuse.
- churn (opt-in, `--scale churn`): 4,000 flat files (+2,000 dead),
  8–14 calls each, 120 simple recipes, 300 colors / 64 spacing,
  unique 0.65 — the uniqueness stress under its real name.

These definitions are locked: every scale is deterministic — same seed,
same bytes — so runs weeks apart stay comparable. A rung changes only by
deliberately editing the plans, never by drift. `--scale` narrows a run
to one rung (or a comma-separated subset) for fast iteration; without it
the default suite runs small, medium, enterprise.

## What it is not

Bench is not a test and never runs in a suite. It has no `case.json`, so
`agentneo run` cannot see it; it has no `*.test.ts`, so Vitest cannot see
it either. It runs only by explicit command, one invocation at a time, and
it is never gated. Its reports are the committed log, not scratch: hash
pins land in git beside the code they measured.

## Commands

```bash
pnpm bench:neo                        # default suite, one pinned report
pnpm bench:neo -- --scale small       # one rung only
pnpm bench:neo -- --scale small,medium --runs 3
pnpm bench:neo -- --scale churn       # opt-in uniqueness stress
pnpm bench:neo -- --list              # show the named scales
pnpm bench:neo -- --scale medium --files 50 --calls 4 --runs 1 --keep
```

Each run syncs in a fresh child process, so every RSS sample starts from a
cold heap; the parent only generates, spawns, measures the bundle, and
writes the log. Memory sampling ticks every 10ms inside the child around
`sync()` alone — module load and generation stay outside the number.

## Reading a report

```
reports/<hash>/
  result.json   # full record: every scale, per-run samples, bundle bytes
  report.md     # the readout: summary table first, then one section per scale
```

The pin resolves before generation, from the tree ignoring `reports/`
itself — report files never decide the pin. A clean tree pins
`reports/<hash>/` (12-char commit hash); re-running on the same clean
commit overwrites that folder. A dirty tree, or no git checkout at all,
overwrites `reports/latest/` instead. `latest/` is the scratch pad for
the refine loop: iterate dirty until the numbers mean something, commit
the change, bench again for the hash pin, then commit the pin as the new
log entry. Compare `report.md` across pins for drift; reach for
`result.json` when a number needs its per-run spread. A new scale starts
as overrides on an old one and earns a name only when the team keeps
reaching for it.
