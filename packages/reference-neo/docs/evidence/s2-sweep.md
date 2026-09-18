# S2 done-gate — N2 slices vs Panda v1 corners + absence disturbance

Oracle question (PLAN §10.1): do the N2-landed behaviors (RS-16/17/15/5/18/19
+ stations) hold against their Panda v1 corners, and did N2 disturb any
previously-absented area? Method: throwaway probes `/tmp/s2-sweep/s2{,b,c,d}.mjs`
against `packages/reference-rs/dist/atomic.mjs` `compileSync` (+ lib-system-spec).
No repo files touched but this one.

## 1. Verdict: S2 holds, with 3 named follow-ups

1. All six N2 stations replay exactly (K1/T1/S1/G1/D1/B1 below).
2. Panda corners hold: keyframe bare tokens (K4), twin lists (T1/T2/T4),
   arbitrary `&::placeholder`+sm (T3), supports nesting/sort (S1/S4/S5),
   hostless precedents (G2–G5), recipe shapes (D2/D5), bool forms (B2–B5).
3. GAP S2-F1: shorthand aliases not lowered in keyframes (`h` stays `h`, K2).
4. Doc S2-F2: `site/TESTS.md` RS-19 row still says `border` "lowers to
   nothing"; NEO-SITE-13 is now unblocked.
5. Note S2-F3: VALID-02 text says Null warns, but `color:null` drops silently.
6. No absence disturbed: A1/A3/A4/A5/A6 + M1/M2 all re-pin.

## 2. Per-slice probe table

| Slice | Panda corner | Holds/GAP (input→actual) |
|---|---|---|
| RS-16 refs | station `{ref}`+`r` (K1) | holds → `var(--colors-brand)`, `var(--spacing-root)`, `calc(4*…)`; zero diags |
| RS-16 refs | `generate-keyframes` bare `h:'4'` (K2/K4) | PARTIAL → token resolves `var(--sizes-4)` ✓ but `h` unlowered (GAP S2-F1); `height:'4'` full ✓ |
| RS-16 refs | unresolvable + rhythm (K3/K5) | holds → `{colors.nope}` verbatim, zero diags; `2r`→`calc(2*…)` |
| RS-17 twins | `preset-base` placeholder/file/checked (T1/T4) | holds → `::placeholder,[data-placeholder]`; `::file-selector-button` (no data twin); 4-member `:is()`; zero diags |
| RS-17 twins | `_placeholderShown`, arbitrary `&::placeholder`+sm (T2/T3) | holds → `:is(:placeholder-shown,…)`; `::placeholder` under `@container sm` |
| RS-15 supports | station nest (S1) | holds → `@supports`⊃`@container`⊃`:hover` rule; no `:@supports`; 1 want/plan |
| RS-15 supports | sibling sort + reversed nest (S4/S5/S3) | holds → flex<grid regardless of author order; reversed nest follows author order per GHOST-05 |
| RS-5 gating | station hostless `<Foo>` (G1) | holds → 1 error `missing primitive graph … <Foo>` @ `src/App.tsx:2:10` |
| RS-5 gating | styleless/known-graph/css-only/no-import (G2–G5) | holds → silent; Div extracts + Foo silent, zero diags; css-only extracts; no-import silent |
| RS-18 located | station refusals ×3 (D1) | holds → missing/dynamic/duplicate errors each with file:line:col; 1 recipe admitted |
| RS-18 located | spread/non-object (D2/D5) | holds → `must not contain spread properties` @ 3:49; `inline object literal` @ 2:25 |
| RS-18 located | token/dynamic warnings (D3/D4) | known-open DIAG-04 → `?:?:?` / file-only; not N2 scope |
| RS-19 macro | station bare+color (B1) | holds → `border-width:1px`+`border-style:solid`, 1 plan; `` `color` value `true`…`` warns, mints nothing |
| RS-19 macro | explicit/false, css() parity, null holes (B2–B4) | holds → `border={true}`+`css({border:true})` macro; `false` warns; null/undefined vanish; array-`false` silent (M1) |
| RS-19 macro | Panda `truncate:true` (B5) | holds as OUT → warns, mints nothing (CSS SPEC absence) |

## 3. Absence-disturbance check

| Pin | Probe → actual |
|---|---|
| COND-12 `_hovr` | A1 → warns `Unknown condition`, sibling emits |
| cva/sva/tagged-template | A3/A4 → zero classes, zero diags |
| computed keys/template values | A5 → both refuse with file-located warnings |
| `token()` fn, `ghost.white` | A6/D3 → raw passthrough + `unknown token path` warning |
| NEO-CSS-05 null/false/undefined | B4/M2 → emit nothing, no ghost class (warning outside its claim) |
| MERGE-03 array-`false` | M1 → silent, both margins emit |

No previously-absented area changed behavior. `_file` warning→lowering (T1)
is the intended RS-17 landing, not a disturbance.

## 4. Out of scope

- S1's RS-26/27/28 (globalCss numerics/braceless/breakpoint-keys): untouched
  by N2, not re-probed. Open DIAG-04/05/06 stay open. NEO-SITE-13 case
  creation is unblocked by the macro (S2-F2) but belongs to a case lane.
- Follow-ups: S2-F1 keyframe alias lowering (RS-16 tail or new row);
  S2-F2 refresh `site/TESTS.md` RS-19 block + open NEO-SITE-13;
  S2-F3 one-word VALID-02 pin (Bool warns / Null silent, B4).
