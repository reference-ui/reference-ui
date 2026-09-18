//! Local constant index used while walking style expressions.
//! Holds scalar literals and simple style objects from every `const` declarator
//! in the file — top-level or nested in a component body — so `subtleBorder`
//! and `theme.primary` resolve without a VM. One name may carry several static
//! leaves (a ternary initializer scoops both arms); extraction emits every leaf
//! and the runtime picks by live value. Imported bindings and `props.w` stay
//! dynamic. This is a lookup table, not an interpreter.

use std::collections::BTreeMap;

use crate::atom::AtomValue;

/// Index of local scalar leaves and style objects declared anywhere in a file.
#[derive(Debug, Default, Clone)]
pub struct LocalConstants {
    scalars: BTreeMap<String, Vec<AtomValue>>,
    objects: BTreeMap<String, BTreeMap<String, AtomValue>>,
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
        value: AtomValue,
    ) {
        // const theme = { primary: 'n300' }
        self.objects
            .entry(obj_name.to_string())
            .or_default()
            .insert(prop_name.into(), value);
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
    pub fn get_object_prop(&self, obj_name: &str, prop_name: &str) -> Option<&AtomValue> {
        // color={theme.primary}
        self.objects
            .get(obj_name)
            .and_then(|obj| obj.get(prop_name))
    }

    /// Look up a recorded top-level style object (`const base = { mt: '2r' }`).
    pub fn get_object(&self, name: &str) -> Option<&BTreeMap<String, AtomValue>> {
        // <Div {...base} />  /  css({ ...base })
        self.objects.get(name)
    }

    /// Merge another file's index; scalar leaves union, existing object keys win.
    pub fn merge(&mut self, other: &LocalConstants) {
        for (k, leaves) in &other.scalars {
            self.insert_scalar_leaves(k.clone(), leaves);
        }
        for (k, v) in &other.objects {
            let obj = self.objects.entry(k.clone()).or_default();
            for (prop_k, prop_v) in v {
                obj.entry(prop_k.clone()).or_insert_with(|| prop_v.clone());
            }
        }
    }
}
