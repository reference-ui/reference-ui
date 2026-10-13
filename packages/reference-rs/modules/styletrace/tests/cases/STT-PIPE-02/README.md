# STT-PIPE-02 — Only entry-discovered modules emit names: entries that forward into a package wrapper trace under their own names, and the package export itself is not traced

Only entry-discovered modules emit names: two entries forwarding into a package wrapper trace under their own names while the package export stays an edge target.
Twin: ATM-SCAN-02 (include-scoped entries at the compile seam). Sibling: `STT-WRAP-04` (re-exported package names do emit).

> Search terms: entry set, edge target, node_modules, discovery
