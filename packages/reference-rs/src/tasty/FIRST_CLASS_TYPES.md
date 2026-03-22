# Types as first-class citizens (roadmap)

This note is about a simple goal: **when Tasty sees a TypeScript type, it should
expose something useful through its API**.

That does **not** mean pretending every type is an `interface`, and it does
**not** mean implementing all of TypeScript. It means:

- preserve the real type graph faithfully
- follow aliases, references, and constructed types as far as we reasonably can
- expose the **most useful explainable semantic surface** we can
- degrade honestly when a shape is too dynamic or too deep to flatten

In practice, that especially matters for **type aliases and constructed types**
(`Omit<…>`, intersections, mapped types, re-exports, recursive helpers, etc.),
because they often carry the same user-facing semantic shape as interfaces, but
today they frequently degrade into weak or misleading output.

It complements the main [`README.md`](./README.md) (lowering, scan boundary). It
is intentionally **aspirational**: full TypeScript semantics are out of scope;
**bounded, explainable usefulness** is the target.

---

## Why this matters

TypeScript APIs are often defined through **chains of aliases, utilities,
intersections, re-exports, and recursive helpers**, not clean standalone
interfaces.

So the problem is bigger than “support `type` aliases better.” The real problem
is:

> how do we expose arbitrary TS type shapes in a way downstream tools can
> actually use?

In that world, **`type` aliases are not a weaker `interface`**. They often carry
the same *usable surface* as interfaces:

- aliases to object types, intersections, and utility instantiations (`Omit`, `Pick`, …)
- re-exports from packages (`export type { Foo } from 'pkg'`)
- conditional and mapped types that *behave* like fixed property bags for consumers

Downstream (e.g. `@reference-ui/reference-core` and `@reference-ui/reference-lib`)
can only build useful experiences if Tasty’s **emitted graph** exposes enough
structure. The job is not only to support `interface`, but to support
**whatever type shape the user API is actually made of**.

---

## Current model (short)

| Concept | In Tasty today |
| --- | --- |
| **Interfaces** | `SymbolShell` with `defined_members`, `extends`, stable ids; runtime exposes `getMembers()` for interface payloads. |
| **Type aliases** | `SymbolShell` with `kind: TypeAlias`, **`underlying` `TypeRef`**, usually **no** `defined_members` (members live on interfaces). |
| **Named type re-export** | `export type { Name } from 'module'` records an **export binding** to the canonical symbol instead of synthesizing a second local alias shell. This avoids duplicate-name pollution in the manifest while still exposing the real symbol through the barrel export surface. |

The JS runtime mirrors that: **`getMembers()` is interface-only** (`js/tasty/internal/wrappers.ts`). Type aliases are not treated as carrying a member list, even when the RHS is an object type.

---

## Where information is “dropped” (mental model)

This is **not** a single bug; it is **layered contracts**:

1. **Extraction**  
   A type alias’s **RHS** is lowered to `TypeRef` (`ast/extract/types/`, `type_references/`). Deep or opaque nodes may stay **abstract** in IR.

2. **Re-export surfaces**  
   The export surface may differ from the defining file. Tasty needs to preserve
   the **barrel/export path** without inventing duplicate local symbols or
   losing the **canonical target** behind that export.

3. **Resolution / instantiation**  
   Following `TypeRef::Reference` to a **loaded symbol**, and **instantiating** generics, is partial (`ast/resolve/`). Utility types like `Omit` are **not** guaranteed to expand to a flat property list in artifacts.

4. **Consumers**  
   Reference runtimes may **only attach effective members to interfaces** (see `reference-core` browser `Runtime.ts`). Even perfect `TypeRef` trees would not surface as “members” until **both** Tasty and consumers agree on a **type-alias member projection** story.

So: **Tasty** owns whether the **graph + `TypeRef`** is rich enough; **downstream** owns whether **UI** maps that to rows. Both need to move for “types = interfaces for docs.”

---

## What “first class” should mean

**Goal:** For any symbol or type shape that enters the graph, Tasty should make
it as useful as possible through a general-purpose semantic API.

For type aliases especially, that means Tasty should still enable:

