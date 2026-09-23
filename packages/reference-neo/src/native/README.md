# native

Native is the RS-cut seam: the request/result contract, the compile call,
the retention protocol, and the diagnostic discipline every native compile
shares. The recipe builds a request through the one builder, attaches the
live scan retention, drains it through the one compile call, and answers the
result through the shared diagnostics — sync shows the order, native owns
the protocol.

Seam table — which Rust surface each direction crosses:

| Direction | Surface | Notes |
|---|---|---|
| Neo → Rust | frozen compile request | six keys; retention token or in-memory files carry the scan |
| Rust → Neo | compiled bundle | stylesheet, portable sheet, runtime artifact, diagnostics |
| Rust → Neo | traced hosts | StyleTrace discovery joins the roster at publish |
| Neo → Rust | retention release | error-path-only; never on the happy path |

The generated shelf holds committed codegen from Rust: vendored
declaration closures the package typechecks against without touching
reference-rs. Each shelf directory names its source and regen story;
placeholders say what they wait for and never fake generatedness.

NOT-owns: fragment discovery and evaluation (collect owns the scan
product), the portable system (system/base joins what the compile
returns), writes to disk (the packager leg owns every write), and every
other Rust import that is not the scan/compile/retention cut.
