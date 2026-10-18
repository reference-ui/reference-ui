# CORE-SITE-04 — Import alias `css as c` and namespace `ui.css` are sites

The world styles one node through an aliased `css` import and another
through a namespace `ui.css` call. The spec asserts both nodes paint their
own color and the sheet carries exactly the two utilities, so binding shape
never decides what extracts.

Evidence: ATM-SITE-15 (namespace imports and compiler-internal aliases extract;
type-only and default imports do not); Panda v1 parser tests (import alias `css
as nCss` extracts) and namespace tests (`panda.css` extracts).

> Search terms: rename, star-import, dotted call, namespaced call, css alias, site/import-binding, CORE-SITE-05
