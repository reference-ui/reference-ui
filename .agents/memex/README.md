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
node .agents/memex/cli.mjs search --in cases                      # roster of one collection
node .agents/memex/cli.mjs search "namer" --in cases              # ranked hits, labeled
node .agents/memex/cli.mjs show cases:NEO-NAMER-01
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
| `cases`    | neo      | `packages/reference-neo/tests/cases` (case.json + README + specs)  | agent-neo skill  |
| `components` | component | `packages/reference-lib/src/components/*/case.json` (exact test declarations) | test-component skill |
| `surfaces` | rs       | `packages/reference-rs/modules` (README + suite/case inventory)    | agent-rs skill   |
| `rs-cases` | rs-case  | `packages/reference-rs/modules/*/tests/cases` (case.json + README + spec.ts) | agent-rs skill |
| `graph`    | system   | built in: every README.md + every file-top header                  | memex itself     |

Global `search` ranks the manifest collections with a prior for
authoritative docs (surfaces ×3, cases ×2, rs-cases ×2) over evidence logs. The
graph is targeted-only (`--in graph`): thousands of harvested headers
would drown curated hits in a global rank. `show <path>` always walks
the graph regardless of collection.

## Search semantics

MiniSearch collections stem terms
(`queries` matches `query`), split punctuation (`atomic/namer`
searches `atomic` + `namer`), drop single-character tokens, and match
fuzzy + prefix. Hits that matched only fuzzily carry their variant
(`[~names]`), so a surprising hit explains itself. Snippets show the
matched line, de-duplicated across hits, with `…` on truncation.

Snippets ignore query tokens shorter than 3 characters when picking
lines.

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
| `collection:id` | `show cases:NEO-NAMER-01`     | always                              |
| bare id         | `show NEO-NAMER-01`           | when unique across collections      |
| `rs:` ref       | `show rs:tasty`               | to `surfaces:rs:tasty`              |
| module slug     | `show tasty`                  | to `surfaces:rs:tasty`              |
| basename        | `show summary.md`             | unique → doc; many → candidate list |
| repo path       | `show packages/…/identity.rs` | chain walk                          |
| directory       | `show packages/…/atlas`       | its README                          |

## JSON shapes

- `search … --json`: `{total, returned, hits[]}`; hits carry
  `collection/id/score/title/extra/path/snippet/fuzzy[]` (`fuzzy` lists matched variants).
- `search --in <coll> --json`: `{collection, total, returned, docs[]}`.
- bare `search --json`: the complete collections array.
- `show … --json`: `{ref, text}` plus the doc's structured fields
  (neo: family, related, specs; rs: related, suites, caseIds; rs-case: module, related, specs).
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
  "name": "notes",
  "description": "Meeting notes.",
  "owner": "no owning skill",
  "kind": "markdown",
  "roots": ["docs/notes"],
  "include": ["*.md"],
  "id": "basename",
  "weights": { "title": 3, "tags": 2 }
}
```

Kinds are memex built-ins: `markdown` (.md plus small .json sidecars),
`neo` (one doc per case), `component` (one doc per lib case), `rs` (one doc per module), `rs-case` (one doc per reference-rs case). New markdown knowledge needs only a manifest —
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

Memex is the read path. Agents write markdown (READMEs, notes) and Memex reads it live — there is no rebuild step.

## Dependencies

One: `minisearch`, resolved from the workspace root install (see root
`package.json`). If it ever goes missing, Memex fails fast with the fix
instead of a stack trace. The day Memex wants a second dependency is
the day it becomes a real package; until then it stays bare scripts.
