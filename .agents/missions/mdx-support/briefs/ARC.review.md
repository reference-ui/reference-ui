# Oracle arc review — ARC.review (mission `mdx-support`)

STATUS: PENDING

PIN: commit `601b72f41` ("feat(neo): bundle and discover .mdx fragments"),
branch `openchamber/mdx-support`. Base for the mission was `a1afefbb0`; the
Phase 1 dependency commit is `30e3a3ae3`.

## Objective of the arc

Land the first version of native MDX support in Neo sync: `.mdx` files become
fragment sources. This arc is the loader (Phase 2) and the MDX-scoped scanner
(Phase 3); the proving case (`NEO-MDX-01`, Phase 4) is untracked in the live
workspace and is *not* part of this pin — review the seam, not the case.

## Changed files at the pin

- `src/collect/constants.ts` — `FRAGMENT_EXTENSIONS += 'mdx'`.
- `src/collect/lib/scan/patterns.ts` (new) — `DiscoveryPattern`, `escapeRegex`,
  `toArray`, `createImportPatterns` (**byte-frozen**), `createFunctionPatterns`.
- `src/collect/lib/scan/mdx.ts` (new) — `stripMdxNoise`,
  `createMdxImportPatterns`.
- `src/collect/lib/scan/scanner.ts` — re-exports the patterns; `splitScan`
  gains an optional `mdxPatterns` (stays sync); `matchesCandidate` branches on
  `extname(candidate) === '.mdx'`.
- `src/collect/lib/scan/native.ts` — passes `createMdxImportPatterns(...)` into
  the hit-confirm `splitScan`.
- `src/lib/microbundle/plugins/mdx.ts` (new) — the `.mdx` esbuild loader.
- `src/lib/microbundle/plugins/index.ts` — registers `mdxPlugin()`
  unconditionally.
- `src/lib/microbundle/plugins/react-stub.ts` — filter widened to
  `@mdx-js/react`; exports `useMDXComponents`/`MDXProvider`.
- Tests: `scan/mdx.test.ts`, `plugins/mdx.test.ts`, `identity.test.ts` (comment),
  `build-options.test.ts` (plugin roster).

## Prior verification (captain)

- `vitest run src/collect/lib/scan/` → 9 files / 48 tests green, including the
  native differential battery and the four-scale goldens.
- `vitest run src/lib/microbundle/` → 5 files / 19 tests green.
- Full neo vitest: 582/585; the 3 failures (`bin/ref.test.ts`,
  `sync/clean-repro.test.ts`, `sync/lib-barrel-negation.test.ts`) reproduce at
  base HEAD — pre-existing/environmental, unrelated.
- `pnpm agentneo q` → 0 errors, 25 warnings (accepted: `splitScan` params 5;
  scanner.ts 381 lines, 16 over the warn line).
- `NEO-MDX-01` passes after; fails before with
  `ATM-E-UNKNOWN-TOKEN: unknown token reference {fonts.display}`.

## What to review

Architecture and system fit, hidden assumptions, robustness and test adequacy,
and the seams: the two-matcher split in `splitScan`/`native.ts`, the frozen
global pattern vs the MDX-scoped one, the unconditional plugin + react-stub
route, and whether moving `createImportPatterns` into `patterns.ts` preserved
selection byte-for-byte. Attempt counterexamples (fence/frontmatter edge cases,
BOM, CRLF, multiline imports, side-effect imports, prose false-hits,
`export … from` divergence, a `.mdx` with no mdxPatterns, native hit
confirmation). Read the live files at the pin before concluding.

Reply with `STATUS: DONE` (or `STATUS: REFUSED`) as the first line, then:
verdict, findings with stable IDs + severity + file/line + evidence +
recommendation + validation gap, and whether the arc may proceed to Phase 4
and merge.
