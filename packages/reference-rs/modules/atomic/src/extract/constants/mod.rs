//! File-top `const` index for style extraction.
//! Collects literal scalars and simple style objects so the expression walker can substitute them.
//! Not a fourth extract host: jsx / css / recipes still find the expression; this only answers `theme.primary`.

mod collect;
mod index;

pub use collect::collect_local_constants;
pub use index::LocalConstants;
