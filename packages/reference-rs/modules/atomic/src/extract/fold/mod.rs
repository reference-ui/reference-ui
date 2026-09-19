//! The constant-fold table both extraction walkers call (Overmatch §7.1).
//!
//! Each node folds one enumerated expression family over literal and
//! const-resolved operands and refuses the rest with a located refusal, so a
//! fold is added once and want/plan parity is structural instead of mirrored
//! across two walkers. Ph1 seeds the table with the unary node; Ph3 grows it
//! family by family. Adding a form means adding a file here — never an
//! interpreter, no runtime, no effects.

pub mod array;
pub mod binary;
pub mod call;
pub mod call_lower;
pub mod chain;
pub mod conditional;
pub mod element;
pub mod fence;
pub mod fence_attach;

mod fence_arith;
mod fence_coerce;
mod fence_eval;
mod fence_lower;
mod fence_lower_ops;
pub mod key;
pub mod logical;
pub mod member;
pub mod template;
pub mod token;
pub mod token_shape;
pub mod unary;

mod call_args;
mod call_object;
mod coerce;
mod operand;
mod pairs;

pub use array::{
    flatten_value_slots, merge_spread, spread_base_name, spread_flattens, MergeSpread, ValueSlot,
};
pub use binary::{fold_binary, BinaryFold, BinaryRefusal};
pub use call::{fold_pure_call, CallFold, CallRefusal};
pub use call_lower::{
    call_value_to_json, call_values_to_json, lower_call_spread, lower_call_value,
};
pub use chain::fold_chain;
pub use conditional::{dead_arm, fold_test, DeadArm, TestFold};
pub use element::{
    describe_base, describe_snippet, fold_element_access, ElementFold, ElementRefusal,
};
pub use fence::{FenceValue, PureFn};
pub use fence_attach::attach_pure_fns;
pub use key::{canonical_numeric_key, fold_property_key};
pub use logical::{fold_logical, LogicalFold};
pub use member::{member_path_leaves, member_path_object, member_path_text, member_root_name};
pub use template::{fold_template, TemplateFold, TemplateRefusal};
pub use token::{fold_token_call, TokenFold, TokenReason, TokenRefusal};
pub use token_shape::{
    classify_fallback, classify_path, is_token_import, path_leaves_reason,
    resolve_fallback_operand, resolve_path_operand, shape_value, token_args, token_callee,
    TokenArgs, TokenCallee, TokenOperand,
};
pub use unary::{fold_unary, UnaryFold, UnaryRefusal};
