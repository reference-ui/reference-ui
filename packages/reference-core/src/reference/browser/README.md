# Reference Browser Roadmap

This package is the browser-facing bridge between `tasty` and the reference API
table UI.

`tasty` owns TypeScript AST/IR access and should expose structured, ergonomic
type data. The browser model in `reference-core` should preserve as much of that
data as possible, then shape it into a useful docs surface without inventing
facts that are not present in the IR.

## Current Direction

The immediate goal is to make the reference browser feel like a real modern
TypeScript API browser:

- preserve richer type structure in the browser model instead of flattening to
  ad-hoc strings
- render useful declared and intermediate type expressions instead of opaque
  placeholders like `mapped`, `conditional`, or `[tuple]`
- keep the split honest:
  - `reference-core` improves presentation and modeling of data already emitted
  - `tasty` unlocks deeper evaluation when the final type depends on value-level
    information

## What Works Now

The browser model now preserves and renders more of the `tasty` type graph:

- richer `ReferenceType` coverage for references, literals, objects, unions,
  tuples, arrays, intersections, indexed access, mapped types, conditionals,
  `typeof`, template literals, and raw fallbacks
- improved member summaries that prefer structured type expressions over opaque
  semantic-kind labels
- cleaner indexed access formatting such as
  `DocsReferenceButtonState['intent']`
- tuple rendering such as `[inline: number, block: number]`
- mapped and conditional type passthrough such as
  `{ [K in DocsReferenceButtonVariant as \`tone-\${K}\`]: K }` and
  `T extends 'solid' ? ... : ...`
- object literal previews when the shape is directly available in the type IR
- broader JSDoc rendering, including non-`@param` tags like `@returns`,
  `@deprecated`, `@see`, `@example`, and `@remarks`
- browser-level tests in `reference-unit` that mount the real React
  `Reference` component and assert on visible output

## Current Boundary

Some outputs are now polished as far as `reference-core` can take them with the
data currently emitted by `tasty`.

### `reference-core` wins

These should continue to improve inside this package:

- rendering declared and intermediate type expressions clearly
- preserving structured type nodes in the browser model
- member summary quality
- JSDoc display quality
- inherited member presentation and origin labels
- intersection, object-shape, and discriminated-union rendering
- generic parameter display, constraints, and defaults

### `tasty`-dependent wins

These require richer emitted data rather than more formatting in the browser:

- `keyof typeof intents` -> `'primary' | 'danger'`
- `(typeof intents)[keyof typeof intents]` -> resolved literal union
- `typeof sizes[number]` -> `'sm' | 'md' | 'lg'`
- `typeof docsReferenceTheme.spacing` -> object member preview derived from the
  backing value
- evaluated template-literal unions such as
  `` `tone-${DocsReferenceButtonVariant}` `` -> `'tone-solid' | 'tone-ghost' | 'tone-outline'`
- selective utility-type evaluation where the reduced result is materially more
  useful than the declared form

For example:

- `DocsReferenceCurrentIntent` can currently resolve to
  `keyof typeof docsReferenceTheme.intents`
- `DocsReferenceButtonSpacing` can currently resolve to
  `typeof docsReferenceTheme.spacing`

Those are useful intermediate forms, but the final literal/object expansions are
not available unless `tasty` carries enough value-derived information to compute
them honestly.

## Next Implementation Order

This is the recommended sequence for the next passes:

1. inherited members and origin tracking
2. object-derived union/value resolution:
   `keyof typeof ...`, `(typeof obj)[keyof typeof obj]`, `typeof arr[number]`
3. template literal evaluation
4. intersection rendering and safe merged previews
5. discriminated union rendering
6. generic display improvements
7. selected utility types:
   `Pick`, `Omit`, `Partial`, `Required`, `Readonly`, maybe `Record`
8. overload rendering if target libraries need it

## Testing Strategy

Every new resolution pass should follow the same loop:

1. add a focused fixture in `reference-unit`
2. add a browser-level test against visible text in the real `Reference`
   component
3. improve the browser model until the output is useful
4. if the desired output cannot be produced honestly, document the gap and push
   the requirement down to `tasty`

This keeps the docs surface grounded in real UI output rather than model-only
unit tests.

## Ship Criteria

The browser layer is ready to ship when:

- no major scenarios regress to opaque placeholder labels
- the visible output is useful even when full evaluation is unavailable
- tests lock in both supported resolutions and known current boundaries
- roadmap gaps are explicit so future work is additive rather than accidental
