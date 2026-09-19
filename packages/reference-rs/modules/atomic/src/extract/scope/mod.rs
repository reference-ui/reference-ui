//! Scope-aware identifier resolution for style extraction (SPEC-V2-75).
//! Replaces the project-wide name bag for locals: each file collects its
//! bindings into a `ScopeTable`, and `handle_identifier_fallback` resolves
//! through the `ScopeChain` from the use-site scope outward. Params and
//! inner declarators shadow outer and cross-file consts; imported and
//! genuinely unbound names fall through to the `ImportLookup` stub, which
//! answers from the merged bag until SPEC-V2-76 lands the binding walk.

mod binding;
mod collect;
mod destructure;
mod init;
mod lookup;
mod spreads;
mod table;
mod types;
mod value;

pub use binding::{Binding, BindingInit, BindingKind, ImportRef};
pub use collect::collect;
pub use lookup::{ImportLookup, Lookup, ScopeChain, Scoped};
pub use table::{ScopeId, ScopeTable, ROOT_SCOPE};
