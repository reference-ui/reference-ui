# CORE-SITE — extraction shapes through Core

Proves the extract boundary end to end: which call sites and JSX shapes become utilities in a synced world, and which fail closed with a diagnostic and no ghost class. The engine decides what is a site; Core proves the decision paints — or provably paints nothing — in a browser. Host surface is small: the config types carry `include` (what gets scanned) and `jsxElements` (which tag names are hosts). The group spec carries the site contract; the cases below are the ledger.

Proof policy: a re-probe comes first — residual gaps file a fresh RS row, never reopen RS-14.

> Search terms: call sites, extraction shapes, ghost class, fail closed, host elements, jsxElements, css identity, re-export identity, binding walk
