# Refactoring Components Into Art

Behavior-preserving restructures of `@reference-ui/lib` components: the same
tested slop, reorganized until it looks production-ready. Overlay's folder
anatomy is the exemplar; this doc is the taste floor. Judgment above the
floor is yours — if a split makes the code clearer, do it; if it only
satisfies a number, don't.

## 1. Goal and non-goals

- **Goal:** small files, named parts, flat composition. A reader opens any
  file and understands it in one screen.
- **Behavior-preserving, always.** Every colocated Vitest and every CT spec
  that passed before must pass after. Proof, not promises (§6).
- **Non-goals:** no public API changes, no behavior changes, no style
  changes, no new dependencies, no touching `matrix/`,
  `packages/reference-core`, or snapshot baselines. If a refactor requires
  any of those, stop and report — it is not a refactor.

## 2. Folder anatomy

Every component follows the Overlay shape: the root holds exactly four
files, and every other concern gets its own module folder. No loose
helpers at root — `toastQueue.ts` sitting next to the root is the slop;
`state/queue.ts` is the art.

```
<Component>/
  index.ts          — re-exports only, zero logic
  types.ts          — public prop/state types, no JSX, no logic
  <Component>.tsx   — root composition only
  context.ts        — private subtree scoping (the Law 3 allowance)
  parts/            — one file per public part
  hooks/            — one use-*.ts per hook: data/handlers/refs, no JSX
  store.ts          — Zustand substrate (or state/ when large)
  shared/           — refs, events, ids, warn
  <domain>/         — the component's own subdomains, Overlay-style:
                      geometry/, isolation/, stack/, dismiss/, …
  fixtures/ + __e2e__/ + *.md — exempt (tests and prose, not the art)
```

Domain folders take their names from the component's problem, not from
patterns — `geometry/` because Overlay does geometry. Avoid `utils/`
and `helpers/`; they're junk-drawer names. If it's shared and nameless
it goes in `shared/`; if it's named, it gets its own folder.

READMEs nest, building to the bigger picture — literally: Memex's
`graph` collection indexes every file-top header and every `README.md`,
and `show <path>` prints a file's header plus each ancestor README to
the repo root. Write for that walk:

- every **source file** opens with a header comment (`/** … */`): 2–6
  sentences on what it does, takes, and emits, naming its symbols and
  behavior so `search --in graph` finds it. Explain why, not what.
- every **folder** carries a `README.md` stating what the module is
  trying to achieve — its purpose, its idea, how it composes with its
  siblings. Never a directory table of filenames and per-file blurbs:
  Memex already exposes the file inventory through the graph. (The
  agent-rs gate enforces this same rule as its README 9.)
- every **component root** carries a `README.md` that weaves the folder
  READMEs into the architecture story: how the submodules compose into
  the whole. (The existing `<Component>.md` is the API spec; the README
  is the map.)

A reader — human or `show <path>` — zooms out from any file to the
full picture without ever hitting an undocumented layer.

## 3. File rules

- **One component per file.** The root file holds only the root plus
  compound assignment (`Overlay.Content = …`).
- **Aim for ~90 lines per React component.** This is a target with
  judgment, not a tripwire: it counts the component, so pushing types
  into `types.ts` and logic into `hooks/` is the intended move, not a
  trick. A 100-line component with a clear single idea beats two
  50-line components named `Thing` and `ThingInner`.
- **365 lines per file is the tripwire.** It exists only to stop
  runaway generation, not to define art. Never approach it on purpose.
- **Hooks return data, handlers, and refs.** A hook that returns JSX
  is a component wearing a costume — move it to `parts/`.

### The real work: submodules with proof

JSX is rarely the problem — logic density is. The exhibit is
`RovingFocus.tsx`: 781 lines holding roving tabindex state, arrow
navigation, text search, repair targets, slot prop merging, and ref /
event chaining in one file. Each of those is a submodule waiting for a
name.

The rule: a cohesive logic cluster becomes an **isolated module** — its
own file in a domain folder, its own folder when it grows — with
**colocated unit tests proving it in isolation**. No browser, no
component mount: pure functions, state machines, and matchers tested
through their own exports. Isolated means it imports only `shared/` and
siblings. `RovingFocus/grid.ts` + `grid.test.ts` is the pattern already
working in situ; `typeahead.ts` shipping without a test is the gap.
Every extraction either carries its tests with it or gets new ones —
untested submodules are just smaller monoliths.

## 4. Nesting: two deep, then it gets a name

