//! Comment extraction surface.
//! Finds leading comments on AST nodes and parses lightweight JSDoc metadata for symbol and member descriptions.

mod file_header;
mod leading;
mod parse;

pub(super) use leading::leading_comment_for_span;
pub(super) use parse::parse_comment_metadata;
