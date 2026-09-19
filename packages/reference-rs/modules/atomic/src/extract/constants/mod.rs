//! Every-depth `const` index for style extraction.
//! Collects literal scalars, branching-initializer leaves, and simple style objects so the expression walker can substitute them.
//! Not a fourth extract host: jsx / css / recipes still find the expression; this only answers `theme.primary`.

mod collect;
mod entries;
mod index;
mod mutate;

pub use collect::collect_local_constants;
pub use entries::{object_entries, ConstObject, ObjectProp};
pub(crate) use entries::union_entry;
pub use index::{ConstArrayElement, LocalConstants, MutatedBinding};