1. **Identity** — stable id, name, library, export surface (already largely true).
2. **Readable definition** — `TypeRef` (or source-backed snippet) that **does not collapse** to a bare self-name when the real RHS is known elsewhere in the graph.
3. **Navigation** — `Reference` edges to **other symbols** (interfaces, type params, utility targets) where resolvable.
4. **Structured surface (when meaningful)** — for RHS shapes that are
   **object-like** for consumers, optionally expose something **member-shaped**:
   - either **resolved inline members** (best-effort),
   - or **explicit “expand / follow”** to an interface or alias symbol,
   - without pretending **full** TS assignability or conditional-type evaluation.

More generally, every type should land in one of these useful outcomes:

- **definition + links** — not flattenable, but still readable and navigable
- **object-like projection** — flattenable enough to expose members coherently
- **raw fallback** — preserved honestly when Tasty cannot safely claim more

**Non-goals:**

- Being a second `tsc` (full inference, all mapped-type evaluation, variance).
- Guaranteeing a flat property list for **every** alias (generics + deep conditionals will always have limits).

---

## Driving example: style props as one doc surface

The motivating case here is `ReferenceSystemStyleObject`.

In userland, this should ideally feel like **one interface-like set of style
props** even though the source is assembled from multiple layers:

- a **re-exported alias** from `@reference-ui/react`
- an **intersection**:
  `Omit<SystemStyleObject, 'font' | 'weight' | 'container' | 'r'> & ReferenceBoxPatternProps`
- more aliases inside `ReferenceBoxPatternProps`
- interfaces/property bags such as `SystemProperties`
- recursive helper aliases such as `Nested<P>`

For downstream consumers, the desired result is **not** “expose a maze of
internal type machinery.” The desired result is:

1. keep the original alias definition visible and linkable
2. derive a best-effort **object-like projected surface** for the props a user
   can actually write
3. prioritize the **final object** a user or tool actually interacts with

For the current intended consumers, that means the projected surface matters
more than the derivation story:

- docs tables care about the final rows
- MCP generation cares about the final object schema
- both mostly benefit from **effective fields**, not a full trace of how each
  field was derived

So provenance is a secondary concern. It may still be useful for debugging or
future advanced tooling, but it should not drive the primary API shape.

That implies an important contract distinction:

- the **canonical type graph** should preserve aliases, references, utilities,
  and recursion honestly
- a **derived projection API** may flatten that graph into one object-like view
  when the shape is bounded and explainable

In other words, `ReferenceSystemStyleObject` should stay a **type alias** in the
graph, but it may produce a **derived object-like member surface** through the
API.

### What the style-props projection likely needs

To make this case work, the projection layer probably only needs a bounded set
of operations:

- **follow alias references** to their canonical symbol
- **merge intersections** of object-like inputs
- **apply `Omit` / `Pick`-style key filters** when both the source members and
  filtered keys are knowable
- **inline interface and object-literal members**
- **preserve recursion boundaries** for helpers like `Nested<P>` instead of
  trying to infinitely expand them

For `SystemStyleObject = Omit<Nested<SystemProperties & CssVarProperties>, 'base'>`,
the practical docs goal is likely:

- expose the top-level style props from `SystemProperties` and `CssVarProperties`
- record that selector/condition nesting exists
- avoid infinitely expanding recursive selector branches

That is the shape of usefulness we want: **bounded for the implementation,
truthful to the underlying type graph, and rich enough for downstream tools to
present coherently**.

### Product priority

For now, the product priority should be:

1. **final projected object**
2. **canonical definition + links**
3. **derivation/provenance**, only where it helps correctness or debugging

That means Tasty should optimize first for returning a trustworthy final object
surface, not for narrating every transform that produced it.

---

## Implementation plan

This section turns the roadmap into a **recommended delivery order**. The key
idea is to land **identity + canonical definition** first, then improve
**presentation**, and only then attempt **member projection**.

### Phase 0: Lock the contract with tests

**Status:** in progress

Before changing behavior, add tests that describe the intended contract for
type aliases as semantic API objects.

**Ship in this phase:**

