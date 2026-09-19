//! ModuleRecord collection: edges, shapes, stars, defaults, declared names.
//!
//! Pins `ModuleRecord::collect` over parsed fixtures: named, default, and
//! namespace import edges; local, hop, star, and default exports; the
//! declared-name set the walk consults; and the type-only and `export * as`
//! shapes that stay out. Ends with the lifted never-panics fuzz over
//! arbitrary source text.

mod common;

use module_graph::{DefaultExport, ExportShape, Imported};
use proptest::prelude::*;

#[test]
fn named_default_and_namespace_imports_become_edges() {
    let record = common::collect(
        "import { brand as primary, gap } from './tokens';\nimport d from './d';\nimport * as ns from './ns';\nimport './side';",
    );
    assert_eq!(record.imports.len(), 4);
    assert!(record.imports.contains(&module_graph::ImportEdge {
        local: "primary".into(),
        imported: Imported::Named("brand".into()),
        specifier: "./tokens".into(),
    }));
    assert!(record.imports.contains(&module_graph::ImportEdge {
        local: "d".into(),
        imported: Imported::Default,
        specifier: "./d".into(),
    }));
    assert!(record.imports.contains(&module_graph::ImportEdge {
        local: "ns".into(),
        imported: Imported::Namespace,
        specifier: "./ns".into(),
    }));
    assert!(record.import_edge("primary").is_some());
    assert!(record.import_edge("side").is_none());
}

#[test]
fn type_only_imports_stay_out() {
    let record =
        common::collect("import type { Theme } from './t';\nimport { type A, b } from './u';");
    assert_eq!(record.imports.len(), 1);
    assert_eq!(
        record
            .import_edge("b")
            .map(|edge| &edge.specifier)
            .map(String::as_str),
        Some("./u")
    );
    assert!(record.import_edge("Theme").is_none());
    assert!(record.import_edge("A").is_none());
}

#[test]
fn declarations_and_local_specifiers_are_local() {
    let record = common::collect(
        "export const brand = 'red';\nexport function getColor() { return 'r'; }\nexport class Card {}\nconst gap = '4px', [a, {b}] = x;\nexport { gap, gap as space, a, b };",
    );
    assert_eq!(
        record.exports.get("brand"),
        Some(&ExportShape::Local("brand".into()))
    );
    assert_eq!(
        record.exports.get("getColor"),
        Some(&ExportShape::Local("getColor".into()))
    );
    assert_eq!(
        record.exports.get("Card"),
        Some(&ExportShape::Local("Card".into()))
    );
    assert_eq!(
        record.exports.get("space"),
        Some(&ExportShape::Local("gap".into()))
    );
    assert_eq!(
        record.exports.get("a"),
        Some(&ExportShape::Local("a".into()))
    );
    assert_eq!(
        record.exports.get("b"),
        Some(&ExportShape::Local("b".into()))
    );
    assert_eq!(record.exports.get("missing"), None);
}

#[test]
fn export_from_is_a_hop_with_specifier() {
    let record = common::collect(
        "export { brand } from './tokens';\nexport { gap as space } from './barrel';",
    );
    assert_eq!(
        record.exports.get("brand"),
        Some(&ExportShape::Hop {
            imported: "brand".into(),
            specifier: "./tokens".into(),
        })
    );
    assert_eq!(
        record.exports.get("space"),
        Some(&ExportShape::Hop {
            imported: "gap".into(),
            specifier: "./barrel".into(),
        })
    );
}

#[test]
fn type_only_exports_stay_out() {
    let record = common::collect(
        "export type { Theme };\nexport type * from './t';\nconst x = 1;\nexport { type x as y };",
    );
    assert!(record.exports.get("Theme").is_none());
    assert!(record.exports.get("y").is_none());
    assert!(record.exports.stars().is_empty());
}

#[test]
fn stars_record_sources_in_order() {
    let record = common::collect("export * from './a';\nexport * from './b';");
    assert_eq!(
        record.exports.stars(),
        &["./a".to_string(), "./b".to_string()]
    );
}

#[test]
fn export_star_as_has_no_member_shape() {
    let record = common::collect("export * as ns from './a';");
    assert!(record.exports.stars().is_empty());
    assert!(record.exports.get("ns").is_none());
    assert!(record.exports.names().is_empty());
}

#[test]
fn default_exports_bind_locals_hops_or_anonymous() {
    let named = common::collect("export default function theme() {}");
    assert_eq!(
        named.exports.default_export(),
        Some(&DefaultExport::Local("theme".into()))
    );
    assert!(named.declares("theme"));

    let anon = common::collect("export default () => 1;");
    assert_eq!(
        anon.exports.default_export(),
        Some(&DefaultExport::Anonymous)
    );

    let ident = common::collect("const t = 1;\nexport default t;");
    assert_eq!(
        ident.exports.default_export(),
        Some(&DefaultExport::Local("t".into()))
    );

    let aliased = common::collect("const x = 1;\nexport { x as default };");
    assert_eq!(
        aliased.exports.default_export(),
        Some(&DefaultExport::Local("x".into()))
    );

    let hop = common::collect("export { x as default } from './tokens';");
    assert_eq!(
        hop.exports.default_export(),
        Some(&DefaultExport::Hop {
            imported: "x".into(),
            specifier: "./tokens".into(),
        })
    );

    let redefault = common::collect("export { default } from './tokens';");
    assert_eq!(
        redefault.exports.default_export(),
        Some(&DefaultExport::Hop {
            imported: "default".into(),
            specifier: "./tokens".into(),
        })
    );
    assert!(redefault.exports.names().is_empty());
}

#[test]
fn declared_names_cover_top_level_forms_but_not_imports() {
    let record = common::collect(
        "import { x } from './x';\nconst a = 1; let { b } = y;\nfunction f() {}\nclass C {}\nenum E { A }\ntype T = number;\ninterface I {}\nexport default function g() {}",
    );
    for name in ["a", "b", "f", "C", "E", "T", "I", "g"] {
        assert!(record.declares(name), "{name} declares");
    }
    assert!(!record.declares("x"));
    assert!(!record.declares("missing"));
}

#[test]
fn string_literal_export_names_read_through() {
    let record = common::collect("const x = 1;\nexport { x as 'weird-name' };");
    assert_eq!(
        record.exports.get("weird-name"),
        Some(&ExportShape::Local("x".into()))
    );
}

proptest! {
    #![proptest_config(ProptestConfig::with_cases(128))]

    #[test]
    fn collect_never_panics(source in "[\\s\\S]{0,2048}") {
        let allocator = oxc_allocator::Allocator::default();
        let ret = oxc_parser::Parser::new(&allocator, &source, oxc_span::SourceType::ts()).parse();
        let _ = module_graph::ModuleRecord::collect(&ret.program);
    }
}
