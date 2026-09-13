//! Recursive leaf literal collector and AST expression walkers.
//!
//! Exposes structured traversal contexts (`LeafWalk`, `ObjectWalk`) and entry points
//! for descending into style objects, ternaries, and JSX attributes to collect atomic `Want`s.

pub mod literal;
pub mod object;
pub mod walk;

pub use object::{walk_style_object, ObjectWalk};
pub use walk::{walk_expression, LeafWalk};
