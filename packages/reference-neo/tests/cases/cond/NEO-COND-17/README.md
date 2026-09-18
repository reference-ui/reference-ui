# NEO-COND-17 — `'&:not(:first-child), :only-child'` scopes the bare member to the class

The world calls `css()` with a base ink color plus a comma key whose
second member has no `&`, on a host that is not its parent's first
child and holds one child. The spec checks the sheet carries a base
utility plus one comma utility whose class appears on both selectors
(`.<cls>:not(:first-child), .<cls> :only-child`, never a bare
`, :only-child`), and the host paints brand, its only-child paints
brand, while an only-child outside the class and the first-child
control stay ink — so the bare member paints only under the class.

Evidence: `[atm]` ATM-COND-23 (SPEC-V2-68); `[panda-v2]`
`vendor/panda/crates/pandacss_stylesheet/tests/nested_selector_parity.rs:642`
`nested_comma_group_scopes_member_without_ampersand`.

> Search terms: comma member scoping, bare member, selector list scoping, only-child leak, descendant scoping, selectors/comma, conditions/nesting, NEO-COND-09
