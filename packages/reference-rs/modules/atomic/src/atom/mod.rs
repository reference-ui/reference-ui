//! Core atom data structures and collections representing lowered CSS declarations.
//! Defines individual atomic utilities (`Atom` with emittable `CssValue` and `When`),
//! deduplicated sets, and authored style intentions (`Want` with `AtomValue` and string `when`).
//! Resolve is the boundary: authored condition strings become `When`. Serves as the
//! intermediate representation between AST traversal and final stylesheet generation.

pub mod decl;
pub mod set;
pub mod value;
pub mod want;
pub mod when;

#[cfg(test)]
mod tests;

pub use decl::Atom;
pub use set::AtomSet;
pub use value::{AtomValue, CssValue};
pub use want::Want;
pub use when::{When, WhenKind};
