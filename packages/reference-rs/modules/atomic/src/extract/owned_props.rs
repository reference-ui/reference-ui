//! Borrowed union of the compile-global and file-local owned props (§14).
//!
//! The global map keys each export name, traced or declared by the system,
//! to the props its declaration keeps for itself. A component its module
//! never exports has no export name, so the trace reports its owned props
//! per module path instead; only that file's call sites may read them, or a
//! local name would shadow a same-named component in another file. The view
//! answers `owns` over both borrowed maps, so per-file setup allocates nothing.

use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};

/// Each tag name to the prop names its declaration keeps for itself.
pub type OwnedMap = BTreeMap<String, BTreeSet<String>>;

/// Each traced module path to its own components' owned props, by local name.
pub type LocalOwned = BTreeMap<PathBuf, OwnedMap>;

/// The owned props one file's call sites read: the global map plus the
/// file's own components.
#[derive(Clone, Copy)]
pub struct OwnedProps<'a> {
    pub global: &'a OwnedMap,
    pub local: Option<&'a OwnedMap>,
}

impl<'a> OwnedProps<'a> {
    /// The view for the file at `path`: the global map plus that file's
    /// entry in `local`, when the trace reported one.
    pub fn for_file(global: &'a OwnedMap, local: &'a LocalOwned, path: &str) -> Self {
        Self {
            global,
            local: local.get(Path::new(path)),
        }
    }

    /// True when the tag's own declaration keeps this prop name. Member tags
    /// also match their concatenated spelling (`Tabs.Panel` reads `TabsPanel`).
    pub fn owns(&self, tag: &str, name: &str) -> bool {
        if self.owns_exact(tag, name) {
            return true;
        }
        tag.contains('.') && self.owns_exact(&tag.replace('.', ""), name)
    }

    fn owns_exact(&self, tag: &str, name: &str) -> bool {
        let keeps = |map: &OwnedMap| map.get(tag).is_some_and(|owned| owned.contains(name));
        keeps(self.global) || self.local.is_some_and(keeps)
    }
}
