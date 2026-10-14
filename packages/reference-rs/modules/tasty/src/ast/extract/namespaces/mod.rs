//! Namespace blocks and import-equals aliases. A `declare namespace N { … }` member `M` is a symbol named `N.M`, emitted when an
//! alias or an export names it, so a file whose namespaces nothing names keeps its manifest. `import X = <entity>` expands to
//! its target text while lowering, and the expanded name resolves through the same lookups a written qualified name uses.
//! `import X = require('m')` stays unsupported: it names a module object, which tasty does not model.

mod expand;
mod members;
mod table;

pub(super) use expand::expand_alias;
pub(super) use members::NamespaceView;
pub(super) use table::{collect_namespace_table, entity_target};
