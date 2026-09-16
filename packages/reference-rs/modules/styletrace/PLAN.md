# Styletrace — hermetic primitive graph plan

Styletrace answers one question for atomic: which JSX names in this source
graph ultimately carry Reference UI StyleProps? It must derive that answer
from declarations/imports, not capitalization.

Campaign sequencing is [`../../PLAN.md`](../../PLAN.md). This file owns packet
**N6** and the styletrace prerequisite for atomic `ATM-SITE-13`.

Runner: `pnpm agentrs v styletrace` / `pnpm agentrs c styletrace`.

---

## Current failure mode

Production sync and hermetic tests do not present the same filesystem:

- `trace_style_jsx_names(root)` tries to resolve a sync root
- primitive identities live in generated
  `.reference-ui/react/system/primitives/index.d.mts` (or `.d.ts`)
- many atomic virtual/station trees do not contain generated declarations
- `collect_reference_primitive_jsx_names` returns an empty set when that file
  is absent
- atomic swallows trace errors as an empty set
- when the host set is empty, `ExtractContext::allows_jsx_tag` scans every
  opening tag

That fallback keeps simple `<Div mt="2r" />` fixtures green but also treats
unrelated `<Foo mt="2r" />` as a style host. It is not a safe production
extractor.

File-local imports from `@reference-ui/react` improve the subset but do not
prove exported wrappers or generated primitive identity.

---

## Required call contract

The compile boundary must distinguish:

- **source/project root** — files whose JSX/calls are compiled
- **generated declaration root** — the `.reference-ui` tree describing
  primitives and public `StyleProps`

Use an explicit request field or equivalent typed hint. Do not infer the
second root by walking arbitrary parents from the first.

Production Core stages primitive declarations before invoking styletrace.
Missing declarations remain fatal; the driver must not point at an empty live
outdir. Virtual tests may pass an explicit traced-name input only through a
test/helper API, or provide a tiny generated declaration fixture.

---

## N6 implementation packets

### ST-NATIVE-01 — committed sync-root fixture

Create one minimal fixture containing:

- generated public `StyleProps`
- generated primitive declarations for `Div`, `Button`, and one other tag
- one direct wrapper
- one re-exported wrapper
- one wrapper that removes StyleProps
- one unrelated PascalCase component

Use the same directory/module shape production package generation emits. Do
not add a styletrace-only primitive registry.

**Assertions**

- primitives are discovered
- direct/re-exported wrappers are traced
- the prop-removing wrapper is excluded
- unrelated PascalCase component is excluded

### ST-NATIVE-02 — explicit roots

1. Add a typed API accepting project/source root plus generated declaration
   root.
2. Keep a convenience wrapper only if its inference is deterministic and
   tested; atomic/Core use the explicit API.
3. Return a descriptive error for missing primitive declaration entrypoint.
4. Return a descriptive error for malformed public type graph.
5. Preserve deterministic, module-qualified bindings at the JS boundary
   (`{ module, name }[]`), not a global `Set<string>`.

**Assertions**

- project root without generated root fails explicitly
- separate temp roots work
- `.d.mts` and supported `.d.ts` entrypoints work
- stale alternate generated roots are not selected accidentally

### ST-NATIVE-03 — atomic integration

1. Add the generated-root hint to atomic's `NativeCompileRequest`.
2. Pass trace errors into compile diagnostics; error severity fails production
   sync at Core.
3. For `files:` stations, point at ST-NATIVE-01's fixture.
4. Preserve file-local Reference imports as positive evidence, not as a
   global scan fallback.
5. A traced name is a host only in its module. Unqualified `jsxHosts` from the
   compile request match local identifiers (configured aliases).
6. Remove `allows_jsx_tag`'s scan-every-tag behaviour.

### ST-NATIVE-04 — close extraction cases

Make these direct oracles:

- `ATM-SITE-01` — imported generated primitive extracts
- `ATM-SITE-08` — wrapper traced through declarations extracts
- `ATM-SITE-13` — unrelated PascalCase props do not extract; missing trace
  graph fails closed

If SITE-01 currently omits an import, fix the fixture to model production. Do
not retain false-positive behaviour for an unrealistic fixture.

---

## Ownership

**N6 owns**

- `modules/styletrace/**`
- its dedicated fixtures
- the smallest atomic request/integration files coordinated with the atomic
  owner
- SITE-01/08/13 fixtures

**N6 does not own**

- Core compiler driver (C4 passes the roots)
- primitive generation
- runtime plan or stylesheet design
- a hardcoded JSX-name list

When N6 and N2 are parallel, the orchestrator reserves atomic request files for
one agent and integrates the other's minimal patch afterward. Do not both edit
`atomic/src/lib.rs` independently.

---

## Verification

During implementation:

```bash
pnpm agentrs c styletrace -t "<case>"
pnpm agentrs v styletrace -t "<case>"
pnpm agentrs q packages/reference-rs/modules/styletrace
```

Before hand-off:

```bash
pnpm agentrs c styletrace
pnpm agentrs v styletrace
pnpm agentrs v atomic -t "SITE-01|SITE-08|SITE-13"
pnpm agentrs q packages/reference-rs/modules/styletrace
```

Done means:

- explicit source and declaration roots work
- returned hosts are module-qualified
- the committed fixture mirrors production generated shape
- wrappers are positive and unrelated PascalCase components are negative
- missing/corrupt graph is observable
- atomic no longer scans every JSX tag when tracing is empty
- SITE-01, SITE-08, and SITE-13 assert the real boundary

---

## Do not

- Do not infer style hosts from PascalCase.
- Do not hardcode `Div`, `Button`, or a generated primitive list in Rust.
- Do not silently convert trace errors into an empty set.
- Do not accept a project root as proof that generated declarations exist.
- Do not make Core's generated package depend on a test fixture.
- Do not broaden the public type graph merely to make tracing easier.
- Do not add `#[allow(clippy::…)]` or `#[expect(clippy::…)]`.
