# WAVE2 — C2: cwd canon (`absWorkingDir` = neo package root)

STATUS: DONE (implementation + proof; 6-file delta classified; pins NOT edited
— captain re-baselines)

Bar (`GATES.md` C2): same entry under two cwds ⇒ identical bytes; `react.mjs`×3
+ maps×3 byte-identical (lever falsifier); 6-line pin delta banner-only
(captain re-baselines); evaluated-spec/manifest/CSS identical; suites + mcp
build green.

## Entries

- **C2 (crew: general, DeepSeek V4.1 Flash)** — `reports/WAVE2.C2.md`.
  **VERDICT: DONE.** `absWorkingDir` pinned to `NEO_PACKAGE_ROOT` (from
  `import.meta.url`) at the microbundle seam; config bundlers (neo + the
  vendored mcp copy) resolve metafile keys against that base. Proof:
  package-cwd vs repo-root dir-arg documented syncs **byte-identical** (1258
  files, 0 diff; harness form matches); `react.mjs`×3 + maps×3 **identical**
  pre/post; delta vs frozen pins is exactly **6 files**, every changed line a
  banner (baseSystem banners 288/280/8; types 47×3), banner-normalized equal,
  non-fragment JSON fields equal, all other 1252 pinned bytes identical; neo C2
  suites 98/98 + `agentneo q` 0 errors (24 pre-existing warnings); mcp `tsup`
  build green + mcp vitest 90/90 + child build on lib OK. 8 files touched (incl.
  the vendored mcp R3 copy and the drift-doc canon statement). Pins untouched.
