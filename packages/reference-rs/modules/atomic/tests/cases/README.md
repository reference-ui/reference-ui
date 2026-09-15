# Atomic cases

Each folder is one `compile()` station keyed by an `ATM-*` id from
[`SPEC.md`](../../SPEC.md). The engine takes `input/` and emits
`output/{styles.css,css.json,diagnostics.json}`. Specs assert wants and
case-local invariants. The executor adds standing gauges on every station:
the six-layer preamble (`ATM-LAYER-01`) and zero ghost classes (`ATM-GHOST-01`).

Folder name is `ATM-AREA-NN-slug`. `spec.ts` must export that id. Extra ids
the station also proves live on `spec.ids`. `README.md` is the station card.
Agents add a folder here, not a sibling `*.test.ts`.

| Id              | Station                                                                                    |
| :-------------- | :----------------------------------------------------------------------------------------- |
| `ATM-GHOST-03`  | seed — empty compile, empty class map. Also `ATM-LAYER-01`, `ATM-LAYER-02`, `ATM-DIAG-01`. |
| `ATM-LEAF-01`   | ternaries — both arms; omit `undefined`. Also `ATM-LEAF-02`, `ATM-LEAF-03`.                |
| `ATM-LEAF-04`   | logical — `&&` / `\|\|` / `??`.                                                            |
| `ATM-LEAF-05`   | responsive arrays — `base` / `sm` / `md`.                                                  |
| `ATM-SITE-05`   | spreads — inline and conditional object spreads.                                           |
| `ATM-SITE-02`   | call sites — `css`, `cva`, `sva`. Also `ATM-SITE-03`, `ATM-SITE-04`.                       |
| `ATM-LEAF-07`   | dynamic siblings — diagnose, keep neighbours. Also `ATM-DIAG-02`.                          |
| `ATM-COND-04`   | pseudo conditions — nested `_hover` / `_dark` / `_focusVisible`.                           |
| `ATM-SHORT-01`  | shorthand cascade — no `currentColor`. Also `ATM-SHORT-02`.                                |
| `ATM-RHYTHM-05` | rhythm — `1r` / `2r` / `0.5r` / `1/3r` / negatives. Also `ATM-RHYTHM-03`.                  |
| `ATM-GHOST-02`  | runtime map — `(prop,value,when)` bijection.                                               |
| `ATM-LEAF-08`   | panda table — absorbed extract one-liners.                                                 |
| `ATM-SITE-01`   | canon primitives — dictionary seam.                                                        |

Goldens are the system’s outputs. `--update-goldens` rewrites them after a
real emission change. Remaining `[ ]` ids in SPEC stay folders-not-yet.
