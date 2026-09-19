//! Local constant index used while walking style expressions.
//! Holds scalar literals and simple style objects from every `const` declarator
//! in the file — top-level or nested in a component body — so `subtleBorder`
//! and `theme.primary` resolve without a VM. One name may carry several static
//! leaves (a ternary initializer scoops both arms); extraction emits every leaf
//! and the runtime picks by live value. Imported bindings and `props.w` stay
//! dynamic. This is a lookup table, not an interpreter.

use std::collections::BTreeMap;

use super::entries::{ConstObject, ObjectProp};
use crate::atom::AtomValue;

/// Index of local scalar leaves and style objects declared anywhere in a file.
#[derive(Debug, Default, Clone)]
pub struct LocalConstants {
    scalars: BTreeMap<String, Vec<AtomValue>>,
    objects: BTreeMap<String, ConstObject>,
    arrays: BTreeMap<String, Vec<ConstArrayElement>>,
    mutated: BTreeMap<String, MutatedBinding>,
}

/// One recorded element of a const array initializer: a literal leaf, a
/// literal-entry object (for merge-list spreads), or an elision hole.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ConstArrayElement {
    /// A literal leaf (`'2px'`, `4`, `true`).
    Leaf(AtomValue),
    /// An inline object of literal entries (`{ color: 'pink' }`).
    Object(BTreeMap<String, AtomValue>),
    /// An elision hole (`[a, , c]`) — consumes its slot, yields nothing.
    Hole,
}

/// A binding poisoned by a write, with the write site for diagnostics.
#[derive(Debug, Clone)]
pub struct MutatedBinding {
    file: Box<str>,
    line: Option<u32>,
    column: Option<u32>,
    kind: MutationKind,
}

/// How a binding was poisoned: reassigned, or `delete`d (SPEC-V2-81).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum MutationKind {
    Reassigned,
    Deleted,
}

impl MutatedBinding {
    /// Record a write at `file`, with 1-based line/column when source was known.
    pub fn new(file: &str, position: Option<(u32, u32)>) -> Self {
        Self::written(file, position, MutationKind::Reassigned)
    }

    /// Record a `delete` at `file`, with 1-based line/column when source was known.
    pub fn deleted(file: &str, position: Option<(u32, u32)>) -> Self {
        Self::written(file, position, MutationKind::Deleted)
    }

    /// Record a poison of one kind; the collector keeps the first write site.
    fn written(file: &str, position: Option<(u32, u32)>, kind: MutationKind) -> Self {
        let (line, column) = position.unzip();
        Self {
            file: file.into(),
            line,
            column,
            kind,
        }
    }

    /// `path/to/file.ts:line:col`, or the bare file when offsets are unknown.
    pub fn site(&self) -> String {
        match (self.line, self.column) {
            (Some(line), Some(column)) => format!("{}:{line}:{column}", self.file),
            _ => self.file.to_string(),
        }
    }

    /// `reassigned at <site>` or `deleted at <site>` for use-site diagnostics.
    pub fn write_phrase(&self) -> String {
        let action = match self.kind {
            MutationKind::Reassigned => "reassigned",
            MutationKind::Deleted => "deleted",
        };
        format!("{action} at {}", self.site())
    }
}

impl LocalConstants {
    /// Empty index.
    pub fn new() -> Self {
        Self::default()
    }

    /// Record a scalar leaf (`const space = '2r'`), ignoring repeats.
    pub fn insert_scalar(&mut self, name: impl Into<String>, value: AtomValue) {
        // const space = '2r'
        let leaves = self.scalars.entry(name.into()).or_default();
        if !leaves.contains(&value) {
            leaves.push(value);
        }
    }

    /// Record every static leaf of a branching initializer
    /// (`const subtleBorder = isDark ? 'gray.800' : 'gray.200'`), ignoring repeats.
    pub fn insert_scalar_leaves(&mut self, name: impl Into<String>, leaves: &[AtomValue]) {
        let name = name.into();
        let slots = self.scalars.entry(name).or_default();
        for leaf in leaves {
            if !slots.contains(leaf) {
                slots.push(leaf.clone());
            }
        }
    }

    /// Record one property on a top-level style object (`theme.primary`).
    pub fn insert_object_prop(
        &mut self,
        obj_name: &str,
        prop_name: impl Into<String>,
        prop: ObjectProp,
    ) {
        // const theme = { primary: 'n300' }
        self.objects
            .entry(obj_name.to_string())
            .or_default()
            .insert(prop_name.into(), prop);
    }

    /// Look up the first scalar leaf by binding name (single-value contexts).
    pub fn get_scalar(&self, name: &str) -> Option<&AtomValue> {
        // mt={space}
        self.scalars.get(name).and_then(|leaves| leaves.first())
    }

