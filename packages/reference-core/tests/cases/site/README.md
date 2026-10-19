# CORE-SITE — extraction shapes through Core

Proves the extract boundary end to end: which call sites and JSX shapes become utilities in a synced world, and which fail closed with a diagnostic and no ghost class. The engine decides what is a site; Core proves the decision paints — or provably paints nothing — in a browser. Host surface is small: `src/config/types.ts` carries `include` (what gets scanned) and `jsxElements` (which tag names are hosts). `SPEC.md` carries the site contract; `TESTS.md` is the case ledger.

> Search terms: call sites, extraction shapes, ghost class, fail closed, host elements, jsxElements, css identity, re-export identity, binding walk

Parent: [tests/cases/](../README.md).
