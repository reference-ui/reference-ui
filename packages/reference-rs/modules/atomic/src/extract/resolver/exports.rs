//! Per-file export and import shapes for the binding walk (SPEC-V2-76).
//! One pass over a parsed program records what each file exports — declared
//! names, local re-exports, and `export … from` hops — plus the named imports
//! each file carries so `import { x }` followed by `export { x }` follows the
//! same edge as `export { x } from`. Values stay in the per-file constant bag;
//! this table only maps exported names to where they are declared. `export *`
//! and `export default` are out of the crew-B slice and stay unresolved.

use std::collections::BTreeMap;

use oxc_ast::ast::{
    Declaration, ExportNamedDeclaration, ImportDeclaration, ImportDeclarationSpecifier,
    ImportOrExportKind, Program,
};
use oxc_ast_visit::{walk, Visit};

use super::super::bindings::imported_name;
use super::patterns::pattern_names;

/// One exported name: a local declaration or one hop to another file.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ExportShape {
    /// `export const brand`, `export { brand }`, `export { b as brand }` —
    /// the declared name in this file.
    Local(String),
    /// `export { gap as space } from './barrel'` — the imported name plus
    /// the specifier of the file that declares it.
    Hop {
        /// The name in the target file (`gap` above).
        imported: String,
        /// The specifier as authored (`./barrel` above).
        specifier: String,
    },
}

/// What one file exports, keyed by exported name.
#[derive(Debug, Clone, Default)]
pub struct ExportTable {
    entries: BTreeMap<String, ExportShape>,
}

impl ExportTable {
    /// The shape behind an exported name, if this file exports it.
    pub fn get(&self, exported: &str) -> Option<&ExportShape> {
        self.entries.get(exported)
    }
}

/// One named import edge carried by a file.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ImportEdge {
    /// The exported name in the target file.
    pub imported: String,
    /// The specifier as authored.
    pub specifier: String,
}

/// What one file imports, keyed by local name. Lets `export { x }` of an
/// imported `x` follow the import edge instead of dying as a missing local.
#[derive(Debug, Clone, Default)]
pub struct ImportMap {
    edges: BTreeMap<String, ImportEdge>,
}

impl ImportMap {
    /// The import edge behind a local name, if this file imports it.
    pub fn get(&self, local: &str) -> Option<&ImportEdge> {
        self.edges.get(local)
    }

    /// Every import edge of the file, in local-name order, for the
    /// externals loader's referenced-target sweep.
    pub fn all_edges(&self) -> Vec<&ImportEdge> {
        self.edges.values().collect()
    }
}

/// Collect one file's export table and import map in a single walk.
pub fn collect_file(program: &Program<'_>) -> (ExportTable, ImportMap) {
    // barrel.ts:  export { brand } from './tokens'
    // app.tsx:    import { brand as primary } from './barrel'
    let mut collector = ShapeCollector::default();
    collector.visit_program(program);
    (
        ExportTable {
            entries: collector.exports,
        },
        ImportMap {
            edges: collector.imports,
        },
    )
}

/// Visitor recording export shapes and named-import edges.
#[derive(Default)]
struct ShapeCollector {
    exports: BTreeMap<String, ExportShape>,
    imports: BTreeMap<String, ImportEdge>,
}

impl<'a> Visit<'a> for ShapeCollector {
    fn visit_export_named_declaration(&mut self, decl: &ExportNamedDeclaration<'a>) {
        record_export(self, decl);
        walk::walk_export_named_declaration(self, decl);
    }

    fn visit_import_declaration(&mut self, decl: &ImportDeclaration<'a>) {
        record_import_edges(self, decl);
        walk::walk_import_declaration(self, decl);
    }
}

/// Record one `export …` declaration, skipping type-only exports.
fn record_export(collector: &mut ShapeCollector, decl: &ExportNamedDeclaration<'_>) {
    if decl.export_kind == ImportOrExportKind::Type {
        return;
    }
    if let Some(declaration) = &decl.declaration {
        record_export_declaration(collector, declaration);
        return;
    }
    match &decl.source {
        Some(source) => record_export_from(collector, decl, source.value.as_str()),
        None => record_export_local(collector, decl),
    }
}

/// Record `export const x`, `export function f`, `export class C`.
fn record_export_declaration(collector: &mut ShapeCollector, declaration: &Declaration<'_>) {
    match declaration {
        Declaration::VariableDeclaration(var) => record_var_export(collector, var),
        Declaration::FunctionDeclaration(func) => record_fn_export(collector, func),
        Declaration::ClassDeclaration(class) => record_class_export(collector, class),
        _ => {}
    }
}

/// Record a named function export; anonymous defaults stay out.
fn record_fn_export(collector: &mut ShapeCollector, func: &oxc_ast::ast::Function<'_>) {
    if let Some(id) = &func.id {
        // export function getColor()  — local, valueless in the bag
        insert_local(collector, id.name.as_str());
    }
}

/// Record a named class export.
fn record_class_export(collector: &mut ShapeCollector, class: &oxc_ast::ast::Class<'_>) {
    if let Some(id) = &class.id {
        insert_local(collector, id.name.as_str());
    }
}

