# NAMER — the runtime namer spells what the compiler namer spelled

## 1. Purpose

This group proves the two namers are one algorithm: the runtime namer
(`css()` time, JavaScript) constructs exactly the slot and className
lists the compiler namer (compile time, Rust) wrote into the plans, for
every authored declaration the compiler named. The compiler namer is
the oracle; the differential gate holds the mirror equal to it. Misses
— requests the compiler never saw — construct a miss class that paints
nothing and warns once in browser dev; they are never ghosts, which
stay forbidden on the compiler side.

## 2. Dialect the author writes

`css()` over holes, responsive arrays, per-prop objects, `_hover`, `md`,
trailing-`!`, and the macros (`font`, `size`, `border`, radius pairs,
`flex: '1'`); dynamic values with no compiled atom. The runtime namer
reads the namer tables plus its procedures; it never consults the sheet
and never looks up a per-atom row.

## 3. Engine stations leaned on

| Station | Proves | Used by |
| --- | --- | --- |
| ATM-SEAM-06 | The shipped artifact carries no per-atom row; the namer tables are present | NEO-NAMER-01 |
| ATM-SEAM-07 | Artifact bytes are independent of atom count | NEO-NAMER-01 |
| ATM-SEAM-08 | The runtime namer reproduces every namer golden | NEO-NAMER-01 |
| ATM-NAME-08 | The class stem passes only through explicit lexical functions | NEO-NAMER-01/02 |

Host: the runtime namer (`@reference-ui/rust/namer`) behind `css()`, the
rules-version check in `registerRuntimeData`, and the browser-dev miss
diagnostic. NAMER-02's class lists equal the pre-cutover plan-derived
golden; NAMER-03's miss contract is host R2 work, not an engine gap.

## 4. Decisions

- **Miss shape (taken):** a miss constructs its miss class, paints the
  inherited value, and reports exactly one browser-dev diagnostic naming
  prop and value. Node stays silent: there is no sheet to probe outside
  the browser, and production stays silent everywhere.
- **Rules version (taken):** the tables and the runtime namer carry the
  same version integer; `registerRuntimeData` refuses a skewed pair
  loudly instead of painting wrong.

## 5. Approved absences

- Token, rhythm, and wrap recomputation in the runtime namer: the class
  carries authored spellings and paths, so bodies stay compiler-side.
- A node-side miss catalog: refused by the miss-shape decision above.
- GHOST-04 namer injectivity: stays an rs station; both sides
  canonicalize first, so it is orthogonal to the mirror.

## 6. Out of scope (not this group's dialect)

| Feature | Reason |
| --- | --- |
| Sheet-size budgets and the harvest census | Sheet questions, not naming questions |
| Recipe tables and variant resolution | Recipes ship their own tables, untouched |
| `data-color-mode` and theme switching | TOKEN/COND groups own the mode axis |
