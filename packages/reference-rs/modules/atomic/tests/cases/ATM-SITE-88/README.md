# ATM-SITE-88: Bound Member Roots Resolve Through Const Object Literals

Tests that a locally bound member root (`const NS = { Panel: Div }`)
re-admits `<NS.Panel />` when the statically matched member value is an
admitted host tag, after which normal membership decides: the configured
`NSPanel` extracts while the unconfigured `Other.Panel` twin stays silent.
Declaration order never matters (the `Late` pair uses before declaring).
Opaque rebindings (`const Tabs = Other`) stay silent — pinned by the
`test_shadowed_member_root_is_not_an_extract_site` Rust unit test.
