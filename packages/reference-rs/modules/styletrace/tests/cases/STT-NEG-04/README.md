# STT-NEG-04 — An unparsable file reached from several places warns STT-W-SKIPPED-FILE exactly once

`broken.tsx` is unparsable. It is discovered as an entry, and `index.tsx` also imports it (`Wrapped` forwards its props into it).
Card traces, Wrapped does not, and the trace yields one `STT-W-SKIPPED-FILE` warning for `broken.tsx`, however many edges reach it.
Claim STT-24 (one skip warning per unparsable file, siblings still trace). Compile-seam sibling: `STT-NEG-02`.

> Search terms: parse failure, duplicate warning, skip, one warning per file
