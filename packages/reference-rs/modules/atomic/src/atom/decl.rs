//! Resolved atomic utility declaration representing a single property-value pair with conditions.
//! Encapsulates CSS property names, normalized values, condition chains, importance flags, and precomputed identity hashes.
//! Enables deterministic hashing and deduplication during stylesheet generation.

use rustc_hash::FxHasher;
use serde::{Deserialize, Serialize};
use smallvec::SmallVec;
use std::hash::{Hash, Hasher};

use super::AtomValue;

/// One resolved atomic utility declaration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Atom {
    pub prop: Box<str>,
    pub value: AtomValue,
    pub conditions: SmallVec<[Box<str>; 2]>,
    pub important: bool,
    pub hash: u64,
}

impl Atom {
    pub fn new(
        prop: Box<str>,
        value: AtomValue,
        conditions: SmallVec<[Box<str>; 2]>,
        important: bool,
    ) -> Self {
        let hash = Self::compute_hash(&prop, &value, &conditions, important);
        Self {
            prop,
            value,
            conditions,
            important,
            hash,
        }
    }

    pub fn prop(&self) -> &str {
        &self.prop
    }

    pub fn value(&self) -> &AtomValue {
        &self.value
    }

    pub fn conditions(&self) -> &[Box<str>] {
        &self.conditions
    }

    pub fn important(&self) -> bool {
        self.important
    }

    pub fn hash(&self) -> u64 {
        self.hash
    }

    fn compute_hash(
        prop: &str,
        value: &AtomValue,
        conditions: &[Box<str>],
        important: bool,
    ) -> u64 {
        let mut hasher = FxHasher::default();
        prop.hash(&mut hasher);
        value.hash(&mut hasher);
        conditions.hash(&mut hasher);
        important.hash(&mut hasher);
        hasher.finish()
    }
}

impl PartialEq for Atom {
    fn eq(&self, other: &Self) -> bool {
        self.hash == other.hash
            && self.important == other.important
            && self.prop == other.prop
            && self.value == other.value
            && self.conditions == other.conditions
    }
}

impl Eq for Atom {}

impl Hash for Atom {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.hash.hash(state);
    }
}
