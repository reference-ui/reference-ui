# ATM-SEAM-02 — Frozen request parity

`compile()` accepts the frozen `NativeCompileRequest` (`schemaVersion`, `spec`, `jsxHosts`, `sourceRoot`, `declarationRoot`, `include?`) and emits the same CSS as the legacy `{ baseSystem, rootDir }` shape for the same spec; `jsxHosts` admits configured hosts without a file-local import while the legacy shape still compiles. Unconfigured, the same unbound tag lowers under own as a component nobody publishes (styling plan S3), so admitting it changes no byte of the sheet.
Contract: SPEC.
