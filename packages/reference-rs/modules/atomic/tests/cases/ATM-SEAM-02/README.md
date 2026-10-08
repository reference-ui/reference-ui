# ATM-SEAM-02

`compile()` accepts the frozen `NativeCompileRequest` (`schemaVersion`, `spec`, `jsxHosts`, `sourceRoot`, `declarationRoot`, `include?`) and emits the same CSS as the legacy `{ baseSystem, rootDir }` shape for the same spec; `jsxHosts` admits configured hosts without a file-local import while the legacy shape still compiles.
Contract: [SPEC.md](../../../SPEC.md).
