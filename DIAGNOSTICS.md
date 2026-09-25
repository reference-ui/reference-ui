# DIAGNOSTICS — centralized, compiler-grade (intention, HQ 2026-09-24)

## Intention

Stop passing warning strings around. Build one structured
representation of a diagnostic plus the transport that carries it
from the native compiler to every consumer. Everything that can
possibly go wrong gets an error code. The system starts behaving
like a compiler instead of a string pipe.

The hard contract is small: an error code, plus a message. The
code is the thing — documentable, greppable, traceable down to
the source. That traceability is the whole return: every failure
carries its identity with it, so finding where it came from and
what it means gets way easier.

This is low-risk, high-return work: at its core it is documenting
what can go wrong, in a standard format, with the structure to back
it. That is very reference-ui.

## Shape (as briefed)

- **`reference-rs` top level** owns the diagnostics module: the
  template (the one diagnostic representation) plus the transport
  layer between the native compiler and anything that consumes it.
- **Every RS sub-module** (tasty, atomic, atlas, styletrace, typegen,
  …) gets its own diagnostics sub-module, rooted in the top-level
  one. All producers speak the same type.
- **`reference-neo`** owns a diagnostics module of its own — not
  buried in the CLI — that pulls/pushes that information; the CLI
  presents from it.

## Ownership: modules own messages, center owns machinery

- The template (shape), the transport, the registry index, and
  the shared render/suggestion utils live centrally.
- The words live per module. Only the producing module knows
  its language well enough to write good help and suggestions.
- The registry is centralized discoverability without
  centralized authorship: one index of all codes, each raised
  from exactly one module's table.

## Message format: rich text by pattern, not by law

The message is a canvas, not a schema. Producers decide what
presentation their diagnostic needs: emojis, unicode, newlines,
syntax highlighting, whatever makes it usable and nice. The
format is a pattern the codebase follows, not a strict type the
transport enforces. Each producer constructs its own version of
what its diagnostics look like — the only structural demands
are the code and the message itself.

The transport layer stays simple on purpose. It carries
code + message (+ whatever minimal envelope the boundary needs)
and nothing more. Strictness lives in exactly one place: the
error code is always present, always documented.

## Rendering layer (phase 2, queued — HQ 2026-09-24)

Identity first (this voyage), beauty next. The target is
rustc-grade rendering off the typed shape:

- source spans (byte offsets on the wire) with caret underlines
  and gutters, e.g. `src/Card.tsx:18:7` frames;
- labeled underlines plus `= help:` lines on the diagnostic;
- did-you-mean suggestions — only for "unknown X from a known
  set" codes (unknown property, unknown export, …), never forced;
- deterministic code-frame formatting, byte-identical per input;
- JSON diagnostics for agents off the same typed shape.

Shared utils (span type, frame renderer, suggestion helper)
live next to the template so producers get this rendering free
instead of hand-rolling it.

## Performance contract (law, not guidance — HQ 2026-09-24)

Diagnostics must never slow the build:

- The hot path records cheap facts only: code + severity +
  message + byte-offset span. No source reads, no line/column
  math, no candidate ranking inside the compile.
- All locating and rendering happens post-compile, neo-side,
  lazily, and only for diagnostics actually presented.
- Dedupe before render; cap full frames (first N get frames,
  the rest stay one-liners) so pathological runs can't explode.
- Proven with a clock: before/after timing on a real build,
  no ~300ms surprises.

## Dedupe is presentation, not cover (HQ 2026-09-24)

`dedupeDiagnostics` folds exact repeats (severity + code +
message + location) into `×N` groups, per channel. Because the
key includes the namespaced code, two modules cannot fold into
one line — cross-module overlap always renders as distinct
lines. Dedupe can only fold one producer repeating itself
(multi-entry/pass re-emission, locationless warnings). It dates
to the CLI-WARN era (codeless strings); in the coded era its job
is smaller and stays legitimate.

## Case index: every code is a findable repro (HQ 2026-09-24)

Every error code gets an indexed reference-neo case, code in
the name, reproducing it through the whole compiler — so
`agentneo search <CODE>` lands on the repro and agents (human
or otherwise) can audit the suite trivially.

## Testing philosophy: contracts asserted, style judged (HQ 2026-09-24)

- Automated and strict: emit conditions (code X fires under
  condition Y), code wire bytes, span offsets, message-contains
  key phrases. Wire pins are stable and renames break loudly.
- Agent-playtested, never golden: rendered frame quality. No
  byte snapshots of pretty output — they punish style
  improvement. Playtest agents run the indexed cases and judge
  human + JSON renderings against a rubric (shows where, shows
  what, suggests a fix where one exists, no noise), re-run
  whenever the renderer changes.

## Open design (needs thought)

- The code registry: an error code for everything that can go
  wrong, assigned deliberately, not grown by accident — plus the
  living document that lists what each code means and where it
  is raised.
- The message pattern: conventions and helpers for the rich-text
  canvas (what "good" looks like), without turning it into law.
- Transport details across the N-API boundary (Rust types → TS
  mirror) and how the Neo module consumes them — kept minimal.

## Relation to tonight's CLI work

CLI-WARN (landed) and CLI-DUMP (landed) unified the presentation
layer. CLI-TASTY (landed) routed the last untyped channel
(tasty-build warnings) into the one-liner + `--verbose`. That
routing is the seam this platform will later feed: the display
shape stays, the payloads grow codes. Symptom fix now, cure next,
no rework.

## Sequencing

Voyage V2 dispatched 2026-09-24 (12 agents: mapper →
foundations → neo module + CLI + harness → per-module aligners
tasty/atomic/atlas/styletrace/typegen → sweep → reviewers →
synthesis). Queued at landing: the rendering-layer crew
(span/label/help shape + transport → frame renderer +
suggestion utils → JSON output + contract tests → case indexing
of all code repros), then the semantic-overlap audit (pairwise:
no two codes double-report one condition), then a playtest pass
on the rendering. agent-rs quality gates apply to all Rust
throughout.
