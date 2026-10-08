# NEO-SITE-05 — A local function named `css` is not a site

The world styles its node through a file-local function named `css` with
no Reference import anywhere. The spec asserts the node keeps its default
text color, the sheet carries zero utilities, and sync still succeeds —
import identity decides what extracts, never the callee name.

Evidence: `[atm]` ATM-SITE-10 (shadowed parameters and local helpers named
`css` do not extract; the live Reference import still does); contrast
`[panda-v1]`
`vendor/panda-v1/packages/parser/__tests__/css-2.test.ts:5` (Panda's
`cssParser` extracts even the unimported call).

> Search terms: name collision, false positive, negative case, impostor, site/import-identity, NEO-SITE-04
