# Types as first-class citizens (roadmap)

This note captures **where Tasty stands today** on **type aliases and constructed types** (`Omit<…>`, intersections, mapped types, etc.), **why doc consumers often see a useless “definition”**, and **what “first class” should mean** so Tasty stays useful for reference UIs—not just interface-shaped APIs.

It complements the main [`README.md`](./README.md) (lowering, scan boundary). It is intentionally **aspirational**: full TypeScript semantics are out of scope; **bounded, explainable** behavior is the target.

---

## Why this matters

In TypeScript, **`type` aliases are not a weaker `interface`**. They often carry the same *documentation surface* as interfaces:

- aliases to object types, intersections, and utility instantiations (`Omit`, `Pick`, …)
- re-exports from packages (`export type { Foo } from 'pkg'`)
- conditional and mapped types that *behave* like fixed property bags for consumers

Downstream (e.g. `@reference-ui/reference-core` and `@reference-ui/reference-lib`) can only show **members, resolved definitions, and links** if Tasty’s **emitted graph** exposes enough structure—not only for `interface`, but for **`type` and its RHS**.

---

## Current model (short)

| Concept | In Tasty today |
| --- | --- |
| **Interfaces** | `SymbolShell` with `defined_members`, `extends`, stable ids; runtime exposes `getMembers()` for interface payloads. |
| **Type aliases** | `SymbolShell` with `kind: TypeAlias`, **`underlying` `TypeRef`**, usually **no** `defined_members` (members live on interfaces). |
| **Synthetic re-export** | `export type { Name } from 'module'` gets a **shell** in the barrel (`ast/extract/module_bindings/reexport_type_alias.rs`) so the name appears in the manifest. The underlying ref is often a **name reference** with **`target_id: None`** until resolution catches up—so the RHS may not serialize as the real declaration in the library file. |

The JS runtime mirrors that: **`getMembers()` is interface-only** (`js/tasty/internal/wrappers.ts`). Type aliases are not treated as carrying a member list, even when the RHS is an object type.

---

## Where information is “dropped” (mental model)

This is **not** a single bug; it is **layered contracts**:

1. **Extraction**  
   A type alias’s **RHS** is lowered to `TypeRef` (`ast/extract/types/`, `type_references/`). Deep or opaque nodes may stay **abstract** in IR.

2. **Synthetic barrels**  
   Re-export shells prioritize **discoverability** (name in manifest) over **fully hydrated RHS** from the remote module. The alias may look **self-referential** until linked to the **canonical symbol** in the target chunk.

3. **Resolution / instantiation**  
   Following `TypeRef::Reference` to a **loaded symbol**, and **instantiating** generics, is partial (`ast/resolve/`). Utility types like `Omit` are **not** guaranteed to expand to a flat property list in artifacts.

4. **Consumers**  
   Reference runtimes may **only attach effective members to interfaces** (see `reference-core` browser `Runtime.ts`). Even perfect `TypeRef` trees would not surface as “members” until **both** Tasty and consumers agree on a **type-alias member projection** story.

So: **Tasty** owns whether the **graph + `TypeRef`** is rich enough; **downstream** owns whether **UI** maps that to rows. Both need to move for “types = interfaces for docs.”

---

## What “first class” should mean

**Goal:** For symbols that are **type aliases**, Tasty should still enable:

1. **Identity** — stable id, name, library, export surface (already largely true).
2. **Readable definition** — `TypeRef` (or source-backed snippet) that **does not collapse** to a bare self-name when the real RHS is known elsewhere in the graph.
3. **Navigation** — `Reference` edges to **other symbols** (interfaces, type params, utility targets) where resolvable.
4. **Structured surface (when meaningful)** — for RHS shapes that are **object-like** for consumers, optionally expose something **member-shaped**:
   - either **resolved inline members** (best-effort),
   - or **explicit “expand / follow”** to an interface or alias symbol,
   - without pretending **full** TS assignability or conditional-type evaluation.

**Non-goals:**

- Being a second `tsc` (full inference, all mapped-type evaluation, variance).
- Guaranteeing a flat property list for **every** alias (generics + deep conditionals will always have limits).

---

## Concrete directions (implementation buckets)

These are **ordered roughly by leverage**, not commitment.

### A. Canonical resolution for re-exported aliases

When a barrel emits `export type { X } from 'pkg'`, resolve **`X`’s defining chunk** and either:

- store **`target_id`** on the reference once known, or
- emit a **thin stub** that **reuses** the remote symbol’s payload by id,

so the manifest’s **`X`** is not stuck with **`target_id: None`** and a circular **name-only** `TypeRef`.

*Touches:* `reexport_type_alias.rs`, resolver/index, manifest emission.

### B. Richer `TypeRef` presentation without full evaluation

Ensure **utility and composite** nodes (`Omit`, `Pick`, `&`, `|`) **serialize** with **children** and **spelling** that round-trip to useful display and linking—even when we do not “evaluate” them.

*Touches:* `generator/types/`, `ast/extract/types/lower_*`, emitted type artifacts.

### C. Bounded expansion to “member-like” rows

For aliases whose RHS **lowers** to **object / intersection / instantiation** of known utilities, optionally run a **projection** pass that produces **`TastyMember`-compatible** entries **or** explicit “pseudo-members” with provenance (e.g. “from `Omit` of …”).

*Touches:* `ast/resolve/`, `emitted/members.rs`, new optional pass—**must** stay bounded to avoid explosion.

### D. Runtime API alignment

Expose a **documentable surface** for type aliases:

- e.g. `getAliasDefinition(): TypeRef`, `getProjectedMembers(): … | undefined`, or **follow-to-canonical-symbol** helpers,

so **reference-core** can choose **definition + members** without special-casing only `interface`.

*Touches:* `js/tasty/internal/wrappers.ts`, `api-types.ts`, graph helpers.

### E. Downstream UI contract

Once Tasty exposes (B)–(D), consumers can show **the same UX** as interfaces **when** projection exists, and **fallback** to **definition + links** when not.

*Touches:* outside this crate; keep this doc’s **contract** section in sync when the API changes.

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

Today, **interfaces** carry **members**; **type aliases** carry **`TypeRef` RHS** with **partial** resolution and **synthetic barrels** that optimize **indexing** over **full hydration**. Making Tasty **useful** for modern TS APIs means **treating type aliases as documentation objects**, not only **name entries**: **resolve** them to **canonical** definitions, **preserve** composite structure in **`TypeRef`**, and **optionally project** object-like RHS into **member-shaped** output—within **clear, bounded** rules.
