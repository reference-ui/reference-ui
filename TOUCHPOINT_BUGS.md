# Reference UI MCP Server: First-Touch Agent Audit & Bug List

This document captures issues, edge cases, and ergonomic friction points discovered during a first-touch interaction with the Reference UI MCP server as an autonomous agent consumer.

---

## 1. Default Active Project Deadlock (`fixtures/atlas-project`)

* **Severity**: High (Blocks zero-config agent onboarding)
* **Affected Tools**: `list_projects`, `list_components`, `get_tokens`, etc.
* **Observed Behavior**:
  When starting up, the MCP server defaults to an unsynced fixture project:
  ```json
  "activeProject": "/.../fixtures/atlas-project",
  "isDefault": true,
  "hasArtifacts": false
  ```
  Immediately executing standard discovery commands like `list_components` or `get_tokens` fails with:
  ```text
  Project at '/.../fixtures/atlas-project' has not been synced yet.
  Generated type artifacts are missing at '/.../fixtures/atlas-project/.reference-ui/types/tasty/manifest.js'.
  Run 'ref sync' (or 'pnpm dev') to generate the model artifacts.
  ```
* **Impact**:
  An agent running without terminal/shell access or unaware of project switching is immediately trapped in a deadlock.
* **Recommendations**:
  1. Default to a project with artifacts already generated (e.g. `hasArtifacts: true`, such as `packages/reference-lib`).
  2. If the active project lacks artifacts, gracefully fall back to universal primitives mode or prompt the client with available synced projects instead of throwing a hard error.

---

## 2. Argument Schema Discrepancy in `select_project`

* **Severity**: Medium (Friction & tool call failure)
* **Affected Tools**: `select_project`
* **Observed Behavior**:
  In `instructions.md`, Section 2 states:
  > *- Set Session Focus: When shifting your work to a package, call `select_project({ path: 'packages/...' })`.*
  > *- Per-Query Targeting: If you just need a one-off query from another package without altering active focus, pass `project: 'packages/...'`.*
  
  Calling `select_project({ project: 'packages/reference-lib' })` results in an unhandled Zod validation error:
  ```text
  MCP error -32602: Input validation error: Invalid arguments for tool select_project: [
    {
      "expected": "string",
      "code": "invalid_type",
      "path": ["path"],
      "message": "Invalid input: expected string, received undefined"
    }
  ]
  ```
* **Impact**:
  Models frequently infer the argument name `project` from the tool name `select_project` or the per-query parameter convention, leading to failed tool calls.
* **Recommendations**:
  Accept either `path` or `project` in the `select_project` input schema (e.g. `z.object({ path: z.string().optional(), project: z.string().optional() })`), defaulting `path = path ?? project`.

---

## 3. AST Parsing Leaking Non-Identifier Tokens (`"}"` as Prop)

* **Severity**: Medium (Data corruption / schema pollution)
* **Affected Tools**: `get_component({ name: 'Button' })`, `get_component_props({ name: 'Button' })`
* **Observed Behavior**:
  In `ButtonProps`, the AST extractor includes a closing curly bracket as an observed prop:
  ```json
  {
    "name": "}",
    "count": 22,
    "usage": "common",
    "type": null,
    "description": null,
    "optional": true,
    "readonly": false,
    "origin": "observed",
    "styleProp": false
  }
  ```
* **Root Cause**:
  Likely caused by JSX expression container parsing or object destructuring/spread expressions where the closing `}` is captured as an attribute identifier.
* **Recommendations**:
  Sanitize extracted prop names in the AST scanner to ensure they match valid JavaScript/TypeScript identifier regex (`/^[a-zA-Z_$][a-zA-Z0-9_$-]*$/`) before aggregating metrics.

---

## 4. Semantic Misclassification: `disabled` Flagged as `styleProp: true`

* **Severity**: Low / Medium (Incorrect agent styling assumptions)
* **Affected Tools**: `get_component`, `get_component_props`
* **Observed Behavior**:
  On primitive components like `Button`, the standard HTML attribute `disabled` is flagged as `"styleProp": true`:
  ```json
  {
    "name": "disabled",
    "count": 16,
    "usage": "occasional",
    "type": null,
    "description": null,
    "optional": true,
    "readonly": false,
    "origin": "observed",
    "styleProp": true
  }
  ```
* **Impact**:
  An agent relying on `styleProp: true` might attempt to treat `disabled` as an atomic styling token or Panda CSS style property rather than a native HTML/ARIA state attribute.
* **Recommendations**:
  Cross-reference observed props against the true Panda CSS StyleProps whitelist before setting `styleProp: true`.

---

## 5. Token Bloat & Statistical Inversion in `usedWith`

* **Severity**: Medium (Context window waste & noisy data)
* **Affected Tools**: `get_component`
* **Observed Behavior**:
  1. **Noise**: For `Button`, `usedWith` returns ~70 standard HTML elements (`Abbr`, `Address`, `Caption`, `Figcaption`, `Meter`, `Ins`, `Del`), each labeled `"rare"`.
  2. **Statistical Inversion**: For `Dialog` (which has a total occurrence count of only 2 across the analyzed project), almost every standard HTML tag is marked `"very common"`.
  3. **Payload Bloat**: This increases the response size of `get_component` to 12KB–20KB per call, 70%+ of which is raw HTML tag noise.
* **Recommendations**:
  1. Only include components/primitives in `usedWith` that exceed a relevance threshold (e.g. at least 2 occurrences or co-occurrence ratio > 10%).
  2. Fix the bucket frequency normalization calculation when the target component has low sample counts (`count <= 2`).
  3. Cap `usedWith` to the top 5–10 most relevant co-occurring components.
