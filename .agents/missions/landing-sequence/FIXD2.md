# FIX-D2 — objective log

IN PROGRESS

Scope: NumberField FF double-publish re-entrancy fix (F1/F3/F4/F5) +
scope F2/F6/F7 (caret/focus per-engine). Verdict: DIAG.md D2.
Fix direction: clear `draftRef` synchronously in `runCommit`
(mirror `onReset:2028`) and/or guard `onSubmit:1996`.
Box: 60 min. Files: NumberField dir only. Crew writes below.
