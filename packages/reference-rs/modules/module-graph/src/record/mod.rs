//! One file's module shape: what it imports, exports, and declares.
//!
//! [`ModuleRecord::collect`] walks a consumer-parsed [`Program`] once and
//! records every value import edge, the [`ExportTable`], and the top-level
//! declared names the walk needs to tell `export { x }` of a local from
//! `export { x }` of an import. Type-only edges stay out, as does
//! `export * as ns`, which has no member shape. The graph never owns an AST:
//! lifetimes stay with the consumer that parsed.

mod collect;

use std::collections::{BTreeMap, BTreeSet};

use oxc_ast::ast::Program;

/// What one import specifier takes from its target file.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Imported {
    /// `import { brand }`: the exported name in the target file.
    Named(String),
    /// `import theme from`: the target's default export.
    Default,
    /// `import * as tokens from`: the whole target namespace.
    Namespace,
}

/// One value import edge carried by a file.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ImportEdge {
    /// The name bound in this file.
    pub local: String,
    /// What the edge takes from the target.
    pub imported: Imported,
    /// The specifier as authored.
    pub specifier: String,
}

/// One named export: a local declaration or one hop to another file.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ExportShape {
    /// `export const brand`, `export { gap as space }`: this file's name.
    Local(String),
    /// `export { gap as space } from './tokens'`: the target name plus the
    /// specifier of the file that declares it.
    Hop {
        /// The name in the target file.
        imported: String,
        /// The specifier as authored.
        specifier: String,
    },
}

/// The default export: a local binding, a hop, or an anonymous value.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DefaultExport {
    /// `export default theme`, `export { x as default }`: this file's name.
    Local(String),
    /// `export { x as default } from './tokens'`: the target name plus the
    /// specifier of the file that declares it.
    Hop {
        /// The name in the target file.
        imported: String,
        /// The specifier as authored.
        specifier: String,
    },
    /// `export default () => …`: a default with no binding to name.
    Anonymous,
}

/// What one file exports: named shapes, star sources, and the default.
#[derive(Debug, Clone, Default)]
pub struct ExportTable {
    entries: BTreeMap<String, ExportShape>,
    stars: Vec<String>,
    default: Option<DefaultExport>,
}

impl ExportTable {
    /// The shape behind an exported name, if this file exports it.
    pub fn get(&self, exported: &str) -> Option<&ExportShape> {
        self.entries.get(exported)
    }

    /// Every explicitly exported name, in order. Never includes `default`.
    pub fn names(&self) -> Vec<String> {
        self.entries.keys().cloned().collect()
    }

    /// The `export * from` specifiers, in source order.
    pub fn stars(&self) -> &[String] {
        &self.stars
    }

    /// The default export, if this file has one.
    pub fn default_export(&self) -> Option<&DefaultExport> {
        self.default.as_ref()
    }

    /// Insert one exported name, with `default` landing in the default slot.
    pub(crate) fn insert_exported(&mut self, exported: &str, shape: ExportShape) {
        if exported != "default" {
            self.entries.insert(exported.to_string(), shape);
            return;
        }
        self.default = Some(match shape {
            ExportShape::Local(local) => DefaultExport::Local(local),
            ExportShape::Hop {
                imported,
                specifier,
            } => DefaultExport::Hop {
                imported,
                specifier,
            },
        });
    }

    /// Bind one local name to itself in the export table.
    pub(crate) fn insert_local(&mut self, name: &str) {
        self.entries
            .insert(name.to_string(), ExportShape::Local(name.to_string()));
    }

    /// Set the default export.
    pub(crate) fn set_default(&mut self, default: DefaultExport) {
        self.default = Some(default);
    }

    /// Push one `export * from` source, in source order.
    pub(crate) fn push_star(&mut self, specifier: &str) {
        self.stars.push(specifier.to_string());
    }
}

/// One file's imports, exports, and declared names.
#[derive(Debug, Clone, Default)]
pub struct ModuleRecord {
    /// Value import edges in source order.
    pub imports: Vec<ImportEdge>,
    /// The file's export table.
    pub exports: ExportTable,
    /// Top-level declared names: vars, functions, classes, enums, aliases.
    /// Imported names are not declared.
    pub declared: BTreeSet<String>,
}

impl ModuleRecord {
    /// Collect one file's record from its parsed program.
    pub fn collect(program: &Program<'_>) -> Self {
        let mut record = Self::default();
        for statement in &program.body {
            collect::statement(&mut record, statement);
        }
        record
    }

    /// The import edge behind a local name, if this file imports it.
    pub fn import_edge(&self, local: &str) -> Option<&ImportEdge> {
        self.imports.iter().find(|edge| edge.local == local)
    }

    /// True when the file declares `name` at the top level.
    pub fn declares(&self, name: &str) -> bool {
        self.declared.contains(name)
    }
}
