//! The constant-fold table both extraction walkers call (Overmatch §7.1).
//!
//! Each node folds one enumerated expression family over literal and
//! const-resolved operands and refuses the rest with a located refusal, so a
//! fold is added once and want/plan parity is structural instead of mirrored
//! across two walkers. Ph1 seeds the table with the unary node; Ph3 grows it
//! family by family. Adding a form means adding a file here — never an
//! interpreter, no runtime, no effects.

pub mod unary;

pub use unary::{fold_unary, UnaryFold, UnaryRefusal};
