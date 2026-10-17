//! Stylesheet emitter unit tests, split by topic: layer shells, dual-sheet streams, and foreign grouping.
//! This file holds the fixtures (`empty_system`, `own_qualifiers`, `when`) that the topic submodules share.
//! Ordering across at-rule wraps lives in `emitter_ordering_tests`.

use super::*;
use crate::resolve::conditions::{lower_when, LoweredWhen};

mod foreign;
mod layers;
mod streams;

fn empty_system() -> BaseSystem {
    BaseSystem::default()
}

/// Own-first qualifier list for the single-set builders: just the system name.
fn own_qualifiers(system: &BaseSystem) -> Vec<String> {
    vec![system.name.clone()]
}

fn when(raw: &str) -> crate::atom::When {
    match lower_when(raw, &empty_system()) {
        LoweredWhen::Known(w) => w,
        other => panic!("expected known condition for {raw}, got {other:?}"),
    }
}

