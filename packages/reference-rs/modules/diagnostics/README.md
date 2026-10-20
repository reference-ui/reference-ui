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
2. **Deliberate codes.** `REGISTRY` is the living code inventory: the
   namespace table, the assignment convention per-module agents follow, and
   the never-rename rule. Parsing enforces shape; the registry enforces
   deliberateness. Namespaces are disjoint, so parallel agents never collide.
   The wire form below is the companion law: the JSON field table and the
   canonical key order every encoder emits.
3. **Minimal transport.** Native functions return `encode_batch` JSON strings
   over napi; the `diagnostics` js entry parses them with `parseBatch`, which
   validates the same contract. The template holds no napi dependency — each
   module's `native` keeps owning its boundary, and the template owns only
   the diagnostic slice of those payloads.
4. **Pattern, not law, for messages.** The transport demands a code and a
   non-blank message, nothing more. The message helpers (`inline_code`,
   `hint`, `did_you_mean`, `suggest`, `join_lines`, mirrored in js) capture
   what "good" looks like — subject-first one-liners, backticked subjects,
   suggestion and hint lines — and the worked examples in the test suites pin
   the style. Producers own presentation; the pattern spreads by convenience.

## Wire form

One batch on one line: a JSON array of diagnostics, UTF-8, no trailing newline inside the encoded string. Parsers accept any whitespace, so pretty-printed case goldens carry the same infoset as the compact wire.

| Field | Type | Required | Meaning |
| ----- | ---- | -------- | ------- |
| `severity` | string | yes | `warning` (compile continues) or `error` (request refused); the code tag agrees |
| `code` | string | yes | `NS-SEV-NAME` identity, documented in the registry |
| `message` | string | yes | rich-text canvas, non-blank; first line a complete subject |
| `file` | string | no | source path, when the failure has one |
| `line` | integer | no | 1-based line, when known |
| `column` | integer | no | 1-based column, when known |
| `span` | object | no | `{start, end}` byte offsets, start inclusive, end exclusive |
| `labels` | array | no | `[{span, message}]` labeled underlines, each note non-blank |
| `help` | string[] | no | `= help:` lines, each non-blank |

Encoders emit fields in exactly this order, omit absent optionals (never `null`), strip unknown keys, and drop empty `labels` / `help` — so the same diagnostic encodes byte-identically from Rust, the JS mirror, and the Core transport. Contract tests on all three sides pin these exact bytes.

## Mental model

Think compiler, not string pipe: phases report typed facts, the template gives
each failure a stable identity, and consumers group, suppress, and document by
code. The message is a canvas for authors (unicode, newlines, snippets, even
emoji are permitted); the code is the machine contract. Strictness lives in
exactly one place: the code is always present, always documented.

## Boundaries

- No `napi` dependency and no new napi export: the template rides the existing
  JSON-string convention. Adoption means a module's `native` serializes
  template diagnostics into payloads it already returns.
- Presentation is a shared util, display stays with consumers: the frame
  renderer (the `render` frame renderer, mirrored in JS) turns spans, labels,
  and help into deterministic code frames, capped so the first N diagnostics
  get frames and the rest stay one-liners — but the CLI and Core own when and
  where frames print. No info level: `-I-` is reserved and rejected;
  module-local telemetry (atomic's `ATM-I-*`) stays module-local.
- Suggestions are gated: `suggest_for_code` fires only for the
  unknown-X-from-known-set codes in `SUGGESTION_CODES`, with candidates wired
  per call by the producing module. Rendered frames are reviewed by hand, never
  golden-pinned — contract tests assert structure, never pretty bytes.
- The js mirror validates identically to Rust; the `transport`
  cross-language goldens are byte-identical by construction.

## Verifying

```bash
pnpm agentrs c diagnostics                # Rust unit tests (+ regenerates the JS bindings)
pnpm agentrs v diagnostics                # Vitest seam tests
pnpm agentrs q                            # quality gate over the template
```

> Up: @reference-ui/rust

> Search terms: diagnostics, diagnostic template, error codes, code registry, transport, napi diagnostics, rs:diagnostics, severity, message pattern
