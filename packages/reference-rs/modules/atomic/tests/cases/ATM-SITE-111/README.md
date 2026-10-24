# ATM-SITE-111 — A member read through an import, a same-file copy and an exporting-file copy gives the same CSS and the same tag verdict

`origin.ts` exports `O = { c: 'red' }` and `NS = { Panel: Div }`; `middle.ts`
copies them (`Q = O`, `T = NS`). Three files read the member both ways,
`css({ color: X.c })` and `<X.Panel p="4r" />`: `direct.tsx` imports the
origin, `samefile.tsx` copies the imports (`const P = O`, `const S = NS`) and
reads the copies, `exported.tsx` imports the middle file's copies.

A copy made in the exporting file strips the object's member refs, and a copy
made in the importing file keeps them (it answers through the import itself).
Neither shows in the output: member refs are read only for a same-file const
object literal, so an import or a copy never qualifies, and the three files
mint the same wants (the color atom and the tag's `p` atom, no diagnostics) and
share the same two classes. Sibling: ATM-SITE-88 (a same-file member root).

> Search terms: member ref, const copy, same-file copy, exporting-file copy, object literal, member tag, parity
