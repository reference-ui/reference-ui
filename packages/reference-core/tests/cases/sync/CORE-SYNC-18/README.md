# CORE-SYNC-18 — a sync root spelled with a doubled slash paints the include's class, as the plain path does

The world declares `include: ['theme/**']` with `css({ color: 'red' })` in a theme fixture. The runner
syncs it through the plain path before serving (`"sync": true`), and the spec reads that stylesheet as a
control. The spec then calls `sync()` on the same world spelled with `//` before its last segment, and
asserts that exactly one `core-sync18__c_red` lands in the stylesheet. The same directory must sync the
same way whichever spelling the caller passes.

> Search terms: doubled slash, root spelling, path normalization, sync entry, include matched no files, include scope, CORE-SYNC-09
