//! Code shared across tasty subsystems (extract, resolve, etc.).
//! Holds evaluation budgets, literal values, extends checks, and the TypeRef map and utility passes.

pub(crate) mod eval_budget;
pub(crate) mod literal_value;
pub(crate) mod type_extends;
pub(crate) mod type_ref_map;
pub(crate) mod type_ref_util;
