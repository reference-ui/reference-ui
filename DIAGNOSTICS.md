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
layer. CLI-TASTY (in flight) routes the last untyped channel
(tasty-build warnings) into the one-liner + `--verbose`. That
routing is the seam this platform will later feed: the display
shape stays, the payloads grow codes. Symptom fix now, cure next,
no rework.

## Sequencing

Queued, not dispatched. After the tasty fold lands, the session
closes. When HQ calls it, run as a voyage-scale objective:
cartographer first (inventory every diagnostic producer and
consumer on both sides of the N-API boundary), then scoped
implementers (RS template + transport → sub-module roots → Neo
module → CLI presentation), reviewers per scope. agent-rs quality
gates apply to all Rust.