    /// Look up every static leaf recorded for a binding name.
    pub fn scalar_leaves(&self, name: &str) -> &[AtomValue] {
        // borderBottomColor={subtleBorder}
        self.scalars.get(name).map_or(&[], Vec::as_slice)
    }

    /// Look up `obj.prop` on a recorded style object.
    pub fn get_object_prop(&self, obj_name: &str, prop_name: &str) -> Option<&ObjectProp> {
        // color={theme.primary}
        self.objects
            .get(obj_name)
            .and_then(|obj| obj.get(prop_name))
    }

    /// Look up a recorded top-level style object (`const base = { mt: '2r' }`).
    pub fn get_object(&self, name: &str) -> Option<&ConstObject> {
        // <Div {...base} />  /  css({ ...base })
        self.objects.get(name)
    }

    /// Record a const array (`const sizes = ['2px', '4px']`), first init wins.
    pub fn insert_array(&mut self, name: impl Into<String>, elements: Vec<ConstArrayElement>) {
        // const sizes = ['2px', '4px']
        self.arrays.entry(name.into()).or_insert(elements);
    }

    /// Look up a recorded const array's elements.
    pub fn get_array(&self, name: &str) -> Option<&[ConstArrayElement]> {
        // padding: [1, ...sizes]  /  margin: sizes[1]
        self.arrays.get(name).map(Vec::as_slice)
    }

    /// True when this file's bag carries any value for a declared name.
    /// The binding walk reads this, never the merged bag, so two files
    /// declaring the same name never see each other's values through it.
    pub fn declares(&self, name: &str) -> bool {
        // export const brand = 'red'  — tokens.ts declares `brand`
        self.scalars.contains_key(name)
            || self.objects.contains_key(name)
            || self.arrays.contains_key(name)
    }

    /// Mark a binding mutated by a write; the first write site wins.
    pub fn mark_mutated(&mut self, name: &str, write: MutatedBinding) {
        // color = 'blue'  after  let color = 'red'
        self.mutated.entry(name.to_string()).or_insert(write);
    }

    /// Look up the write that poisoned a binding, if any.
    pub fn mutation(&self, name: &str) -> Option<&MutatedBinding> {
        // css({ color })  after  color = 'blue'
        self.mutated.get(name)
    }

    /// Replace a top-level scalar's leaves with scope-resolved ones (SPEC-V2-34
    /// cross-file: alias chains). The scope table already stripped stale
    /// bakes, so wholesale replace is sound where union would keep ghosts.
    pub fn set_scalars(&mut self, name: impl Into<String>, leaves: Vec<AtomValue>) {
        // const b = a  after  const a = 'red' — `b` carries red
        self.scalars.insert(name.into(), leaves);
    }

    /// Replace a top-level style object with its scope-resolved entries
    /// (SPEC-V2-34 cross-file: identifier values and static spreads).
    pub fn set_object(&mut self, name: impl Into<String>, map: ConstObject) {
        // export const button = { ...base, padding: '4px' } — color rides along
        self.objects.insert(name.into(), map);
    }

    /// Replace a top-level const array with its scope-resolved elements.
    pub fn set_array(&mut self, name: impl Into<String>, elements: Vec<ConstArrayElement>) {
        // const doubled = sizes — the alias carries the elements
        self.arrays.insert(name.into(), elements);
    }

    /// Drop every leaf of every mutated binding; their inits are stale.
    pub fn drop_mutated(&mut self) {
        for name in self.mutated.keys() {
            self.scalars.remove(name);
            self.objects.remove(name);
            self.arrays.remove(name);
        }
    }

    /// Merge another file's index; scalar leaves union, existing object keys win.
    pub fn merge(&mut self, other: &LocalConstants) {
        for (k, leaves) in &other.scalars {
            self.insert_scalar_leaves(k.clone(), leaves);
        }
        self.merge_objects(&other.objects);
        for (k, v) in &other.arrays {
            self.arrays.entry(k.clone()).or_insert_with(|| v.clone());
        }
        for (k, v) in &other.mutated {
            self.mutated.entry(k.clone()).or_insert_with(|| v.clone());
        }
    }

    /// Merge another file's style objects; existing keys win per object.
    fn merge_objects(&mut self, objects: &BTreeMap<String, ConstObject>) {
        for (k, v) in objects {
            let obj = self.objects.entry(k.clone()).or_default();
            for (prop_k, prop_v) in v {
                obj.entry(prop_k.clone()).or_insert_with(|| prop_v.clone());
            }
        }
    }
}
