# CORE-REF-03 — reference render contract

Ports all 18 reference-contract browser tests as specs against a `?name=` world shell that mirrors
the matrix consumer page. Each spec opens its symbol and asserts the oracle strings against the normalized
page text; multi-page oracle tests keep their navigations inside one spec file. The world carries the full
oracle fixture corpus, and the importmap wires the generated bundles plus a local `react/jsx-runtime` shim.

> Search terms: render contract, reference-contract, browser page, alias pages, JSDoc browser, inherited sections, origin labels, CORE-REF-02, CORE-REF-05

## Oracle mapping

Specs 01 and 03 through 17 follow the oracle order (tests 1, 3-18); spec 18 carries oracle test 2
(the `StyleProps` page) last. The harness aborts a case at the first failing spec, so spec 18 runs after the seventeen provable ones — a holdover from blocker D-OPEN-1 (RESOLVED, see CORE-REF-02); 26/26 green.

## Port rules

- Readiness anchors are document-only (kind labels, members, definitions, error text), never the symbol
  name: the shell renders the name before the document loads, so name anchors return the loading page.
- Element-exact oracle matchers become text-level matchers on whitespace-normalized page text (`includes`
  for presence, `!includes` for substring absences), except exact counts, which read an innermost-whole-text
  frequency map — the tag pill holding an icon plus its label still counts as one exact `param`, matching
  the oracle's five.
- Deep inherited members assert after expanding the collapsed sections: member order follows the generated
  decls, which differ between the retired reference-core and core, so the port couples to membership rather than declaration order.
- Two oracle member names substitute for the documented generator inventory delta: `accentColor` stands in
  for `WebkitAppearance` (specs 02 and 18), which the core styled generator never emits — the projection
  mechanism is the parity, not the vendor list.
- Spec 08 asserts extends membership order-insensitively by D-OPEN-2: the tasty compiler id-sorts extends
  (`collect_reference_descriptors`), and the ids are root-sensitive hashes, so the multi-extends
  line order differs between the retired reference-core and core regimes by compiler design. Clause-order preservation is a
  reference-rs fix on closed ground; the case pins the line plus both parents.