- extraction test for named `export type { T } from '...'` proving Tasty keeps a
  canonical export surface without synthesizing duplicate local alias shells
- resolve test proving local named type re-exports still point at the canonical
  source symbol
- resolve test proving local aliases with generic instantiations still preserve
  a readable `TypeRef` after resolution
- artifact/runtime test coverage for how alias definitions are emitted and read

**Why first:** right now the behavior is split across extraction, resolution,
emission, and runtime wrappers. A test-first pass prevents “fixing” one layer
while silently regressing another.

**Exit criteria:**

- failing tests exist for the specific alias behaviors we want to improve
- test names describe the user-facing contract, not just internal implementation

**Implemented so far:**

- extraction coverage now asserts that named `export type` re-exports do **not**
  synthesize duplicate local alias shells
- resolve coverage now asserts that local named type re-exports keep only the
  canonical source symbol in the resolved graph
- JS runtime coverage now includes a focused projection test for alias
  references, intersections, and `Omit`

### Phase 1: Canonicalize re-exported alias identity

**Status:** done for canonical export identity

Fix the highest-value failure first: named `export type { X } from '...'`
should point at the **real declaration** and should not create a second
competing local symbol when the canonical one already exists elsewhere in the
graph.

**Implementation target:**

- preserve the barrel/export surface through `export_bindings`
- point that export surface at the canonical source symbol id via existing
  import/export indexes
- avoid synthesizing duplicate local type-alias shells for named re-exports

**Likely touch points:**

- `ast/extract/module_bindings/exports.rs`
- `ast/resolve/index.rs`
- export/symbol index plumbing if the current resolver misses this case

**Success criteria:**

- the exported name still resolves through the barrel/module surface
- the canonical symbol id remains the single source of truth
- downstream consumers can follow the alias definition to the canonical symbol
  without special heuristics or duplicate-name disambiguation

**Implemented so far:**

- named type re-exports now rely on export bindings plus canonical source
  symbols instead of synthetic local alias shells
- this contract is pinned by unit tests instead of being incidental behavior

### Phase 2: Make alias definitions reliably readable

**Status:** partially in place, still open

Once alias identity is stable, improve the **definition surface**. The goal is
not full evaluation; it is a `TypeRef` tree that round-trips to useful API
output.

**Implementation target:**

- preserve structural children for composites such as intersections, unions,
  mapped types, indexed access, and utility-style references
- keep unresolved or unsupported semantics explicit via `Raw { summary }`
  instead of collapsing useful structure into opaque text
- avoid self-referential displays when a better underlying tree is already in
  the graph

**Likely touch points:**

- `ast/extract/types/`
- `ast/extract/type_references/`
- generator/emitted contract types if new shape is needed

**Success criteria:**

- `describe()`-style consumers can render alias definitions that are more useful
  than a bare symbol name
- references inside the alias RHS still preserve links where resolvable
- no new requirement is introduced to “evaluate TypeScript” beyond bounded
  structural lowering

### Phase 3: Add bounded alias member projection

**Status:** started in JS runtime prototype

Only after phases 1 and 2 are stable should Tasty attempt to surface
**member-like rows** for aliases whose RHS is object-like enough to project.

**Implementation target:**

- project members for clearly bounded shapes:
  object literals, intersections of object-like shapes, and selected utility
  instantiations where the source members are already known
- treat the result as a **derived object-like projection**, not as a claim that
  the alias literally is an interface in the IR
- optimize for the **final projected object** that downstream tools need
- return **no projection** for deep conditionals, unconstrained mapped types, or
  cases that would require open-ended evaluation

**Hard rule:** projection must be optional and bounded. If the system is unsure,
prefer “definition + links” over incorrect rows.

**Likely touch points:**

- `ast/resolve/`
- member emission code
- possibly a dedicated projection pass rather than overloading extraction

**Success criteria:**

- projected members are clearly marked as projected/derived in the contract
- projection never replaces or mutates the original alias definition
- unsupported shapes fail closed to `undefined` / no projection

**Implemented so far:**

