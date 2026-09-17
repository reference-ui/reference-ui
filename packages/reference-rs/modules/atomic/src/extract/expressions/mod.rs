//! Style-expression walkers that collect atomic `Want`s from any extract site.
//!
//! Exposes `ExpressionWalk` (one property) and `ObjectWalk` (a style object).
//! Sites hand over JSX attributes, `css()` objects, and `recipe()` tables; this module does not care which.

pub mod ast_value;
pub mod literal;
pub mod object;
pub mod responsive;
pub mod walk;

pub use ast_value::{ast_to_json_value, ast_to_json_values};
pub use object::{walk_r_object, walk_spread_argument, walk_style_object, ObjectWalk};
pub use responsive::{walk_array, walk_object};
pub use walk::{walk_expression, ExpressionWalk};
