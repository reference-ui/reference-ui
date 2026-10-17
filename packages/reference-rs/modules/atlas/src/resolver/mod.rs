//! Name resolution across the parsed module graph: which module a relative specifier names, which index file a
//! package exposes, how a props type name reaches its declaration through re-exports, and which component a JSX
//! tag names. Every entry point reads `ModuleInfo` values from the parser and never mutates them. The scope
//! structs bundle the module map, the package index map and the usage snapshot, so each resolver signature stays
//! within four parameters. Callers outside this directory see only the `pub(crate)` names re-exported below.

mod excludes;
mod exports;
mod occurrence;
mod packages;
mod paths;
mod template;
mod types;

use crate::internal::ModuleInfo;
use std::collections::HashMap;
use std::path::PathBuf;

pub(crate) use excludes::apply_excludes;
pub(crate) use exports::{collect_public_package_components, PublicPackageComponent};
pub(crate) use occurrence::{build_alias_map, resolve_occurrence_key, OccurrenceScope};
pub(crate) use packages::{
    collect_included_packages, collect_referenced_packages, is_local_component_module,
    resolve_package_index,
};
pub(crate) use template::build_component_template;

/// The module map and the package-to-index map that type and component resolution read together.
#[derive(Clone, Copy)]
pub(crate) struct TypeScope<'a> {
    pub(crate) modules: &'a HashMap<PathBuf, ModuleInfo>,
    pub(crate) package_indexes: &'a HashMap<String, PathBuf>,
}
