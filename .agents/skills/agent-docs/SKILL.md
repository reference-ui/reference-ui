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

On a fresh checkout run `pnpm bootstrap` from the repository root before the
gate: its type tier checks against lib's build output and the docs' synced
`@reference-ui/*` packages. `pnpm --filter @reference-ui/reference-docs run sync`
refreshes the synced packages on their own.

Content lives in `src/content/docs/**/*.mdx`; only `.mdx` is collected, so
frontmatter (`title`, `section`, `order`, `slug`) is the contract.

**Writing a page:** use the `technical-writing` skill (user-level, at
`~/.claude/skills/technical-writing/`). Read its `SKILL.md`, pick the
page's document type from `references/document-types.md`, follow
`references/structure-principles.md` and `references/sentence-style.md`,
and review the draft against `references/review-rubric.md` before landing.
Never invent API behaviour: mark a gap `TODO` and report it.

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

**Diagrams** use the kit in `src/components/diagram/` and follow its README.
Two owner rulings: a diagram sits flush with the content, with no background
box around it, and it is gray in different tones, with a hue only when the
colour carries meaning.

## 6. Writing From the Corpus

Docs prose starts from the docs corpus: production design-system docs
(Panda, Radix, Chakra, Mantine, shadcn and ten more), normalized and searchable
through Memex. It is already built in `vendor/docs/` (gitignored); rebuild it
with `bash .agents/docs-corpus/clone.sh`, then
`node .agents/docs-corpus/normalize/normalize.mjs` (see
`.agents/docs-corpus/README.md`).

> [!IMPORTANT]
> **Check the corpus on every edit, however small.** A new section, a
> reworded intro, a renamed heading, a split page: search the corpus first,
> every time. Your report names the corpus pages each change follows (for
> example `panda:recipes/atomic-recipe`). A change with no named source isn't
> done.

```bash
memex search semantic tokens --in docs-corpus                      # every library's take
memex search recipes source:panda --in docs-corpus                 # one library
memex show docs-corpus:panda:theming/tokens#semantic-tokens        # read a section
```

1. Search the key terms and read three or four libraries' versions.
2. Take the pattern they share: page shape, sentence shape, how much they say.
3. Fill it with facts from our code. Never carry over their API or behaviour.
4. Every sentence has a source: a corpus pattern plus a fact from our code.
   Rewrite or cut a sentence that has neither.

Panda is the structure model, since it is the closest system, but ours is
simpler: skip Panda concepts we don't have (user-defined patterns, utilities,
presets). The corpus is for reference only: never paste long passages from it.
Don't rewrite the owner-reviewed pages either: `getting-started/initialize`,
`guides/theming`, `guides/library-components` and
`components/reference-library`.
