# CONSULT.generalize — is "consumer style-prop value not compiled into the component's scope" a general class?

Reply with `STATUS: DONE` (or `STATUS: REFUSED`) as your first line.

## Context

A sibling consult (`CONSULT.oracle`) is deciding the specific case: an icon
(`@reference-ui/icons` `createIcon` → an `IconShell` = `Div` alias) receives a
static literal style prop from a consumer (`<BoltIcon color="diagramRedText" />`)
and the runtime `css()` class lands in the `reference-icons__` system scope with
no backing rule — so the prop paints nothing and the dev probe warns.

## Question (one question, blast radius)

Is that a **general class** — *a static style-prop value written by a consumer
at a JSX call site is not compiled into the called component's own system scope* —
and **where else does it apply**? Enumerate the affected surfaces and how far it
reaches. Do not re-decide the icon case; assume the sibling ruling and generalise.

Surfaces to open and judge (argue from code):

1. `@reference-ui/icons`: `createIcon.tsx` forwards `color` (StyleProp) but
   applies `size` via inline `style`. Which icon style props are dead vs alive?
2. `@reference-ui/lib` (24 components): do their parts forward consumer style
   props (color, bg, padding, …) to a host primitive through runtime `css()`?
   If a consumer passes a token not otherwise compiled, does it miss? Open real
   parts, not the summary.
3. Any `forwardRef` shell / `Div as …` alias / `ReferencePartProps` part that
   forwards style props — the `matrix/fixtures/aliased-host-library` shape.
4. Whether `jsxElements` config or `staticCss` can close the gap per-consumer,
   and whether that is even possible when the component ships as a **prebuilt
   package** (its scope is frozen at package build).

## Why the current conformity test does not catch it

`matrix/tests/chain/T16` pins the icon shape ("the `createIcon` shape in
miniature") but its consumer passes **no** style-prop values —
`matrix/tests/chain/T16/src/index.tsx` renders `<CheckIcon data-testid=… />` and
`<CheckBadge data-testid=… />`. Only the shell's own literal defaults
(`d_inline-flex`, `ai_center`, `c_inherit`) are exercised, and those are compiled
from inside the package. The contract (zero `no compiled class`, every class
backed) therefore passes while a consumer-supplied value misses. Confirm this
reading by opening the fixture and the spec.

## Return

1. A verdict on whether it is one general class or several distinct classes,
   with the precise boundary (what is affected, what is not, and why).
2. For each affected surface: how a consumer-supplied value fails, with code.
3. The **conformity test(s)** that would pin the class — name the venue(s)
   (`matrix/tests/chain/*`, `packages/reference-rs/modules/atomic`, neo cases)
   and describe the assertion shape: a consumer passing a token style-prop value
   to a prebuilt component must paint that value and emit zero miss warnings.
4. Findings in the skill format (ID, severity, file:line, evidence,
   recommendation, validation gap) and a verdict line. Do not edit product code.
