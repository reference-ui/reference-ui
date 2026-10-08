# Memex — one CLI over every agent collection

```sh
node .agents/memex/cli.mjs search [<query...>] [--in <coll>] [--limit N] [--json]
node .agents/memex/cli.mjs show <id-or-path> [--up N] [--limit N] [--json]
```

Two verbs. `search` with no query lists collections; with `--in` and no
query it lists one collection's roster. `show` resolves filesystem paths
through the graph and `collection:id` refs (or bare ids) to docs.
Exit 0 on success (including no matches), 1 on unknown id/path, 2 on misuse.
Unknown, repeated, or misplaced flags are rejected, never swallowed.
`--help` (or `-h`) after any verb prints usage; `--` ends flag parsing.

## The explore loop

```sh
node .agents/memex/cli.mjs search                                  # list collections
node .agents/memex/cli.mjs search --in doom                       # roster of one collection
node .agents/memex/cli.mjs search "namer" --in doom               # ranked hits, labeled
node .agents/memex/cli.mjs show doom:2026-09-20-jettison-namer-key-order.md
node .agents/memex/cli.mjs show packages/reference-rs/modules/tasty/README.md
```

Every hit is labeled `collection:id`, and every label pipes back into
`show`. Ranked search defaults to 15 hits and always prints its total
(`showing 15 of 44 (--limit 44 for all)`), so a capped list never
passes as complete. Scores compare only within one result list —
never across invocations or collections.

## Collections

| Name       | Kind     | Source                                                             | Owner            |
| ---------- | -------- | ------------------------------------------------------------------ | ---------------- |
| `doom`     | markdown | `.agents/doom/logs/*.md`                                           | doom-agent skill |
| `cases`    | neo      | `packages/reference-neo/tests/cases` (case.json + README + specs)  | agent-neo skill  |
| `surfaces` | rs       | `packages/reference-rs/modules` (README + suite/case inventory)    | agent-rs skill   |
| `perf`     | perf     | `.agents/skills/agent-perf/perf-index.json` (committed)            | agent-perf skill |
| `flames`   | markdown | `.agents/rs-index` (bundle notes + ledgers; raw profiles excluded) | agent-perf skill |
| `graph`    | system   | built in: every README.md + every file-top header                  | memex itself     |

Global `search` ranks the five manifest collections with a prior for
authoritative docs (surfaces ×3, cases ×2) over evidence logs. The
graph is targeted-only (`--in graph`): thousands of harvested headers
would drown curated hits in a global rank. `show <path>` always walks
the graph regardless of collection.

## Search semantics

MiniSearch collections (everything but targeted perf) stem terms
(`queries` matches `query`), split punctuation (`atomic/namer`
searches `atomic` + `namer`), drop single-character tokens, and match
fuzzy + prefix. Hits that matched only fuzzily carry their variant
(`[~names]`), so a surprising hit explains itself. Snippets show the
matched line, de-duplicated across hits, with `…` on truncation.

Snippets ignore query tokens shorter than 3 characters when picking
lines. Targeted perf search is exact substring-AND (never fuzzy): every
word must appear verbatim in topic, id, verdict, summary, log, or the
overrule/landing note. It also takes exact field filters —
`verdict:BANK wave:wave-2 kind:diet` — combinable with plain words.
Unknown `field:` prefixes fall back to literal words. Overruled
entries carry a `† superseded by <id>` marker on one-liners and answer
to `overruled`.

## Show resolution

`show` tries, in order: an in-repo file (chain walk) → a directory
(its README) → exact id → case-insensitive id → basename → basename
without `.md` → an `rs:` module slug. Bare ids that match in several
collections list their candidates instead of guessing. Paths outside
the repo get their own error. `--up N` depth-caps chain walks (default:
to the root); on a graph label it walks that file, on any other id it
errors — a passed flag never silently does nothing.

| Form            | Example                       | Resolves?                           |
| --------------- | ----------------------------- | ----------------------------------- |
| `collection:id` | `show perf:PERF-W2-HASHERS`   | always                              |
| bare id         | `show PERF-W2-HASHERS`        | when unique across collections      |
| `rs:` ref       | `show rs:tasty`               | to `surfaces:rs:tasty`              |
| module slug     | `show tasty`                  | to `surfaces:rs:tasty`              |
| basename        | `show summary.md`             | unique → doc; many → candidate list |
| repo path       | `show packages/…/identity.rs` | chain walk                          |
| directory       | `show packages/…/atlas`       | its README                          |

## JSON shapes

- `search … --json`: `{total, returned, hits[]}`; hits carry
  `collection/id/score/title/extra/path/snippet/fuzzy[]` (`score` is
  null for exact perf hits, `fuzzy` lists matched variants).
- `search --in <coll> --json`: `{collection, total, returned,
header, docs[]}`; the perf header carries `{built, waves, verdicts}`.
- bare `search --json`: the complete collections array.
- `show … --json`: `{ref, text}` plus the doc's structured fields
  (perf: verdict/wave/kind/report/files/…; neo/rs: related/specs/suites).
- misses with `--json`: `{error}`; ambiguous ids: `{ref, candidates[]}`
  — both exit 1, so branch on the shape, not the code. Other errors
  with `--json`: `{error}` on stdout with the usual exit code.
  Without `--json`, errors go to stderr as text.

## Manifests (for collection owners)

A manifest collection is one JSON file in `collections/`: name,
description, owner, kind, roots, and field weights. Frontmatter is
optional everywhere — a doc with none still indexes, and a missing
field just doesn't score. Weights name MiniSearch field boosts;
targeted search uses the collection's own weights, global search takes
the max per field across collections.

```json
{
  "name": "doom",
  "description": "Doom hunt reports.",
  "owner": "doom-agent skill",
  "kind": "markdown",
  "roots": [".agents/doom/logs"],
  "include": ["*.md"],
  "id": "basename",
  "weights": { "title": 3, "module": 2, "verdict": 2, "tags": 2 }
}
```

Kinds are memex built-ins: `markdown` (.md plus small .json sidecars),
`neo` (one doc per case), `rs` (one doc per module), `perf`
(perf-index.json entries). New markdown knowledge needs only a manifest —
no code, no CLI change.

## The graph

No manifest, no setup: the file-header convention is the schema. Every
`README.md` is a doc; every code file (`.rs`, `.ts`, `.js`, `.mjs`,
`.sh`, …) whose top block is a `//!`, `//`, `/**`, or `#` comment
contributes its header. Deps, build output, VCS, and hidden state dirs
are never walked (`.agents` excepted).

`show <path> [--up N]` prints the file's own header (full content for
markdown) plus each ancestor README up N levels — the default walks to
the repo root. `--up 0` prints the file alone.

## Writes

Memex is the read path. Agents write markdown (doom logs, wave filings,
READMEs) and Memex reads it live — there is no rebuild step. The one
exception is perf's derived `perf-index.json`: after new filings, the
owner regenerates it directly:

```sh
node .agents/skills/agent-perf/scripts/build-index.mjs
```

## Dependencies

One: `minisearch`, resolved from the workspace root install (see root
`package.json`). If it ever goes missing, Memex fails fast with the fix
instead of a stack trace. The day Memex wants a second dependency is
the day it becomes a real package; until then it stays bare scripts.
