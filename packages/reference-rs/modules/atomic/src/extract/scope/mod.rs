//! Scope-aware identifier resolution for style extraction (SPEC-V2-75).
//! Replaces the project-wide name bag for locals: each file collects its
//! bindings into a `ScopeTable`, and identifier uses resolve through the
//! `ScopeChain` from the use-site scope outward. Params and inner declarators
//! shadow outer and cross-file consts; imported names answer from the
//! resolver's per-file map only, while genuinely unbound names still consult
//! the bag (SPEC-V2-76 lands the walk; siblings retire it).

mod binding;
mod call_init;
mod collect;
mod destructure;
mod fill;
mod init;
mod lookup;
mod spreads;
mod table;
mod types;
mod value;

pub use binding::{Binding, BindingInit, BindingKind, ImportRef};
pub use collect::collect;
pub(crate) use collect::collect_with;
pub(crate) use fill::{OriginFill, SpreadResidue};
pub use lookup::{ImportLookup, Lookup, ScopeChain, Scoped};
pub use table::{ScopeId, ScopeTable, ROOT_SCOPE};
