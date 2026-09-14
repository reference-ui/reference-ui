//! Core atom data structures and collections representing lowered CSS declarations.
//! Defines individual atomic utilities, deduplicated sets, and authored style intentions extracted from source code.
//! Serves as the intermediate representation between AST traversal and final stylesheet generation.

pub mod decl;
pub mod set;
pub mod value;
pub mod want;

#[cfg(test)]
mod tests;

pub use decl::Atom;
pub use set::AtomSet;
pub use value::AtomValue;
pub use want::Want;
