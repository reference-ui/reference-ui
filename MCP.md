# MCP server (draft)

This document sketches a **Model Context Protocol** integration for Reference UI and, more broadly, **frontend codebases that may or may not use Reference components**. It is intentionally speculative; it exists to align implementation bets before we commit to APIs.

## Two separate modules

This document covers **two distinct Rust modules** that sometimes get conflated. They are not the same thing:

|          | **Tasty**                                  | **Atlas**                            |
| -------- | ------------------------------------------ | ------------------------------------ |
| Purpose  | Type-centric IR for TS symbols and members | Frontend-centric usage analysis      |
| Input    | TypeScript types and declarations          | React call sites across the repo     |
| Output   | Lazy, chunk-backed IR for symbols/members  | Usage profiles, prop stats, clusters |
| Audience | Type tools, MCP type queries               | Agent context, migration tooling     |

The dependency is **one-directional**: Tasty has no knowledge of Atlas. Atlas uses Tasty in one specific, narrow way — once Atlas has identified which props interface belongs to a component, it hands that interface to Tasty for type resolution. Atlas drives the query; Tasty just answers it. Tasty never needs to know anything about React components, and this relationship does not need to change that.

---

## Tasty

**Tasty** lowers TypeScript into a **lazy, chunk-backed IR**: symbols, members, type refs, graph operations (e.g. display members, projection). For a **given type**, Tasty can provide an **IR-shaped description** that tools (including MCP type queries) can consume without re-parsing raw TS on the client.

---

## Atlas

A **separate, specialized module** for React codebases. Tasty is type-centric; this module is **usage-centric**. Its job is to answer a different class of question: not "what type does this symbol have" but "how is this component actually used across this repo." Where it needs type info, it asks Tasty — but only about interfaces Atlas already knows about from its own analysis.

### What it adds

### 1. Canonical mapping: implementations ↔ contracts

Still driven by AST (and type info where available), but oriented toward **UI code**:

- Which **functions** and **React components** **satisfy or relate to** which **interfaces / prop types / public contracts**.
- A **canonical mapping** (stable ids, not just string names) so agents can answer “what implements what?” and “where is this contract used?”

This is specialized knowledge: not every TS language server query is phrased in terms of “component ↔ props interface.”

### 2. Props analysis for React usage

For **React components in the user’s codebase**, the MCP should **analyze props** as actually used:

- Usage sites, spread patterns, and how they line up with declared prop types when resolvable.
- Enough structure to power **accurate** answers in assistants without guessing from text.

### 3. Real examples, deduped by “shape”

For a **given component** (or symbol), maintain a **database of real examples** drawn from the repo:

- Extract **concrete usage snippets** from the codebase.
- **Dedupe** by analyzing **envelopes** (structural similarity of the usage pattern) and comparing against **near-duplicate** usages so the tool does not flood context with copy-paste noise.

Goal: “here are three representative ways this component is used in _this_ project,” not “here are 400 imports.”

### 4. User code first, Reference UI optional

The MCP must map **the user’s** types and components **first**. Reference UI primitives are **one possible** stack, not the only audience.

## **Fingerprinting:** many repos will **not** use Reference components. The toolchain should **detect** whether Reference UI is present (e.g. dependency graph, config files, import patterns, `.reference-ui` artefacts) and **adapt behavior** or **feature tiers** accordingly—without requiring Reference UI for baseline value.

## Component pattern analysis

This is the core problem the Rust analyzer has to solve well. An agent already has general knowledge about UI patterns—it knows what breadcrumbs _are_. What it cannot know from training alone is:

- **Which** breadcrumb component does _this_ codebase actually use?
- **How** is it wired up here—what props, what wrappers, what context dependencies?
- Are there **two or three competing implementations** in flight at once?

Getting those answers from a grep or a raw type dump is fragile and noisy. The MCP should produce structured, codebase-grounded answers.

### The multi-design-system problem

Large or long-lived codebases routinely have **multiple design systems in flight simultaneously**—a legacy `@company/ui` package alongside a newer `@company/design-system`, or a third-party library mixed with in-house primitives. This is extremely common and must be a first-class scenario, not an afterthought.

Concretely, a codebase might have:

```tsx
// page A
import { Breadcrumb } from '@company/legacy-ui'

// page B
import { Breadcrumbs } from '@company/design-system'

// page C
import { BreadcrumbNav } from '~/components/BreadcrumbNav' // in-house wrapper
```

An agent that conflates these will give wrong answers. The MCP must **distinguish sources**, track which import path each call site came from, and surface that provenance alongside the usage data.

### Source configuration (`AtlasConfig`)

**Local project files are always tracked.** Atlas indexes everything in the user's own codebase as first-class by default — no configuration required for the common case.

Libraries are opt-in. The `include`/`exclude` fields accept **source patterns**: package names, file globs, or scoped component references.

```ts
type AtlasConfig = {
  // package name, file glob, or scoped ref ("@acme/ui:Button")
  include?: SourcePattern[]
  exclude?: SourcePattern[]
}
```

Examples:

