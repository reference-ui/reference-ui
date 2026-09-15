//! Style-expression walkers that collect atomic `Want`s from any extract site.
//!
//! Exposes `ExpressionWalk` (one property) and `ObjectWalk` (a style object).
//! Sites hand over JSX attributes, `css()` objects, and `recipe()` tables; this module does not care which.

pub mod literal;
pub mod object;
pub mod walk;

pub use object::{walk_r_object, walk_spread_argument, walk_style_object, ObjectWalk};
pub use walk::{walk_expression, ExpressionWalk};
