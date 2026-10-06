---
name: agent-docs
description: Self-contained workflow for @reference-ui/reference-docs (the docs app: MDX content, app shell, build-time syntax highlighting) with its own strict Biome-based quality gate via pnpm agentdocs.
---

# Agent Docs

Docs agent. You work in `packages/reference-docs` (`@reference-ui/reference-docs`)
and nowhere else.

## 1. What Docs Is

The Reference UI documentation app: a thin Vite + React + TanStack Router shell
around MDX content, with docs-only theme tokens and build-time syntax
highlighting. Reference UI compiles its CSS at build time, so there is **no
client-side code playground** — examples render the real components and their
source is shown as a static, highlighted fenced block.

Read `DOCS.md` (stack + principles) and `STRUCTURE.md` (where things go) first.

## 2. The Loop

```bash
pnpm dev:docs                                              # serve :5174
pnpm agentdocs q                                           # quality gate (section 4)
pnpm agentdocs q src/app                                   # gate specific paths
pnpm --filter @reference-ui/reference-docs exec tsc --noEmit
pnpm --filter @reference-ui/reference-docs exec vite build
```

Content lives in `src/content/docs/**/*.mdx`; only `.mdx` is collected, so
frontmatter (`title`, `section`, `order`, `slug`) is the contract.

## 3. Scope Discipline

- Docs only. If a change implies `@reference-ui/lib` behavior, hand it to the
  `view-story` / `test-component` skills. Core/matrix goes to **test-core**
  (`pnpm agent`). Never edit those trees from here.
- Prefer content over architecture. If a helper serves one page, colocate it
  under `src/content`; do not invent a shared bucket.

## 4. Quality Gate

```bash
pnpm agentdocs q            # gate changed/default docs sources
pnpm agentdocs q [paths...] # gate specific files or dirs
```

Run the gate after every generation or modification step. It is structural
only — complexity, length, safety, suppressions, types. No formatting opinions.

- **Fail line (errors):** cognitive complexity **20**, `any` **banned**,
  correctness + suspicious Biome rules, file length **500**, and every
  `tsc --noEmit` error.
- **Warn line (loud, non-failing):** cognitive complexity **12**, file length
  **365**. Warnings shout; they do not block.
- **Suppressions are banned:** `biome-ignore`, `@ts-ignore`, and bare
  `@ts-expect-error` (justify on the same line with 10+ chars, or fix it).
  Redesign the code; never silence the analyzer.
- Uses the docs **OWN** Biome config (`tools/quality/biome.json`), not core's.
  It must stay fast (seconds).

Exit codes: `0` clean, `1` findings, `2` tooling missing.

## 5. Review Pass

After the gate is green, do the reading pass — a human reviewer's eye:

1. **Naming** — is this the best file/module name? Confusable with anything?
2. **No panda-isms** — the docs use `data-color-mode`, not panda names. Do not
   carry a retired name across verbatim.
3. **Beauty** — nothing too complicated or weird-looking. Prefer the plain
   composition over the clever one. If a component needs a paragraph to explain
   its layout, simplify the layout instead.

When the language evolves, update `DOCS.md` / `STRUCTURE.md` in the same pass.
