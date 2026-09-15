//! Runtime metadata and class map generation for dynamic styling evaluation.
//! Constructs lookup dictionaries mapping property and condition keys to compiled atomic CSS class names.
//! Delivers the compact JSON payloads required by runtime styling helpers and client-side style injection.

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssRuntime {
    #[serde(default)]
    pub classes: BTreeMap<String, String>,
}

impl CssRuntime {
    pub fn new() -> Self {
        Self {
            classes: BTreeMap::new(),
        }
    }

    pub fn insert(&mut self, key: impl Into<String>, class_name: impl Into<String>) {
        self.classes.insert(key.into(), class_name.into());
    }

    pub fn get(&self, key: &str) -> Option<&str> {
        self.classes.get(key).map(|s| s.as_str())
    }

    pub fn is_empty(&self) -> bool {
        self.classes.is_empty()
    }
}
