# ATM-SITE-36 — callee identity and drop micros

Overmatch station-only (SPEC-V2-37): a block-scoped `const css`, the bare
namespace call, and off-allowlist namespace methods skip silently (pin the
silence — non-sites bind nothing); self-init, const cycles, no-init
`let`, bare uncalled functions, and missing members warn once each with
siblings kept. Fail-closed mechanics, pinned per shape.

Panda: `calls.rs:965` (namespace outside allowlist), bare-namespace `:981`,
block-shadow `scope.rs:720`, cycle `:832`, no-init `:1403`, missing member
`scope.rs:305`.