- the JS graph API now has an initial `projectObjectLikeMembers()` helper
- current bounded support covers:
  interface flattening reuse, object-literal aliases, alias-following,
  intersections of projectable inputs, `Omit` / `Pick` with knowable key
  literals, generic alias instantiation, and recursive-boundary preservation for
  `Nested<P>`-style helpers
- a real style-props-shaped case now exists in the fixture suite
- projection metadata and richer emitted-contract support are still open, but
  are secondary to the final-object surface

### Phase 4: Align the JS runtime API

**Status:** started

After the Rust artifact contract settles, expose alias-first APIs in the JS
runtime so consumers do not have to infer semantics from raw payloads.

**Implementation target:**

- keep `getUnderlyingType()` as the primary alias-definition accessor
- add a dedicated alias-friendly surface for the **final projected object**
  (today this starts with projected members)
- keep `getMembers()` behavior explicit: either remain interface-only, or widen
  it deliberately with a documented projected-members story

**Likely touch points:**

- `packages/reference-rs/js/tasty/internal/wrappers.ts`
- `packages/reference-rs/js/tasty/api-types.ts`
- runtime graph helpers

**Success criteria:**

- consumers can render alias definition, links, and projected members through a
  stable API
- runtime behavior clearly distinguishes “declared members” from “projected
  alias members”

**Implemented so far:**

- `graph.projectObjectLikeMembers(symbol)` now exists as the first dedicated
  object-like projection API
- `getMembers()` remains interface-only, so declared members and derived
  projection stay distinct

### Focused next steps

The most useful next steps are:

1. add a more explicit **final projected object** runtime API on top of
   `projectObjectLikeMembers()`
2. pressure-test that API against more real style-prop and component-prop shapes
3. decide what minimal recursive-structure signal downstream tools need beyond
   flat members
4. leave provenance as an internal/debug concern unless a concrete consumer
   proves it needs to be public

### Phase 5: Adopt the contract downstream

Once the runtime exposes the right primitives, downstream tools can build
useful presentations on top of them.

**Implementation target:**

- show **definition + links** for every alias
- show **members** only when projection exists
- use interface-like presentation where helpful, but with honest fallbacks for
  non-projectable aliases

**Success criteria:**

- no alias page degrades to a meaningless self-name when the real definition is
  available
- aliases that are effectively object-shaped become explorable downstream
- non-object aliases still produce useful output without pretending to have
  interface semantics

### Recommended order

If this work is split across PRs, the safest sequence is:

1. **tests + phase 1**
2. **phase 2**
3. **phase 4** for stable runtime accessors
4. **phase 3** once the definition contract is proven
5. **phase 5** in downstream consumers

This order deliberately puts **projection after definition**. If we reverse it,
we risk inventing member rows on top of weak alias identity and unreadable RHS
trees.

### Explicit deferrals

These are important to keep the project bounded:

- no attempt to implement full TypeScript conditional or mapped-type evaluation
- no guarantee that every alias can produce projected members
- no requirement that named re-exports synthesize duplicate local symbols if the
  canonical export binding is sufficient
- no downstream promise that aliases and interfaces are literally the same
  internal thing; the goal is parity of usefulness, not false equivalence

---

## Related files (starting points)

| Area | Path |
| --- | --- |
| Type alias shells (real AST) | `ast/extract/symbols/type_alias.rs` |
| Synthetic `export type { … } from` | `ast/extract/module_bindings/reexport_type_alias.rs` |
| IR | `model.rs`, `ast/model.rs` |
| Lowering | `ast/extract/types/`, `ast/extract/type_references/` |
| Resolve / instantiate | `ast/resolve/resolver/` |
| JS symbol wrapper | `packages/reference-rs/js/tasty/internal/wrappers.ts` |

---

## Summary

Today, **interfaces** carry **members**; **type aliases** carry **`TypeRef` RHS** with **partial** resolution. Named re-exports now resolve through the **canonical source symbol** instead of synthetic duplicate shells. Making Tasty **useful** for modern TS APIs means **treating type aliases as first-class semantic API objects**, not only **name entries**: **resolve** them to **canonical** definitions, **preserve** composite structure in **`TypeRef`**, and **optionally project** object-like RHS into **member-shaped** output—within **clear, bounded** rules.
