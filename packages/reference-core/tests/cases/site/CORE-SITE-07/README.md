# CORE-SITE-07 — Cross-file `const` from `styles.ts` resolves

The world keeps its color value in a styles fixture and styles the node
from the app fixture through the imported `brand` binding. The spec asserts
the node paints cherry and the sheet carries exactly the one utility, so
a site value may live in another scanned file without losing its paint.

Evidence: ATM-SITE-16 (cross-file consts resolve; generated, dist, and module
dirs stay out of the scan); Panda v1 parser tests (spreading across files).

> Search terms: multi-file, separate file, module boundary, project scan, site/cross-file, CORE-SITE-02
