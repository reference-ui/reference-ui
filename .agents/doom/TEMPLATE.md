---
date: YYYY-MM-DD
cycle: N
module: <top-level module hunted, e.g. atomic/extract/harvest>
theories_spent: 0
verdict: clean-hunt | break-found
---

# <Short slug title>

## Hypothesis

The gap pursued and the red test written against it. One gap per
report — if the hunt spent theories on multiple gaps, the report
names each, but the file stays small enough to read in one go.

## Verdict

`clean-hunt` or `break-found`. For breaks: the minimal repro path
(repros live in `/tmp`, never the tree), the violated contract
with its citation, and severity (user-facing vs curiosity).
