# ATM-SITE-88 — Bound Member Roots Resolve Through Const Object Literals

Tests that a locally bound member root (`const NS = { Panel: Div }`)
re-admits `<NS.Panel />` when the statically matched member value is an
admitted host tag, after which normal membership decides: the configured
`NSPanel` extracts as a host while the unconfigured `Other.Panel` twin is no
host and lowers under own as a component nobody traces (styling plan S3).
Declaration order never matters (the `Late` pair uses before declaring).
Opaque rebindings (`const Tabs = Other`) are never hosts — pinned by the
`test_shadowed_member_root_is_a_project_component_not_host` Rust unit test.
