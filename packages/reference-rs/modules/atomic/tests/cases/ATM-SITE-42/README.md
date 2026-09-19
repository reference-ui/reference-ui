# ATM-SITE-42

Destructuring declarations bound to const values (SPEC-V2-32, Overmatch
Ph3). Object and array patterns bind the entries they select — shorthand,
rename, rest, indices, defaults, and computed keys — so uses resolve
exactly like the member or index they abbreviate. Unresolvable sources
stay dynamic with a diagnostic while static siblings still extract.

Numbering note: §1 files this entry (SPEC-V2-32) under `ATM-SITE-35`
while §5 and this station use `ATM-SITE-42` — and §1 also assigns
`ATM-SITE-42` to SPEC-V2-55 (imported conditional). No `ATM-SITE-35`
exists on disk. The mission catalog is HQ-owned; this station keeps
the landed `ATM-SITE-42` name until HQ deconflicts the catalog.

Panda: `scope.rs:547` (object), `:567` (rename), `:587` (rest), `:629`
(index), `polish.rs:269` (defaults).
