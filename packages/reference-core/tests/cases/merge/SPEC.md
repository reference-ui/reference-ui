# MERGE — last-wins, slots, ghosts

## 1. Purpose

This group proves what `css()` does when declarations collide: later wins
per cascade slot, the sheet keeps every atom, and values with no compiled
atom never mint ghost classes. Reference-rs cases prove strings and plan keys;
these cases prove paint (computed style) and the paints-nothing negative.

## 2. Dialect the author writes

`css(a, b)` multi-arg; `css([...])` as a merge list (never a responsive
array); alias vs longhand (`bg`/`background`, `flexDir`/`flexDirection`);
shorthand then longhand (`padding`/`paddingTop`, `borderBottom`/`borderColor`);
trailing-`!` important; conditional object args (`{ _hover: … }`) merged with
a base arg; `undefined`/`null`/`false` leaves dropped. Runtime-only values
(call results, strings with no static atom) are values: miss class plus
diagnostic — never guessed, never hashed.

## 3. Reference-rs cases leaned on

All confirmed present (`ls` + README read:

| Reference-rs case | Proves | Used by |
| --- | --- | --- |
| ATM-MERGE-01 | Both atoms in sheet; plan merge resolves last value | CORE-MERGE-01 |
| ATM-MERGE-02 | Alias/duplicate keys collapse to last per slot | CORE-MERGE-02 |
| ATM-MERGE-03 | `css([...])` is a merge list, `when: []`, no query wrap | CORE-MERGE-05 |
| ATM-SHORT-01 | `borderBottom` → width+style, never `currentColor` | CORE-MERGE-03/04 |
| ATM-SHORT-06 | Shorthand + longhand both emit, shorthand prints first | CORE-MERGE-03 |
| ATM-ORDER-04 | Shorthand-before-longhand print order, either authorship | CORE-MERGE-03 |
| ATM-LEAF-09 | `!` sets `important`, `!important` in declaration | CORE-MERGE-07 |
| ATM-GHOST-02 | Runtime class-map spellings match sheet selectors | CORE-MERGE-06 |
| ATM-LEAF-05/07/10 | `null` holes, dynamic-leaf keep, `!` spellings incl. quoted exclusion | CORE-MERGE-08 (slot `*`) |

Host: `src/runtime/css/plans.ts` (merge-only last-wins `mergeDeclarations` /
`mergeStylePlans`, unit-pinned with `css.ts` by `css.test.ts` / `eviction.test.ts`) and `css.ts`
(arg/condition lowering, miss →
miss class, constructed but unbacked). MERGE-06's one-dev-diagnostic and
MERGE-07's ` !important` spelling are host work, not engine gaps: no RS rows.

## 4. Decisions

- Dynamic values → diagnostic, no ghost class. MERGE-06 is
  its runtime proof; SITE proves the ternary/extraction half.

## 5. Approved absences

- Panda "more specific should always be last" (red-then-blue): same slot
  last-wins as MERGE-01; no separate case.
- Panda `mergeProps` deep-merge/`textStyle`-replace/`__proto__` (host
  plumbing): Core merges by cascade slot, not object spread; outcome covered
  by MERGE-01/02/05.
- `walkObject` arrays-as-leaves / max-depth (`boxShadow: [a, b]`): Panda
  normalizer internals; Reference arrays are responsive (RESP group).
- GHOST-04 namer injectivity (`p`/`padding` quarantine): stays an rs case
  not a browser case.

## 6. Out of scope (not Reference's dialect)

| Panda feature | Reason |
| --- | --- |
| `sort-mq` / `sort-css` / `sort-style-rules` / `sort-at-rule` comparators | Panda plugin sort; ORDER/SHORT cases pin print order |
| `hideFrom` / `hideBelow` | Panda-only utilities; no Reference helper (CSS group absence) |
| Custom utilities sharing one className | No custom utilities in Core |
| `token()` string helper | `{path}` refs only |
| Slot/`sva` merge | Out |
