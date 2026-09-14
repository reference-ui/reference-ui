//! AST call-site discovery and dispatch for JSX elements and styled function invocations.
//! Coordinates extraction of styling declarations from JSX attributes and `css(...)` calls using oxc visitors.
//! Directs recognized style payloads into the leaf walker to produce raw want declarations.

pub mod calls;
pub mod jsx;

pub use calls::handle_call_expression;
pub use jsx::handle_jsx_opening_element;
pub use crate::canon::{
    default_breakpoint_for_index, is_condition_prop, is_known_style_prop,
    is_reference_primitive,
};
