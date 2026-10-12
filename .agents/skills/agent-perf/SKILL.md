---
name: agent-perf
description: Reference serial sync() performance index (diets, alloc kills, lookup restructure in packages/reference-rs): the Memex `perf` collection of every diet, verdict and dead end filed so far, the script that regenerates it, and how to read its entries. Activate before scoping any sync() speed work.
---

# agent-perf — Reference serial-perf index

Institutional memory for serial `sync()` speed in `packages/reference-rs`:
what was tried, what landed, what was cut, and why. Answer perf questions
from this index and the entries it points to, never from memory.

## 1. Activate when

- The task is `sync()` / compile speed in `packages/reference-rs`
  (diets, alloc kills, lookup restructure, emitter work).
- Someone asks what was tried before on perf ground — answer from the
  index (section 3), never from memory.

Do NOT activate for component look/feel (`view-story`), component
tests (`test-component`), Neo runtime (`agent-neo`), or benchmark
reporting (`benchmark` — that skill *reads* numbers, this one *moves* them).

## 2. Verdicts

Every entry carries one verdict:

- **LAND**: a verified change committed to `reference-system`, with its
  pinned bench:neo report.
- **BANK**: implemented and proven; its patch waits unlanded for an
  integration to join it.
- **CUT**: the measured ceiling is too small to be worth landing, or the diet
  measured about zero. Dropped.
- **HOLD**: the merge needs a design that neither patch has. The entry carries
  a re-proof spec.

## 3. Perf index (institutional memory, via Memex)

Memex is the one agent CLI over every collection
(`.agents/memex/README.md`): every diet, recon, CUT, integration,
memo, and dead end is one entry in the `perf` collection — verdict,
effect, files, report path (+ patch path while unlanded — landed
patches are deleted, their file lists snapshotted in the builder),
summary, the LOG.md entry, filler flag. Always `search`
before scoping new work — re-litigating a closed topic without new
filed evidence is a protocol violation. Overrules are flagged on the
entry (`show perf:INT-W2-SET4`). Wave `log` holds DEAD-* dead ends
mined from LOG.md (verdict CUT, report LOG.md) — check them before
re-opening a closed topic. On ground with zero index coverage (no
hits across topic synonyms), file one line (`index: 0/N`) and
proceed; grinding queries to prove a negative is busywork. File
off-scope BANKs so the index grows onto new ground instead of
staying sync()-only.

```bash
node .agents/memex/cli.mjs search "<query...>" --in perf [--limit n]  # substring-AND over topic/id/verdict/summary/log — exact, never fuzzy
node .agents/memex/cli.mjs search "verdict:BANK wave:wave-2" --in perf  # exact field filters (verdict/wave/kind), combinable with words
node .agents/memex/cli.mjs show perf:PERF-W2-..                       # full entry: files, numbers, LOG text
node .agents/memex/cli.mjs search --in perf                           # roster + wave/verdict counts
node .agents/skills/agent-perf/scripts/build-index.mjs                # regenerate perf-index.json after new filings (never takes args)
```

Targeted `--in perf` search keeps the exact substring-AND semantics: a
query word must appear verbatim in at least one field. Wave/verdict
filtering is exact field syntax (`verdict:BANK wave:wave-2`), not flags
— plain words like `BANK wave-2` also match prose mentions. Overruled
entries carry a `† superseded by <id>` marker and answer to `overruled`.
