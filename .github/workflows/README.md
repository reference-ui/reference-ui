# Workflows

One file per CI gate: consumer smoke, docs deploy, native compile and
test, vendor pins, and security scanning. Each workflow declares its
own triggers and toolchain; shared conventions are pin versions, cache
cargo and pnpm stores, and fail loud with actionable logs.
