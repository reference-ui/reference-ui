# `keywords.json` schema

Small, hand-authored search metadata that lives next to the thing it
describes. Two homes:

- Neo case: `packages/reference-neo/tests/cases/<family>/<CASE-ID>/keywords.json`
- RS module surface: `packages/reference-rs/modules/<name>/keywords.json`
  (one file per module — see `.agents/case-index/rs-adapter.mjs`)

All four keys are optional arrays of strings. Keep each list short
(under ~12 entries); the index already covers `case.json` names and
`README.md` text, so only add terms a searcher would use that appear
in neither.

```json
{
  "keywords": ["hover", "data-hover", ":is()"],
  "aliases": ["dual bind", "hover twin"],
  "related": ["NEO-COND-02", "ATM-COND-02"],
  "covers": ["conditions/hover", "selector :is()"]
}
```

| Key | Meaning |
| --- | ------- |
| `keywords` | Search terms for this case/surface (features, selectors, APIs). |
| `aliases` | Alternate names searchers might type (informal titles, old ids). |
| `related` | Ids of sibling cases/suites worth reading next (neo ids, `ATM-*` / `TST-*`, `rs:<module>`). Informational only — surfaced in `list --json` and `search --json`, never traversed. |
| `covers` | Feature paths this case proves. Convention is `family/thing` (e.g. `conditions/hover`); the strings are free-form with no enforced registry. |

Unknown keys are ignored by the indexer (forward-compatible, never fatal).

Reference examples (hand-written, replicate this pattern):

- `packages/reference-neo/tests/cases/cond/NEO-COND-01/keywords.json`
- `packages/reference-neo/tests/cases/cond/NEO-COND-02/keywords.json`
- `packages/reference-rs/modules/atomic/keywords.json`

Agents reach this index through the "Case index" section of each skill
(`agent-neo` §10, `agent-rs` §6, `test-component`, `test-core` §5,
`tweak-component` §4). The CLI is `pnpm agent:cases`
(source: `.agents/case-index/cli.mjs`, indexer: `.agents/case-index/index.mjs`).