/// Record every name a variable declaration exports.
fn record_var_export(
    collector: &mut ShapeCollector,
    var: &oxc_ast::ast::VariableDeclaration<'_>,
) {
    for declarator in &var.declarations {
        for name in pattern_names(&declarator.id) {
            // export const brand = 'red'  — `brand` is local
            collector
                .exports
                .insert(name.clone(), ExportShape::Local(name));
        }
    }
}

/// Bind one local name to itself in the export table.
fn insert_local(collector: &mut ShapeCollector, name: &str) {
    collector
        .exports
        .insert(name.to_string(), ExportShape::Local(name.to_string()));
}

/// Record `export { a, b as c }` — local names under exported names.
fn record_export_local(collector: &mut ShapeCollector, decl: &ExportNamedDeclaration<'_>) {
    for spec in &decl.specifiers {
        if spec.export_kind == ImportOrExportKind::Type {
            continue;
        }
        // export { gap as space }  — `space` reads local `gap`
        let local = imported_name(&spec.local);
        let exported = imported_name(&spec.exported);
        collector
            .exports
            .insert(exported, ExportShape::Local(local));
    }
}

/// Record `export { a, b as c } from './x'` — one hop per specifier.
fn record_export_from(
    collector: &mut ShapeCollector,
    decl: &ExportNamedDeclaration<'_>,
    specifier: &str,
) {
    for spec in &decl.specifiers {
        if spec.export_kind == ImportOrExportKind::Type {
            continue;
        }
        // export { gap as space } from './barrel'
        let imported = imported_name(&spec.local);
        let exported = imported_name(&spec.exported);
        collector.exports.insert(
            exported,
            ExportShape::Hop {
                imported,
                specifier: specifier.to_string(),
            },
        );
    }
}

/// Record the named value imports of one import declaration.
fn record_import_edges(collector: &mut ShapeCollector, decl: &ImportDeclaration<'_>) {
    if decl.import_kind == ImportOrExportKind::Type {
        return;
    }
    let Some(specifiers) = &decl.specifiers else {
        return;
    };
    for spec in specifiers {
        let ImportDeclarationSpecifier::ImportSpecifier(named) = spec else {
            continue;
        };
        if named.import_kind == ImportOrExportKind::Type {
            continue;
        }
        // import { brand as primary } from './tokens'
        collector.imports.insert(
            named.local.name.to_string(),
            ImportEdge {
                imported: imported_name(&named.imported),
                specifier: decl.source.value.to_string(),
            },
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use oxc_allocator::Allocator;
    use oxc_parser::Parser;
    use oxc_span::SourceType;

    /// Collect one module's shapes, asserting it parses cleanly.
    fn shapes(source: &str) -> (ExportTable, ImportMap) {
        let allocator = Allocator::default();
        let source_type = SourceType::ts();
        let ret = Parser::new(&allocator, source, source_type).parse();
        assert!(!ret.panicked, "fixture parses: {source}");
        collect_file(&ret.program)
    }

    #[test]
    fn declarations_and_local_specifiers_are_local() {
        let (exports, _) = shapes(
            "export const brand = 'red';\nexport function getColor() { return 'r'; }\nconst gap = '4px';\nexport { gap, gap as space };",
        );
        assert_eq!(
            exports.get("brand"),
            Some(&ExportShape::Local("brand".to_string()))
        );
        assert_eq!(
            exports.get("getColor"),
            Some(&ExportShape::Local("getColor".to_string()))
        );
        assert_eq!(
            exports.get("gap"),
            Some(&ExportShape::Local("gap".to_string()))
        );
        assert_eq!(
            exports.get("space"),
            Some(&ExportShape::Local("gap".to_string()))
        );
        assert_eq!(exports.get("missing"), None);
    }

    #[test]
    fn export_from_is_a_hop_with_specifier() {
        let (exports, _) = shapes(
            "export { brand } from './tokens';\nexport { gap as space } from './barrel';",
        );
        assert_eq!(
            exports.get("brand"),
            Some(&ExportShape::Hop {
                imported: "brand".to_string(),
                specifier: "./tokens".to_string(),
            })
        );
        assert_eq!(
            exports.get("space"),
            Some(&ExportShape::Hop {
                imported: "gap".to_string(),
                specifier: "./barrel".to_string(),
            })
        );
    }

    #[test]
    fn type_only_and_default_exports_stay_out() {
        let (exports, _) = shapes(
            "export type { Theme };\nexport default function css() {}\nconst x = 1;\nexport { type x as y };",
        );
        assert_eq!(exports.get("Theme"), None);
        assert_eq!(exports.get("default"), None);
        assert_eq!(exports.get("y"), None);
    }

    #[test]
    fn named_value_imports_map_local_to_edge() {
        let (_, imports) = shapes(
            "import { brand as primary, gap } from './tokens';\nimport type { Theme } from './t';\nimport d from './d';\nimport * as ns from './ns';",
        );
        assert_eq!(
            imports.get("primary"),
            Some(&ImportEdge {
                imported: "brand".to_string(),
                specifier: "./tokens".to_string(),
            })
        );
        assert_eq!(
            imports.get("gap"),
            Some(&ImportEdge {
                imported: "gap".to_string(),
                specifier: "./tokens".to_string(),
            })
        );
        assert_eq!(imports.get("Theme"), None);
        assert_eq!(imports.get("d"), None);
        assert_eq!(imports.get("ns"), None);
        assert_eq!(imports.all_edges().len(), 2);
    }
}
