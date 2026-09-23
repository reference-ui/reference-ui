# Reference Browser

How the reference API table turns tasty type data into rendered docs.
The model answers "how does that information fit into the API table
row?"; tasty answers "what information is available from this type?"

## Architecture

Truth flows one way: lib source → explicit mirror tool → gitignored
mirror → types-bundle leg → generated `@reference-ui/types` →
consumer. Never reverse; never hand-edit the mirror.

- **Model** (`src/reference/browser-model/`, neo-owned): shapes
  tasty symbols into serializable `ReferenceDocument` values. UI-free.
- **Runtime** (`src/reference/browser/`, neo-owned): loads symbol
  graphs through the tasty browser runtime, exposes the provider,
  hooks, and shell factory. No presentation imports.
- **Adapter** (`browser/component-api.ts`, seam S2): the narrow
  `@reference-ui/types` contract the mirror consumes — provider,
  context hook, default runtime, type-parameter formatter, types.
- **Presentation** (generated mirror of lib's Reference
  component): renders documents. Owned by lib; mirrored explicitly.
- **Entry** (Crew C, seam S3): composes runtime + presentation
  into the shipped `Reference` singleton and bundles `types.mjs`.
- **tasty** (reference-rs, below the cut): owns AST/IR access and
  emits structured type data plus evaluated reductions.

## API Table Model

Each member renders as one row with exactly 3 columns:
`memberName`, `memberType`, `memberSummary`. This is a data model
for the reference table, not a UI component spec.

```text
+----------------------+----------------------+-----------------------------------------------+
| memberName           | memberType           | memberSummary                                 |
+----------------------+----------------------+-----------------------------------------------+
| disabled             | boolean              | [true] [false]                                |
|                      |                      | Plain comment fallback.                       |
+----------------------+----------------------+-----------------------------------------------+
| size                 | string               | [sm] [lg]                                     |
|                      |                      | Preferred size variant.                       |
+----------------------+----------------------+-----------------------------------------------+
| onClick              | function             | (event: MouseEvent) => void                   |
|                      |                      | Fired when the control is activated.          |
|                      |                      | Params:                                       |
|                      |                      | - event: MouseEvent                           |
+----------------------+----------------------+-----------------------------------------------+
```

Rows mix `valueSet`, `callSignature`, `typeExpression`, and
`opaqueType`-style summaries. Each row is:

```text
ReferenceMemberRow
|- memberName            (declared member name)
|- memberType            (primary semantic type label)
`- memberSummary         (structured summary column)
   |- memberTypeSummary? (first semantic line)
   |- description?       (prose, usually JSDoc)
   `- paramDocs?         (callables with parameter docs only)
```

`memberTypeSummary` is a discriminated union over four cases:

- `callSignature` — the most useful first line is a callable
  form: `(event: MouseEvent) => void`, `new (input: string) =>
  Widget`. Covers functions, call signatures, constructors.
- `valueSet` — an ordered set of concrete or near-concrete value
  options: `[true] [false]`, `[sm] [md] [lg]`. Covers booleans,
  literal unions, enum-like unions. A default value sorts first
  and is marked default in the model.
- `typeExpression` — a textual type expression that is neither
  callable nor a value set: `string[]`, `Theme['spacing']`,
  `T extends U ? X : Y`. Covers references, arrays,
  intersections, indexed access, mapped and conditional types.
- `opaqueType` — a usable summary string with no richer
  structured form. The "still displayable, not deeply modeled"
  bucket.

Naming rule: value-set items are `valueOption`s in the model,
never "tags" — tag is a rendering choice.

## What Works Now

The model preserves and renders most of the tasty type graph:
references, literals, objects, unions, tuples, arrays,
intersections, indexed access, mapped types, conditionals,
`typeof`, template literals, and raw fallbacks. Member summaries
prefer structured expressions over opaque semantic-kind labels;
indexed access formats as `DocsReferenceButtonState['intent']`;
tuples render with labels; local-alias reduction resolves
`DocsReferenceButtonProps['currentIntent']` to
`'primary' | 'danger'`. Inherited member origins track per-row
(`from PressableProps`); generic parameters show constraints and
defaults in document headers; JSDoc renders beyond `@param`
(`@returns`, `@deprecated`, `@see`, `@example`, `@remarks`).

## Current Boundary

Some outputs are polished as far as neo can take them with the
data tasty emits today.

Neo-side wins (improve here): declared and intermediate type
expression rendering, structured type preservation, member
summary quality, JSDoc display, richer inherited-member,
intersection, discriminated-union, and generic presentation.

Tasty-dependent wins (need richer emitted data, not more
formatting): evaluated template-literal unions from imported or
generic-backed unions, conditional/mapped expansion over
imported or unresolved generic inputs, selective utility-type
evaluation, deeper merged previews for intersections and
utility-expanded object aliases.

Next implementation order: mapped-type expansion where the
key/value space evaluates honestly; intersection rendering and
safe merged previews; richer discriminated-union rendering;
richer generics beyond concrete local instantiation; selected
utility types (`Pick`, `Omit`, `Partial`, `Required`,
`Readonly`, maybe `Record`); overload rendering if target
libraries need it.

## Testing Strategy

Every new resolution pass follows the same loop:

1. add a focused fixture to the `NEO-REF` case group
2. add a browser-level spec against visible text in the real
   `Reference` component
3. improve the model until the output is useful
4. if the desired output cannot be produced honestly, document
   the gap and push the requirement down to tasty

This keeps the docs surface grounded in real UI output rather
than model-only unit tests. Ship criteria: no major scenario
regresses to opaque placeholders, visible output stays useful
when full evaluation is unavailable, cases lock in both
supported resolutions and known boundaries, and roadmap gaps
stay explicit so future work is additive.
