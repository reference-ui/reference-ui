# Mission: FINALIZE — reference-system

Captain holds whole-mission context. Source brief:
`FINALIZATION_REPORT.md` (repo root at mission start; archived beside this file).

Branch: `reference-system`. Crews run **DeepSeek V4.1 Flash**
(`deepseek/deepseek-flash#high`). Crews never commit; the captain commits
named files only, one verified arc per commit, after re-running the decisive
gates firsthand. Every arc gets an **Oracle** review (Muse Spark 1.3
Contributor, Max effort, via the `oracle` carrier), and a fix line that
answers the Oracle's wants/demands before the arc lands.

## Why sequential, not parallel implementers

One working tree, one shared native `.node`, one `ref sync` critical path.
Perf proofs (Arc 1 counters, Arc 2 one-shot wall) are confounded if two
edits sit in the tree at once. So implementers serialize; **Oracle reviews and
fix lines overlap** with the next arc's implementation (read-only reviews do
not touch the tree).

## Objectives, in order

| ID | Objective | Owner | Bar |
| --- | --- | --- | --- |
| O1 | Land the lingering verified work: font-weight fix, MDX fragment exclusion, System docs section | captain (verify crew) | each chunk's own gates green at pin; captain commit |
| O2 (Arc 1) | Memoize external resolution in tasty scanner | impl crew | ≤ ~19 resolutions / ≤ ~19 package.json reads on docs repro; one-shot −~11s; tasty + neo suites green; `agentrs q` clean |
| O3 (Arc 2) | Take tasty off the one-shot critical path | impl crew | cold one-shot reports ≤ ~2s; manifest still lands + retry contract holds; `--json` parseable; neo suite green; `agentneo q` clean |
| O4 (Arc 3) | Native MDX via `mdx-rs` port into Neo sync | impl crew | port + proving case + `bench:neo` before/after; bounded — file scope if the seam is large |
| O5 | Oracle review per arc + address wants/demands | oracle carrier + fix crew | per arc, before commit |
| O6 | Final integrated Oracle review + mission report | oracle carrier + captain | after all arcs |

## Order of operations

1. **Wave 0** — O1 verify (crew) → captain commits lingering work.
2. **Wave 1** — O2 (Arc 1) impl crew → Oracle O2 → fix crew → captain commit.
3. **Wave 2** — O3 (Arc 2) impl crew → Oracle O3 → fix crew → captain commit.
   (Oracle O2 / fix may overlap Wave 2 implementation.)
4. **Wave 3** — O4 (Arc 3) impl crew → Oracle O4 → fix crew → captain commit.
5. **Wave 4** — final Oracle + report; move `FINALIZATION_REPORT.md` out of root.

## Logs

- `O1-LANDING.md`, `ARC1.md`, `ARC2.md`, `ARC3.md` — one status line + entries each.
- `briefs/` — durable briefs. `reports/` — crew + Oracle reports.
- Crews append; if it is not in the log, it is lost.
