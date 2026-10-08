# diagnostics — the standalone diagnostic module above the cut

One typed vocabulary for everything the engine can report, plus the
transport that carries it from the native compiler to every consumer.
Producers mint `NS-SEV-NAME` codes under their own namespace; the module
validates shape at parse time and stays shape-open so newer codes keep
reading. The only structural demands are the code and a non-blank message;
the message itself is a rich-text canvas each producer styles.

Two forms share the module while the platform lands. Typed diagnostics
carry warn/err severity plus a matching code and fail closed at every
boundary; the pull/push transport encodes and decodes them as JSON across
the native cut. Legacy carries — info telemetry and codeless stragglers —
ride the same channels untouched, partitioned from typed rows without ever
blocking them. The tasty ref channel is fully typed since its adoption.

Presentation collapses three channels into one report. Userspace warnings,
the opt-in compiler backchannel, and the reference tasty phase each pull
through the transport and report through the same shapes: a one-line yellow
count by default, the deduped location-plus-code-plus-hint list under
verbose, silence at zero. Errors throw with their codes and locations
instead of printing. The CLI owns no diagnostic logic of its own; it
presents from this module and re-exports the shapes its pins assert.

Every error code earns one repro test that drives a minimal world through
the whole compiler and asserts the code with its severity. The repro suite
is the living side of the code registry: add the row when you mint the
code, and the suite fails loudly if the fixture ever stops reproducing it.

Agents read the same rows as canonical JSON. `formatJsonDiagnostics`
renders the reported set as one array on one line — typed rows in template
field order, legacy carries verbatim, no dedupe, channels concatenated
userspace, compiler, ref — and `ref sync --json` prints exactly that array
to stdout. The wire shape, its canonical order, and its examples live in
the template's `SCHEMA.md`; the `json.test.ts` contract pins the bytes, so
any drift between the schema, the encoders, and the CLI fails loudly.
