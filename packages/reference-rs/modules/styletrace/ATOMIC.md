# Atomic compile: empty host graph

Styletrace is the authority for “which JSX names still carry StyleProps.”
Atomic already calls `trace_style_jsx_names` when `compile()` has a
`root_dir`. That call is not enough for hermetic stations or a virtual
`files:` request. Primitive identity lives on the **synced** declaration
surface, and most atomic proof trees do not have one.

This is the leftover from overnight `ATM-SITE-08`. The station is ticked
as an honest subset (file-local `@reference-ui/react` imports). It does
not prove that styletrace listed `Div` from generated primitives.

## What styletrace needs

`trace_style_jsx_names(root)` resolves a **sync root**, then:

1. Expands public `StyleProps` from
   `.reference-ui/react/types/public/style-props.d.ts`
2. Reads primitive JSX names from
   `.reference-ui/react/system/primitives/index.d.mts` (or `.d.ts`)
3. Walks the app graph and returns exported wrappers whose style props
   still reach those primitives (or `css` / `box` / `splitCssProps`)

If the primitive file is missing, `collect_reference_primitive_jsx_names`
returns an **empty set** (not an error). Wrapper tracing then has nothing
to connect to, so the name list is empty even when the source literally
writes `<Div mt="2r" />`.

Sync-root search will accept a project root that only has `package.json`
/ `ui.config.ts` (`resolves_project_root_without_generated_sync_output`).
That is enough to *start*. It is not enough to *know* `Div`.

`trace_style_jsx_names_with_hint` exists so a caller can point at a real
`.reference-ui/` tree. Atomic `compile()` does not pass a hint.

## What atomic does instead

| Compile input | Styletrace | JSX extract |
| :--- | :--- | :--- |
| `files:` only (Vitest virtual sources, most Cargo tests) | Never called (`root_dir` absent) | Host set = file-local Reference component imports |
| `root_dir` without synced primitives | Called; usually `[]` | Same as empty host set |
| `root_dir` plus `.reference-ui/react` primitives | Called; `Div` / wrappers listed | Gate on that set ∪ imports |

`ExtractContext::allows_jsx_tag`: if the host set is **empty**, every
opening tag is scanned (the pre-gate fallback). That keeps `ATM-SITE-01`
green (`<Div>` with no import). It also means an untraced `<Foo mt="2r" />`
extracts until *some* host is known.

Once any host is known (import or traced name), other tags are skipped.
`ATM-SITE-08` uses that second mode. Atomic is compensating for a missing
primitive graph by treating `@reference-ui/react` imports as hosts — the
package styletrace *would* consult if the sync tree existed.

Errors from `trace_style_jsx_names` are swallowed (`Err(_) => HashSet::new()`),
which is the same empty-host path.

## What would close it

Do not invent a PascalCase registry in styletrace or atomic. The missing
piece is a **hermetic sync-root fixture** atomic can point at:

- A tiny `.reference-ui/react/system/primitives/index.d.mts` that
  `declare const Div` / `Button` / …
- `compile()` taking a sync-root hint (or `REFERENCE_STYLETRACE_SYNC_ROOT`)
  so stations and `files:` compiles can use it
- After that, drop the empty-host “scan everything” fallback, or keep it
  only for `ATM-GHOST-03`-style empty projects with no JSX

Until then, production `ref sync` apps with a real `.reference-ui/` are
the only place styletrace can list primitives. Atomic stations cannot.
