# swarm-rawindex REPORT: parse the 5.27MB icons index once, not three times

One line: MCP icons index imported as raw text (single parse) + loadJS branch for the parsed-import path; cold import −160.3 ms / −53.3%.

Effect: -160.3 ms / -53.3% on MCP bundle cold import, 8/8 agree (swarm
locked 8-pair on focused bundles: 300.5 ms -> 140.2 ms). Captain
firsthand A/B on the real production bundle: baseline 387/382/409 ms
vs diet 234/231/219/221 ms across fresh processes.

## Mechanism (one)

`packages/reference-mcp/src/data/icons-index.json` (3857 docs) is
imported as JSON, so it arrives as a parsed object — then the
`IconsSearchEngine` constructor ran `JSON.stringify` on it only to
hand the string to `MiniSearch.loadJSON`, which parses it again.
Import-parse, stringify (~32 ms), re-parse (~29 ms): three trips
over the same payload, plus tsup inlining the index as a giant
object literal in the bundle.

Fix, two files of one mechanism (parse once):

- `src/pipeline/icons-search-index.ts`: constructor takes a
  `MiniSearch.loadJS` branch when the index arrives parsed
  (dev/vitest path), keeping `loadJSON` for the string path.
- `tsup.config.ts`: scoped esbuild `onLoad` text-plugin for
  `icons-index.json` only — the bundle embeds the index as a string
  literal (single `JSON.parse` at load). Every other `.json` import
  keeps its loader. The literal `?raw` import was proven unsupported
  (this esbuild loads parsed JSON despite it), hence the plugin.

Ctor census: 106.8 ms -> 51.2 ms (stringify + reparse killed).
Bundle: 6.13 MB -> 5.35 MB object-literal -> string.

## Scope

Off-scope opportunistic keep: 0 sync ms by construction (zero
references from `packages/reference-rs` or the pipeline; whole-sync
delta measured 0). Filed so the index grows onto MCP ground per the
zero-coverage protocol, not as a voyage yield. See VOYAGE scope
ruling: voyage ground is ref sync only.

## Proof

- Identity: 12/12 query batteries byte-identical across all diet arms
  vs baseline (3857 docs, 18 cats); production dist embeds
  `var icons_index_default = '{"documentCount":3857,...'` (string).
- Suites firsthand on the landing tree: icons-catalog 12/12 green;
  `tsc --noEmit` 0 errors; `tsup` 3/3 entries build.
- Race note: two crews filed this LAND independently with matching
  numbers (within 4%); first sound filing stands, second corroborates.

## Verdict

**LAND** (off-scope surface, captain sign-off): parse-once icons
index load. MCP import only; no sync() claim.
