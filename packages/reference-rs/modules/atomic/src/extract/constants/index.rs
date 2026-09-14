//! Local constant index used while walking style expressions.
//! Holds file-top scalar literals and simple style objects so `theme.primary` can resolve without a VM.
//! This is a lookup table, not an interpreter: imported bindings and `props.w` stay dynamic.

use std::collections::BTreeMap;

use crate::atom::AtomValue;

/// Index of local scalar values and style objects declared at the top-level of a file.
#[derive(Debug, Default, Clone)]
pub struct LocalConstants {
    scalars: BTreeMap<String, AtomValue>,
    objects: BTreeMap<String, BTreeMap<String, AtomValue>>,
}

impl LocalConstants {
    /// Empty index.
    pub fn new() -> Self {
        Self::default()
    }

    /// Record a top-level scalar (`const space = '2r'`).
    pub fn insert_scalar(&mut self, name: impl Into<String>, value: AtomValue) {
        // const space = '2r'
        self.scalars.insert(name.into(), value);
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

    /// Look up a scalar by binding name.
    pub fn get_scalar(&self, name: &str) -> Option<&AtomValue> {
        // mt={space}
        self.scalars.get(name)
    }

    /// Look up `obj.prop` on a recorded style object.
    pub fn get_object_prop(&self, obj_name: &str, prop_name: &str) -> Option<&AtomValue> {
        // color={theme.primary}
        self.objects
            .get(obj_name)
            .and_then(|obj| obj.get(prop_name))
    }

    /// Merge another file's index; existing keys win.
    pub fn merge(&mut self, other: &LocalConstants) {
        for (k, v) in &other.scalars {
            self.scalars.entry(k.clone()).or_insert_with(|| v.clone());
        }
        for (k, v) in &other.objects {
            let obj = self.objects.entry(k.clone()).or_default();
            for (prop_k, prop_v) in v {
                obj.entry(prop_k.clone()).or_insert_with(|| prop_v.clone());
            }
        }
    }
}
