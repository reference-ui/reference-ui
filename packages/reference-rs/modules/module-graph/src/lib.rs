//! Shared module graph: one specifier ladder, one module record, one origin walk.
//!
//! Three compilers (atomic, tasty, styletrace) each carried a copy of the same
//! ladder from an import specifier to a file, plus their own export fan-out.
//! This crate owns that shared half only: [`ModuleKey`] path identity,
//! [`FileSystem`] IO (`DiskFs`, `MemoryFs`), [`SpecifierLadder`] resolution,
//! [`ModuleRecord`] import/export shapes collected from a consumer-parsed
//! [`Program`](oxc_ast::ast::Program), demand-driven [`ModuleGraph`] loading,
//! and [`BindingWalk`] origin resolution with [`Refused`] as data. Values,
//! types, hosts, and diagnostic wording stay with the consumers.

mod fs;
mod graph;
mod key;
pub mod ladder;
mod record;
mod walk;

pub use fs::{DiskFs, FileSystem, MemoryFs};
pub use graph::{Loader, ModuleGraph};
pub use key::ModuleKey;
pub use ladder::{ExtensionPolicy, ProbeMemo, SpecifierLadder, TsconfigPolicy, Unresolved};
pub use record::{DefaultExport, ExportShape, ExportTable, ImportEdge, Imported, ModuleRecord};
pub use walk::{BindingOrigin, BindingWalk, Refused};
