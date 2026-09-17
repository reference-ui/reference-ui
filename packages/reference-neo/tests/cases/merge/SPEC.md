# MERGE — last-wins, slots, ghosts

## 1. Purpose

This group proves what `css()` does when declarations collide: later wins
per cascade slot, the sheet keeps every atom, and values with no compiled
atom never mint ghost classes. Engine stations prove strings and plan keys;
these cases prove paint (computed style) and the absent-class negative.

## 2. Dialect the author writes

`css(a, b)` multi-arg; `css([...])` as a merge list (never a responsive
array); alias vs longhand (`bg`/`background`, `flexDir`/`flexDirection`);
shorthand then longhand (`padding`/`paddingTop`, `borderBottom`/`borderColor`);
trailing-`!` important; conditional object args (`{ _hover: … }`) merged with
a base arg; `undefined`/`null`/`false` leaves dropped. Runtime-only values
(call results, strings with no static atom) are D11 values: diagnostic, no
class — never guessed, never hashed.

## 3. Engine stations leaned on

All confirmed present (`ls` + README read 2026-09-17):

| Station | Proves | Used by |
| --- | --- | --- |
| ATM-MERGE-01 | Both atoms in sheet; plan merge resolves last value | NEO-MERGE-01 |
| ATM-MERGE-02 | Alias/duplicate keys collapse to last per slot | NEO-MERGE-02 |
| ATM-MERGE-03 | `css([...])` is a merge list, `when: []`, no query wrap | NEO-MERGE-05 |
| ATM-SHORT-01 | `borderBottom` → width+style, never `currentColor` | NEO-MERGE-03/04 |
| ATM-SHORT-06 | Shorthand + longhand both emit, shorthand prints first | NEO-MERGE-03 |
| ATM-ORDER-04 | Shorthand-before-longhand print order, either authorship | NEO-MERGE-03 |
| ATM-LEAF-09 | `!` sets `important`, `!important` in declaration | NEO-MERGE-07 |
| ATM-GHOST-02 | Runtime class-map spellings match sheet selectors | NEO-MERGE-06 |
| ATM-LEAF-05/07/10 | `null` holes, dynamic-leaf keep, `!` spellings incl. quoted exclusion | NEO-MERGE-08 (slot `*`) |

Host: `src/runtime/css/plans.ts` (slot index + last-wins `mergeDeclarations`,
unit-pinned by `plans.test.ts`) and `css.ts` (arg/condition lowering, miss →
nothing). MERGE-06's one-dev-diagnostic and MERGE-07's ` !important` spelling
are host R2 work, not engine gaps: no RS rows.

## 4. Decisions

- **D11** (taken): dynamic values → diagnostic, no ghost class. MERGE-06 is
  its runtime proof; SITE proves the ternary/extraction half.

## 5. Approved absences

- Panda "more specific should always be last" (red-then-blue): same slot
  last-wins as MERGE-01; no separate case.
- Panda `mergeProps` deep-merge/`textStyle`-replace/`__proto__` (host
  plumbing): Neo merges by cascade slot, not object spread; outcome covered
  by MERGE-01/02/05.
- `walkObject` arrays-as-leaves / max-depth (`boxShadow: [a, b]`): Panda
  normalizer internals; Reference arrays are responsive (RESP group).
- GHOST-04 namer injectivity (`p`/`padding` quarantine): stays an rs station
  per `atomic-claims.md` §6; not a browser case.

## 6. Out of scope (not Reference's dialect)

| Panda feature | Reason |
| --- | --- |
| `sort-mq` / `sort-css` / `sort-style-rules` / `sort-at-rule` comparators | Panda plugin sort; ORDER/SHORT stations pin print order |
| `hideFrom` / `hideBelow` | Panda-only utilities; no Reference helper (CSS group absence) |
| Custom utilities sharing one className | No custom utilities in Neo |
| `token()` string helper | `{path}` refs only (D15) |
| Slot/`sva` merge | Out per D9 |
