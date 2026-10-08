//! Shared diagnostic template, transport, and code registry for every native module.
//! Defines the one wire representation (`Diagnostic`: severity plus validated code plus message plus optional
//! location), the JSON transport that carries it from napi into TypeScript consumers, and the namespace convention
//! in `REGISTRY.md` that keeps per-module code assignment deliberate. Module crates root their own diagnostics in
//! this template instead of inventing sibling shapes, so hosts filter and render one contract.

#![warn(missing_docs)]

pub mod code;
pub mod diagnostic;
pub mod message;
pub mod render;
pub mod span;
pub mod transport;

#[cfg(test)]
mod tests;

pub use code::{CodeError, DiagnosticCode, REGISTERED_NAMESPACES, TEMPLATE_NAMESPACE};
pub use diagnostic::{Diagnostic, DiagnosticError, Severity};
pub use span::{ByteSpan, Label, SpanError};
pub use transport::{decode, decode_batch, encode, encode_batch, TransportError};
