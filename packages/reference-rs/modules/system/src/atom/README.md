# Atom

The unit of this compiler is an **atomic utility**, not a hashed rule-set.

Authors write StyleProps. They never write class names. That is authoring.
Compile still emits `.mt_2r` + `.bg_n300`, because **runtime has to map
an open style object onto CSS that already exists**.

```text
build:   every literal want in the program  →  AtomSet  (what's possible)
runtime: this element's (prop, value)*      →  concat those class names
```

That split is the product. `css({ ...base, mt: on ? '2r' : '4r' })` works
because `.mt_2r` and `.mt_4r` were emitted as independent keys. The merged
object never had to appear in source as one blob.

## Want → Atom → AtomSet

**Want** — one authored declaration, still messy.

```text
Want
  prop:   borderColor | borderBottom | bg | mt | …
  value:  n300 | 3px solid | 2r | …
  when:   [] | [_hover] | [_dark] | [breakpoint]
  origin: Tabs.Tab | Box | css() in Card.tsx   // diagnostics, not identity
```

Extract inserts wants. Both branches of a ternary are two wants. Do not
eval `isSelected`. `undefined` is no insert.

**Atom** — a want after resolve: one CSS declaration, one class name.

```text
Atom
  prop, value, when
  css:    margin-top: calc(2 * var(--spacing-root))
  class:  mt_2r
```

**AtomSet** — HashSet by `(prop, value, when)`. Ten `Box`es with `mt="2r"`
share one utility. Origin is a trace, not the cache key.

```tsx
<Div mt="2r" bg={isSelected ? 'n300' : 'n100'} />
```

Three atoms: `mt_2r`, `bg_n300`, `bg_n100`. Runtime concatenates the
subset this render needs. No 2^n rule table.

## Why not hashed classes

The other grain — build-time hashed CSS-in-JS — names **the whole object**:

```text
hash({ mt: '2r', bg: 'n300' }) → .Box_a3f2 { margin-top…; background… }
```

Build can only emit hashes for objects it saw (or every combination of
ternary branches at a site). Runtime `css()` **composes**:

- `{ ...base, ...override }`
- `<Div {...styleProps} />`
- `bg={color}` where `color` is a prop
- lib StyleProps filled by the app

Each of those is a **new tuple**. If that tuple was not compiled, you
get a ghost class — or you inject CSS at runtime, or you evaluate the
author's module graph to close the object, or you take over the bundler
and **rewrite every call site to a static class**, which still cannot
name a tuple the compiler never saw.

We already compile user source (Vite / Webpack plugin, matrix). That is
necessary for **both** grains: atoms also have to find the leaves. It
does not make hashed mapping work. Taking over the bundler harder does
not enumerate objects `css()` will merge after render.

Atomic is the lookup that matches the API:

| | Build | Runtime |
| :--- | :--- | :--- |
| Atomic | `(prop, value, when)` that’s possible | concat what this instance needs |
| Hashed | whole style objects that appeared | need that exact object, or a VM |

Recipes (`cva` / `sva`) are the exception: the variant set is **closed**,
so they can be one class in `@layer recipes`. StyleProps on a recipe
host are still atoms. Do not hash the host’s StyleProps into the recipe
name — that reopens composition.

## The ergonomic cost

Atoms are not prettier CSS. They fight shorthand cascade
(`STYLE_ERRORS_REPORT.md`: `border-bottom` vs `border-color` as two
classes). DevTools is a soup. HTML class lists are long. Gzip eats
repeated declarations either way.

We pay that because StyleProps + `css()` are an **open** map, not a
closed `styled.div`. Fix cascade **inside** `resolve/shorthands` (longhands that
don’t reset color; one namer for sheet and `css()`). Do not “fix” it by
hashing the pair — runtime would then need that pair as a key.

## Panda

`vendor/panda/crates/pandacss_encoder/src/lib.rs` — `Atom { prop, value,
conditions }`, `process_atomic`, `FxHashSet` dedup. That record **is**
our IR. Their input is `Literal` from the evaluator; ours is a `Want`
from leaves. Same output grain.

## Must not

- Hash a StyleProp object and call that the runtime key.
- Evaluate user JS to learn which tuple this render meant.
- Model ternaries as typed unions.
- Pretend recipes’ closed set licenses hashing StyleProps.

## Files (when coded)

- `mod.rs` — `Want`, `Atom`, `AtomSet`
- `key.rs` — `(prop, value, when)` identity
