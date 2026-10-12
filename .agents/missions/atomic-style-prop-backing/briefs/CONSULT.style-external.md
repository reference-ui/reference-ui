# CONSULT.style-external — owner decision: consumer style props on external components MUST work

Reply with `STATUS: DONE` (or `STATUS: REFUSED`) as your first line.

## The decision (this overrides prior rulings — treat it as fixed)

The owner has decided: **it is one system.** A consumer must be able to style an
external (prebuilt) component with style props, and it must always work. This
**supersedes F3** of `reports/CONSULT.oracle.md` ("cross-system wants do not
exist; no repair") and the **BAN** recommendation of `reports/PLAN.oracle.md`.
Do not re-litigate whether it should be allowed. The requirements are:

1. **A named style prop always works** — `<BoltIcon color="diagramRedText" />`
   must paint, exactly as it would on a host primitive.
2. **The outermost element is stylable** — `<Field padding="4r" />`,
   `<Dialog marginTop="2r" />`: a consumer styles the component's root element,
   not just leaf parts.
3. **Override** — a consumer-provided value wins over the package's own default.
4. This is an **ergonomics** requirement, not a nice-to-have.

## The question (answer these; this is a feasibility study, not a redesign)

1. **Is it a simple change, a moderate one, or a re-architecture?** Be concrete.
   If it can be a small change, name the single smallest change that satisfies
   the decision.
2. **Which approach, and what is the concrete change surface** (crates / files),
   with a rough effort and risk.
3. **How does it satisfy all four requirements above** — especially #2
   (outermost element) and #3 (override)?

## What we already know (evidence — open the code, do not trust this summary)

- Each package binds its **own** runtime and mints its **own** scope:
  `reference-icons/dist/createIcon.mjs:3`;
  `reference-lib/scripts/materialize-runtime.mjs:34` rewrites `dist/index.mjs`.
- `Want` carries **no target-system** field
  (`packages/reference-rs/modules/atomic/src/atom/want.rs:14`); the runtime
  qualifies every class with the minting system
  (`packages/reference-rs/modules/atomic/js/namer/index.ts:37`, `css.ts:271`).
- Class strings are **globally deterministic** (`<system>__<stem>`), which is
  why the consumer could in principle mint the *same* string.
- The component shell is a `ref-div` whose global default
  `ref-div { color: var(--colors-design-text-base) }` defeats inheritance and the
  icon's own layered `c_inherit`; a **later-layer class on the element wins**
  (measured). So a consumer value must land **on the element** (or a later layer),
  not merely on a parent.
- Prior objections to cross-system values (from F3 / PLAN.oracle): token
  ownership under a foreign scope, cross-consumer collision, namer table parity,
  sheet composition and the T16 owned-prefix / icons-count gates. Address how the
  chosen approach answers each.

## Approaches to cost (open them; add any others you find)

1. **Target-system wants** — a JSX style prop on a known component compiles into
   that component's system scope (class string already deterministic).
2. **One namespace** — drop per-package class prefixes so consumer and packages
   mint identical classes (matches the owner's "it's all one system" framing).
   What breaks (frozen CSS text, layer composition, cross-consumer collisions)?
3. **Consumer re-mint** — the consumer emits the package's class string into its
   own sheet so the frozen rule is not needed.
4. **Multi-system runtime / shared tables** — one runtime, per-system tables.
5. **Component-side passthrough** — route consumer style props through inline
   style or a dedicated API (note: inline style cannot resolve a foreign token).

## Deliverable

- **Feasibility verdict + difficulty rating** (simple flag vs re-architecture),
  with the single smallest satisfying change if one exists.
- Concrete change surface (crates/files) + rough effort + risk.
- How each of the four requirements is met.
- The conformity test that pins it (matrix `T17`: consumer passes a novel token
  value to a prebuilt component + styles its outermost element + overrides a
  default; asserts paint, override, zero `no compiled class`).
- Findings in the skill format (ID, severity, file:line, evidence,
  recommendation, validation gap) and a verdict line. Do not edit product code.