A general rule, lightly held: JSX reads best at most **two layers
beneath the root element**. Our JSX is rarely the problem (Calendar
excepted) — treat depth past two as a smell, not a crime, and reach
for §3 before reaching for the knife.

Depth is the symptom; missing composition is the disease. When a
component runs too deep, look first for behaviors that want composable
homes (effects → hooks, named branches → parts) — not for places to
slice the tree to hit the number. §5 shows the difference.

- **Depth is measured on the true rendered tree**, resolving local
  `const x = <…>` intermediates. Named intermediate steps (`content` /
  `locked` / `presentable`) are good style, but they don't buy depth.
- **Depth resets at component boundaries.** A custom child element is
  a leaf where it is used; its own file owns its own depth.
- **Pipeline carve-out:** a straight chain of single-child behavior
  wrappers (`Portal`, `Presence`, `FocusLock`, …) may run to three —
  a pipeline reads linearly, top to bottom. Anything that *branches*
  (siblings, ternaries, `.map()`) past layer two is asking for a name.
- **Anti-theater clause:** if you can't give the extracted part a real
  name, you're splitting wrong — restructure instead of inventing
  `ContentInner` / `PositionedWrapper`.

## 5. Worked example

Refactor toward composition, not toward the number. `OverlayContent`
renders a `Portal > Presence > FocusLock > Div` pipeline — three deep,
but a straight pipeline of wrappers, so the carve-out permits it as is.
Slicing the inner two layers into a `ContentBody` just to hit depth two
would be theater: the name means nothing in Overlay's domain, and the
conditionals choosing each wrapper would scatter across files.

The real seams are the independent behaviors stacked inside the
component. One is a 30-line effect implementing Tab cycling for
`isolation.focus === false` — and `parts/tab-cycle.ts` already owns the
helpers, with its README pointing at them. That effect wants to be a
hook:

```tsx
// BEFORE — parts/Content.tsx: a 30-line keydown effect inline (trimmed)
React.useEffect(() => {
  if (!context || isolation?.focus || !isOpen || !node) return
  const trigger = context.triggerRef.current
  …
  doc.addEventListener('keydown', onKeyDown)
  return () => doc.removeEventListener('keydown', onKeyDown)
}, [context, isolation?.focus, isOpen, node])
```

```tsx
// AFTER — parts/tab-cycle.ts: the behavior, named and testable
export function useTabCycle({ context, node, isOpen, focusIsolated }) {
  React.useEffect(() => { …same logic… }, […])
}

// AFTER — parts/Content.tsx: the behavior, composed
useTabCycle({ context, node, isOpen, focusIsolated: isolation?.focus })
```

The ref plumbing, the layer-node registration effect, and the
child-shard subscription are the same shape of seam. Each becomes a
hook, and `Content.tsx` shrinks into what it should be: hooks composed
at the top, the conditional wrapper pipeline at the bottom. The file
gets smaller because behaviors found homes — not because the tree got
sliced.

## 6. Verification loop

The refactor lands only when all three hold:

1. `pnpm agentct <Component>` — colocated unit plus CT green on
   React 19, same cases as before the refactor.
2. Videos and settled snapshots inspected per the `test-component`
   skill: no motion change, no paint drift. A red snapshot is a
   regression until the human says otherwise.
3. Never `--update-snapshots` without explicit human approval
   (`test-component` § Updating snapshots). Style refactors don't
   change pixels; if pixels changed, behavior changed.

After overlay / presence / event / mount-adjacent moves, also run
`--e2e --react all`. Run `pnpm --dir packages/reference-lib sync`
first if anything style-adjacent was touched.

## 7. Crew assignment

One component per crew; crews run in parallel through the `agentct`
daemon queue. Dispatch with this block:

```markdown
Refactor `<COMPONENT>` for `@reference-ui/lib` per this doc.

Assigned Component: `packages/reference-lib/src/components/<COMPONENT>/`
Taste floor: `packages/reference-lib/src/components/refactor_components.md`
Exemplar anatomy: `packages/reference-lib/src/components/Overlay/`
Exemplar refactor: `packages/reference-lib/src/components/Tooltip/` (after the pilot lands)
Proof harness: `test-component` skill (`pnpm agentct <COMPONENT>`)

Land only when §6 holds. Report: files created/removed, submodules
extracted + their tests, README coverage (file headers / folders /
root), deepest nesting before/after, largest component before/after,
proof output.
```

## 8. Order

Tooltip is the pilot: land it first so every later crew has a living
exemplar of the finished shape, not just this doc. Then fan out
across the remaining components in any order — refactors are
behavior-preserving, so manufacturing tiers don't apply.
