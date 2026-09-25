# Diagnostics Module

The `reference-rs` top-level diagnostics template: one representation, one
transport, one registry. Every native module roots its diagnostics here so
hosts filter and render a single contract instead of one shape per producer.

## Architecture & Responsibilities

1. **One representation.** `Diagnostic` is severity (`warning` / `error`)
   plus a validated `NS-SEV-NAME` code plus a rich-text message, with an
   optional `file` / `line` / `column` envelope and the rendering channel:
   a byte-offset `span`, `labels`, and `help` lines. Producers record cheap
   byte offsets, never line math; presentation resolves them post-compile.
   Construction and deserialization both validate, so a value is always
   shippable and a bad wire payload always fails closed. The wire shape
   matches atomic's camelCase exactly, so atomic adoption is mechanical.
2. **Deliberate codes.** `REGISTRY.md` is the living code inventory: the
   namespace table, the assignment convention per-module agents follow, and
   the never-rename rule. Parsing enforces shape; the registry enforces
   deliberateness. Namespaces are disjoint, so parallel agents never collide.
   `SCHEMA.md` is the companion wire law: the JSON field table, the canonical
   key order every encoder emits, and the examples the contract tests pin.
3. **Minimal transport.** Native functions return `encode_batch` JSON strings
   over napi; the `diagnostics` js entry parses them with `parseBatch`, which
   validates the same contract. The template holds no napi dependency — each
   module's `native.rs` keeps owning its boundary, and the template owns only
   the diagnostic slice of those payloads.
4. **Pattern, not law, for messages.** The transport demands a code and a
   non-blank message, nothing more. The message helpers (`inline_code`,
   `hint`, `did_you_mean`, `suggest`, `join_lines`, mirrored in js) capture
   what "good" looks like — subject-first one-liners, backticked subjects,
   suggestion and hint lines — and the worked examples in the test suites pin
   the style. Producers own presentation; the pattern spreads by convenience.

## Mental model

Think compiler, not string pipe: phases report typed facts, the template gives
each failure a stable identity, and consumers group, suppress, and document by
code. The message is a canvas for authors (unicode, newlines, snippets, even
emoji are permitted); the code is the machine contract. Strictness lives in
exactly one place: the code is always present, always documented.

## Boundaries

- No `napi` dependency and no new napi export: the template rides the existing
  JSON-string convention. Adoption means a module's `native.rs` serializes
  template diagnostics into payloads it already returns.
- Presentation is a shared util, display stays with consumers: the frame
  renderer (`src/render.rs`, mirrored in `js/render.ts`) turns spans, labels,
  and help into deterministic code frames, capped so the first N diagnostics
  get frames and the rest stay one-liners — but the CLI and Neo own when and
  where frames print. No info level: `-I-` is reserved and rejected;
  module-local telemetry (atomic's `ATM-I-*`) stays module-local.
- Suggestions are gated: `suggest_for_code` fires only for the
  unknown-X-from-known-set codes in `SUGGESTION_CODES`, with candidates wired
  per call by the producing module. Rendered frames are playtested, never
  golden-pinned — contract tests assert structure, never pretty bytes.
- The js mirror validates identically to Rust; the cross-language goldens in
  `src/transport.rs` and `js/index.test.ts` are byte-identical by construction.

## Verifying

```bash
pnpm agentrs c --crate diagnostics        # Rust unit tests (+ regenerates js/generated)
pnpm agentrs v modules/diagnostics/js/index.test.ts  # Vitest seam tests
pnpm agentrs q modules/diagnostics        # quality gate over the template
```

> Search terms: diagnostics, diagnostic template, error codes, code registry, transport, napi diagnostics, rs:diagnostics, severity, message pattern
