# Atomic cases

Each folder is one `compile()` station. The folder prefix is the canonical `SPEC.md` ID.
`spec.ts` exports that `id` only — strictly one folder, one case, one SPEC contract ID.
The engine takes `input/` and emits `output/{styles.css,css.json,diagnostics.json}`.

The executor adds standing gauges on every station (not extra case IDs):
the six-layer preamble (`ATM-LAYER-01`) and zero ghost classes (`ATM-GHOST-01`).

Folder name is `ATM-AREA-NN-slug`. Each folder links to exactly one SPEC ID. Agents add a
folder here, not a sibling `*.test.ts`. Remaining `[ ]` IDs live in
[`SPEC.md`](../../SPEC.md) as folders-not-yet.

| Id             | Folder                           | Contract                                      |
| :------------- | :------------------------------- | :-------------------------------------------- |
| `ATM-GHOST-02` | `ATM-GHOST-02-runtime-map`       | bijective runtime class-map key lookup        |
| `ATM-GHOST-03` | `ATM-GHOST-03-seed`              | empty compile, empty map, pure layer preamble |
| `ATM-SITE-01`  | `ATM-SITE-01-canon-primitives`   | StyleProps on canon primitives                |
| `ATM-SITE-02`  | `ATM-SITE-02-call-sites`         | `css()` call-site extract                     |
| `ATM-SITE-05`  | `ATM-SITE-05-spreads`            | inline and conditional object spreads         |
| `ATM-LEAF-01`  | `ATM-LEAF-01-ternaries`          | flat ternary literal arms                     |
| `ATM-LEAF-04`  | `ATM-LEAF-04-logical`            | `&&` / `\|\|` / `??` operands                 |
| `ATM-LEAF-05`  | `ATM-LEAF-05-responsive-arrays`  | `base` / `sm` / `md` breakpoint array slots   |
| `ATM-LEAF-07`  | `ATM-LEAF-07-dynamic-siblings`   | dynamic expression warnings & static siblings |
| `ATM-LEAF-08`  | `ATM-LEAF-08-panda-table`        | batch styling expression table                |
| `ATM-RHYTHM-05`| `ATM-RHYTHM-05-rhythm`           | negative rhythm unit lowering in CSS          |
| `ATM-SHORT-01` | `ATM-SHORT-01-shorthand-cascade` | borderBottom decomposition, no `currentColor` |
| `ATM-COND-04`  | `ATM-COND-04-pseudo-conditions`  | cumulative nested condition chain ordering    |

Goldens are the system’s outputs. `--update-goldens` rewrites them after a
real emission change.
