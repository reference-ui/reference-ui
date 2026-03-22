# Reference API Table Model

The API table model is deliberately small.

Each member is rendered as one row with exactly 3 columns:

- `memberName`
- `memberType`
- `memberSummary`

This is a data model for the reference table, not a UI component spec.

## Table Shape

The table should be able to express the kinds of member data `tasty` already
surfaces today.

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
| [new]                | constructor          | new (input: string) => Widget                 |
|                      |                      | Constructs a widget instance.                 |
+----------------------+----------------------+-----------------------------------------------+
| pair                 | tuple                | [name] [age]                                  |
|                      |                      | Named pair tuple.                             |
+----------------------+----------------------+-----------------------------------------------+
| config               | typeof               | typeof themeConfig                            |
|                      |                      | Theme config reference.                       |
+----------------------+----------------------+-----------------------------------------------+
| spacing              | indexed              | Theme['spacing']                              |
|                      |                      | Indexed access into the theme type.           |
+----------------------+----------------------+-----------------------------------------------+
| labels               | mapped               | { [K in keyof T as `token-${K}`]: T[K] }      |
|                      |                      | Label map derived from token keys.            |
+----------------------+----------------------+-----------------------------------------------+
| userish              | conditional          | T extends string ? User : never               |
|                      |                      | Conditional user mapping.                     |
+----------------------+----------------------+-----------------------------------------------+
| label                | template literal     | `size-${keyof Tokens}`                        |
|                      |                      | Template literal label.                       |
+----------------------+----------------------+-----------------------------------------------+
```

These examples are intentionally mixed:

- some rows use `valueSet`
- some use `callSignature`
- some use `typeExpression`
- some use an `opaqueType`-style fallback summary string

## Row Semantics

Each row is:

```text
ReferenceMemberRow
|- memberName
|- memberType
`- memberSummary
   |- memberTypeSummary?
   |- description?
   `- paramDocs?
```

Where:

- `memberName` is the declared member name.
- `memberType` is the primary semantic type label for the member.
- `memberSummary` is a structured summary column, not a blob of prose.

## Member Summary

`memberSummary` can contain up to 3 conceptual blocks, in this order:

1. `memberTypeSummary`
2. `description`
3. `paramDocs`

### 1. `memberTypeSummary`

This is the first semantic line in the summary column.

Its job is to summarize the member's type in the most useful compact form.

It is higher-level than raw type metadata.

It should be derived from the member type, but shaped for the API table model.

This should contain the full summary contract we want for TypeScript members.

In other words:

- `tasty` should give us enough structured type information to produce it
- `reference` should not need to reverse-engineer raw TypeScript shape in the component layer

`MemberTypeSummary` the React component can display many concrete cases, but
the model should stay semantic and discriminated.

The model should think about `memberTypeSummary` as:

```text
memberTypeSummary
|- kind
`- payload
```

#### `memberTypeSummary.kind`

The exact TypeScript shape can evolve, but conceptually the summary should cover
at least these cases:

- `callSignature`
- `valueSet`
- `typeExpression`
- `opaqueType`

#### `callSignature`

Use this when the most useful first-line summary is a callable form.

Examples:

```text
(event: MouseEvent) => void
new (input: string) => Widget
```

This should cover:

- function members
- call signatures
- constructor-like members

#### `valueSet`

Use this when the most useful first-line summary is an ordered set of concrete
or near-concrete value options.

Examples:

```text
[true] [false]
[sm] [md] [lg]
[0] [4] [8]
```

This should cover cases like:

- boolean
- literal unions
- enum-like unions
- tuple-like positional value summaries when that is the clearest compact view

#### `typeExpression`

Use this when the best compact summary is still a textual type expression, but
not specifically a callable signature or ordered value set.

Examples:

```text
string[]
Record<string, Token>
Theme['spacing']
A & B
T extends U ? X : Y
```

This should cover cases like:

- references
- arrays
- intersections
- indexed access
- mapped types
- conditional types
- template literal types when the literal values cannot be reduced to a compact value set

#### `opaqueType`

Use this when we have a usable summary string but not a richer structured form.

This is the "still displayable, not deeply modeled" bucket.

This is also a good boundary for a dedicated React subcomponent later:

- `MemberTypeSummary`

Examples:

```text
callSignature:
(event: MouseEvent) => void

valueSet:
[true] [false]
[sm] [md] [lg]
[0] [4] [8]

typeExpression:
Theme['spacing']

opaqueType:
SomeVeryComplexUtility<T>
```

### 2. `description`

This is the member's prose description.

Usually sourced from the member description / JSDoc description.

### 3. `paramDocs`

This is only present when the member is callable and parameter documentation
exists.

It sits at the bottom of the summary column.

## Naming Rule

Do not call the items in a `valueSet` "tags" in the model.

"Tag" is a rendering choice.

At the model level, better names are:

- `valueSet` for the whole first-line collection
- `valueOption` for each individual item inside it

That keeps the language semantic instead of visual.

## Ordering Rules

For `valueSet`:

- items are ordered
- if a default value exists, it comes first
- the default value is marked as default in the model
- rendering may choose to highlight it

So the model should think in terms of:

```text
valueSet
|- valueOption("sm", default=true)
|- valueOption("md")
`- valueOption("lg")
```

Not:

```text
tags
|- highlighted tag
`- normal tag
```

## Practical Split

This suggests a clean split between `tasty` and `reference`:

- `tasty` should derive semantic facts:
  - primary member type
  - callable signature
  - inline value options
  - default value
  - parameter docs
- `reference` should assemble those into the 3-column table row model

So:

- `tasty` answers: "what information is available from this type?"
- `reference` answers: "how does that information fit into the API table row?"

