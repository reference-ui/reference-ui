//! Criterion micro-benches for `canon::css::find_property`.
//!
//! The property table is a sorted static slice probed by binary search, so these
//! benches span search depths with head, middle, and tail hits plus a hot enterprise
//! property. Miss cases cover unknown names and alias-shaped input, which the
//! canonical table must reject; the mixed workload loops a realistic lookup blend.

use std::hint::black_box;

use canon::css::find_property;
use criterion::{criterion_group, criterion_main, Criterion};

/// Lookup blend: canonical hits across table depths, an alias-shaped miss, a miss.
const MIXED_WORDS: &[&str] = &[
    "color",
    "display",
    "margin",
    "padding",
    "flexDirection",
    "accentColor",
    "marginBottom",
    "zoom",
    "mt",
    "notAProperty",
];

fn bench_word(c: &mut Criterion, id: &str, word: &'static str) {
    c.bench_function(id, |b| {
        b.iter(|| black_box(find_property(black_box(word))));
    });
}

fn bench_mixed(c: &mut Criterion) {
    c.bench_function("property/mixed", |b| {
        b.iter(|| {
            for &word in MIXED_WORDS {
                black_box(find_property(black_box(word)));
            }
        });
    });
}

fn property_lookups(c: &mut Criterion) {
    bench_word(c, "property/hit_head", "accentColor");
    bench_word(c, "property/hit_mid", "marginBottom");
    bench_word(c, "property/hit_tail", "zoom");
    bench_word(c, "property/hit_hot", "color");
    bench_word(c, "property/miss", "notAProperty");
    bench_word(c, "property/alias_miss", "mt");
    bench_mixed(c);
}

criterion_group!(benches, property_lookups);
criterion_main!(benches);
