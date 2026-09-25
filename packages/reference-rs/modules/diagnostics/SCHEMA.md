# Diagnostics JSON Schema (wire v1)

The machine-readable form of the template `Diagnostic`: what crosses napi,
what `ref sync --json` prints, and what the contract tests pin byte-for-byte.
Owned by the template beside `REGISTRY.md` — producers mint codes, the center
owns the bytes. Human frames are playtested and free to improve; this
document is law, and renames or reshapes break loudly in the goldens below.

## The value

A batch is a JSON array of diagnostics; a single diagnostic is one object.
The napi transport, the js mirrors, and the Neo CLI all emit the compact
form — one batch on one line, UTF-8, no trailing newline inside the encoded
string (printers add it). Parsers accept any JSON whitespace, so the
pretty-printed station goldens (`output/diagnostics.json`) carry the same
infoset as the compact wire.

## Fields

| Field     | Type     | Required | Meaning                                                        |
| --------- | -------- | -------- | -------------------------------------------------------------- |
| `severity`| string   | yes      | `warning` (compile continues) or `error` (request refused). The code tag must agree. |
| `code`    | string   | yes      | Validated `NS-SEV-NAME` identity, always present and documented in `REGISTRY.md`. |
| `message` | string   | yes      | Rich-text canvas, non-blank, producer-styled; the first line is a complete subject. |
| `file`    | string   | no       | Source path when the failure has one; absent for request-level diagnostics. |
| `line`    | integer  | no       | 1-based line within `file`, when known.                        |
| `column`  | integer  | no       | 1-based column within `line`, when known.                      |
| `span`    | object   | no       | Byte-offset span into `file`: `{start, end}`, UTF-8 bytes, start inclusive, end exclusive. |
| `labels`  | array    | no       | Labeled underlines: `[{span, message}]`, each note non-blank.  |
| `help`    | string[] | no       | `= help:` lines; every line non-blank.                         |

Codes match the `REGISTRY.md` shape (`NS-SEV-NAME`, `-W-`/`-E-` only —
`-I-` is reserved and rejected). Spans are recorded cheaply below the cut
and resolved to carets above it; `line`/`column` are the resolved compat
channel, `span`/`labels`/`help` the rendering channel.

## Canonical order and omission

Encoders emit fields in exactly this order — `severity`, `code`, `message`,
`file`, `line`, `column`, `span`, `labels`, `help` — with nested `span`
objects as `{start, end}` and labels as `{span, message}`. Absent optionals
are omitted (never `null`), unknown keys are stripped, and empty `labels`
or `help` lists are dropped as absent, exactly like the Rust struct. The
same diagnostic therefore encodes to byte-identical JSON from Rust, the
template js mirror, and the Neo transport, regardless of construction order.

## Examples

Bare error (no location):

```json
{"severity":"error","code":"RS-E-EXAMPLE-BOOM","message":"refused: two recipes claim `btn`"}
```

Located warning (compat channel only):

```json
{"severity":"warning","code":"RS-W-EXAMPLE-TOKEN","message":"unknown token path `colors.nope` for prop `color`","file":"app/Button.tsx","line":12,"column":7}
```

Located warning with the full rendering channel:

```json
{"severity":"warning","code":"RS-W-EXAMPLE-TOKEN","message":"unknown token path `colors.nope` for prop `color`","file":"app/Button.tsx","line":12,"column":7,"span":{"start":240,"end":252},"labels":[{"span":{"start":240,"end":252},"message":"no such token path"}],"help":["point the path at an existing token"]}
```

A batch wraps rows in an array:

```json
[{"severity":"warning","code":"RS-W-EXAMPLE-TOKEN","message":"unknown token path `colors.nope` for prop `color`"},{"severity":"error","code":"RS-E-EXAMPLE-BOOM","message":"refused: two recipes claim `btn`"}]
```

Every example above is pinned verbatim: `src/transport.rs` (Rust),
`js/index.test.ts` (template mirror), and the Neo `json.test.ts` contract
all assert these exact bytes, so any drift between the schema, the
encoders, and the CLI fails loudly on at least one side.

## Legacy carries (Neo side only)

`ref sync --json` concatenates the reported set — userspace warnings, the
opt-in compiler backchannel, the reference tasty channel — in first-seen
order with no dedupe and no channel tags: folding and tagging are human
presentation, while agents count and filter raw rows. Rows that satisfy the
typed contract emit canonically; legacy carries (compiler `info` telemetry,
codeless stragglers) ride verbatim in producer key order until they earn
codes. Legacy rows are pass-through, not schema-valid, and the template
grows no info level to admit them — see `REGISTRY.md`.

## Consumers

- Napi transport: native functions return `encode_batch` strings; the js
  mirrors parse them with `parseBatch`.
- `ref sync --json`: stdout carries exactly the canonical batch (one line;
  `[]` when clean); human lines move to stderr and the exit code is
  unchanged. Failures exit 1 with the cause on stderr and empty stdout.
  `--verbose` stays orthogonal: the human list still prints to stderr.
- Station goldens: per-module `output/diagnostics.json` files pin the same
  infoset pretty-printed; parsers read them identically to the compact wire.