```jsonc
// track an entire design system library
{ "include": ["@acme/design-system"] }

// track a library but suppress a specific deprecated component
{ "include": ["@acme/design-system"], "exclude": ["@acme/design-system:LegacyButton"] }

// migration scenario: track both old and new, exclude specific packages from context
{ "include": ["@acme/design-system", "@acme/legacy-ui"], "exclude": ["@acme/legacy-ui"] }
```

When `include` is empty, Atlas still runs — it discovers all component sources from local files, reports them grouped by import path, and surfaces the distribution as-is.

**The 80% case:** most users never touch this config. It exists primarily for teams doing migrations or teams who want to document wrapper components against the libraries they wrap.

### Component origin and wrapper detection

Every tracked component has a `source` — either a package name (`"@acme/ui"`) or a local path. This is the primary signal for origin:

- **Library component**: `source` resolves to a `node_modules` package
- **User-local component**: `source` is a path inside the project
- **Wrapper**: a user-local component that imports a library component internally

When Atlas detects a wrapper relationship (via import trace during AST analysis), it records it as a **shadow**: `LocalButton → @acme/ui:Button`. The MCP surfaces the local wrapper as the preferred component and notes what it wraps, so agents produce imports against the user's own layer rather than bypassing it to the library directly.

For cases where wrapper detection is ambiguous (name mismatch, indirect re-export), explicit source patterns in `include`/`exclude` serve as the escape hatch.

### What Atlas emits per component

For each tracked component (or concept group), the analyzer should produce a **usage profile**:

**Frequency and distribution**

- Total call site count, broken down by import source.
- File / feature area heatmap (where is this used most?).

**Prop frequency table**

- Every prop name that appears at any call site, with a count and the percentage of sites that pass it.
- Distinguish **always-passed**, **commonly-passed**, and **rare** props so the agent can say "in practice, `items` and `separator` are always provided; `maxItems` appears in about 20% of usages."

**Configuration clusters**

- Group call sites by their **prop shape** (which props are set, ignoring values), not by their literal values. This surfaces the two or three recurring patterns without drowning in per-site noise.
- Each cluster gets representative examples—real source snippets from the repo.

**Value distributions for key props**

- For props that take a small enum or literal set (`variant`, `size`, `color`), count actual values across all call sites.
- Example output: `variant` → `"default"` 60%, `"compact"` 35%, `"full"` 5%.

**Compositional context**

- What components are commonly _co-located_ or _wrapping_ this one? (e.g. `Breadcrumbs` almost always appears inside `PageHeader` in this repo.)
- Slot fill patterns if the component uses a children/slots API.

### Concrete example: breadcrumbs

Given the multi-source scenario above, the MCP might return:

```
concept: breadcrumb
─────────────────────────────────────────────────────
sources detected:
  @acme/design-system    Breadcrumbs     47 sites  ← canonical
  @acme/legacy-ui        Breadcrumb      12 sites  ← legacy
  ~/components/BreadcrumbNav              3 sites  ← local wrapper

canonical usage profile (Breadcrumbs, 47 sites):
  always passed:   items, aria-label
  common (>50%):   separator (72%), maxItems (51%)
  rare (<10%):     onNavigate, className

  top config clusters:
    [cluster A, 31 sites]  items + aria-label
      <Breadcrumbs items={breadcrumbs} aria-label="Breadcrumb" />

    [cluster B, 12 sites]  items + aria-label + separator
      <Breadcrumbs items={trail} aria-label="You are here" separator="›" />

    [cluster C, 4 sites]   items + aria-label + maxItems
      <Breadcrumbs items={crumbs} aria-label="Navigation" maxItems={4} />

  separator values: "/"  58%,  "›"  33%,  custom element  9%

legacy: 12 sites on @acme/legacy-ui — migration candidates
```

This is the difference between "the agent knows what breadcrumbs are" and "the agent knows what breadcrumbs _look like in this repo_."

---

## What “done” might look like (product)

A compelling MCP for frontend work would let an assistant:

- Navigate **components ↔ types ↔ usage** with a **canonical model**.
- Answer **props** questions grounded in **analysis**, not grep.
- Pull **deduped, real** examples from the user’s repo.
- Identify **which design system** (or systems) a call site comes from, even when multiple are in flight.
- Apply the user's **canonical registry** to separate intentional multi-system usage from unreviewed drift.
- Work in **plain React** codebases as well as **Reference-aware** ones, with **explicit** detection of the latter.

## Open questions (to resolve in implementation)

**Tasty**

- Exact **IR boundary** between Tasty exports and MCP type-query surface (what stays in Rust vs what's a thin TS MCP adapter).

**Atlas**

- **Envelope** definition for example deduplication (AST hash? normalized prop object? type-aware similarity?).
- **Prop shape clustering** algorithm—how similar do two call sites need to be to land in the same cluster? Jaccard on prop-name sets is a baseline; type-aware similarity is better but harder.
- **Wrapper detection reliability**: at what point does heuristic import-trace detection need to fall back to explicit config? What's the threshold before we surface ambiguity to the user?
- **Performance** and **incremental** updates when `ref sync` or file watchers fire.

---

_Draft — revise as the Rust module shape and MCP tool schema firm up._
