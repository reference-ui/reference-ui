//! Compound-member aliases seen through barrel re-exports: `export *`, named and renamed namespace re-exports, import-then-export, and `export * as`.
//! Re-emitted hosts follow the barrel export name, and a rename remaps the host prefix.
//! The tabs fixture from `member_alias` supplies the origin namespace.

use super::member_alias::{binding_names, trace_scratch, TABS_TSX};

const BARREL_STAR_TSX: &str = "export * from './tabs'\n";

const BARREL_NAMED_TSX: &str = "export { Tabs } from './tabs'\n";

const BARREL_RENAMED_TSX: &str = "export { Tabs as Accordion } from './tabs'\n";

const BARREL_IMPORT_EXPORT_TSX: &str =
    concat!("import { Tabs } from './tabs'\n", "export { Tabs }\n",);

const BARREL_STAR_AS_TSX: &str = "export * as Accordion from './tabs'\n";

#[test]
fn export_star_barrel_reemits_member_aliases() {
    let outcome = trace_scratch(
        "member-alias-barrel-star",
        &[("barrel.tsx", BARREL_STAR_TSX), ("tabs.tsx", TABS_TSX)],
        "barrel.tsx",
    );

    assert_eq!(
        binding_names(&outcome),
        vec![
            "Item".to_string(),
            "Panel".to_string(),
            "Tabs.Item".to_string(),
            "Tabs.Panel".to_string(),
        ]
    );
}

#[test]
fn named_namespace_reexport_reemits_member_aliases() {
    let outcome = trace_scratch(
        "member-alias-barrel-named",
        &[("barrel.tsx", BARREL_NAMED_TSX), ("tabs.tsx", TABS_TSX)],
        "barrel.tsx",
    );

    assert_eq!(
        binding_names(&outcome),
        vec!["Tabs.Item".to_string(), "Tabs.Panel".to_string(),]
    );
}

#[test]
fn renamed_namespace_reexport_remaps_member_hosts() {
    let outcome = trace_scratch(
        "member-alias-barrel-renamed",
        &[("barrel.tsx", BARREL_RENAMED_TSX), ("tabs.tsx", TABS_TSX)],
        "barrel.tsx",
    );

    assert_eq!(
        binding_names(&outcome),
        vec!["Accordion.Item".to_string(), "Accordion.Panel".to_string(),]
    );
}

#[test]
fn import_then_export_namespace_reemits_member_aliases() {
    let outcome = trace_scratch(
        "member-alias-barrel-import-export",
        &[
            ("barrel.tsx", BARREL_IMPORT_EXPORT_TSX),
            ("tabs.tsx", TABS_TSX),
        ],
        "barrel.tsx",
    );

    assert_eq!(
        binding_names(&outcome),
        vec!["Tabs.Item".to_string(), "Tabs.Panel".to_string(),]
    );
}

#[test]
fn export_star_as_mints_namespaced_hosts() {
    // `export * as Accordion` exposes each name the origin exposes under `Accordion.`: the origin's
    // exported Panel and Item, and its compound hosts Tabs.Panel and Tabs.Item. The Plain member
    // exposes no StyleProps, and the origin is not an entry, so no bare spelling leaks.
    let outcome = trace_scratch(
        "member-alias-barrel-star-as",
        &[("barrel.tsx", BARREL_STAR_AS_TSX), ("tabs.tsx", TABS_TSX)],
        "barrel.tsx",
    );

    assert_eq!(
        binding_names(&outcome),
        vec![
            "Accordion.Item".to_string(),
            "Accordion.Panel".to_string(),
            "Accordion.Tabs.Item".to_string(),
            "Accordion.Tabs.Panel".to_string(),
        ]
    );
}
