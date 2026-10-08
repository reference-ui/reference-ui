//! Criterion micro-benches for `canon::dialect::resolve_alias`.
//!
//! The alias resolver is the hottest our-self frame in the flame evidence, so these
//! benches pin its hit, miss, and canonical-passthrough paths over fixed inputs. Each
//! single-word case issues one lookup per iteration through `black_box`, while the
//! mixed workload loops a hot enterprise word list to model real resolve traffic.

use std::hint::black_box;

use canon::dialect::resolve_alias;
use criterion::{criterion_group, criterion_main, Criterion};

/// Hot enterprise word list: alias hits, canonical passthrough, adversarial misses.
const MIXED_WORDS: &[&str] = &[
    "mt", "bg", "p", "m", "flexDir", "mx", "py", "color", "margin", "marginTop", "display",
    "notAProp", "zzz",
];

fn bench_word(c: &mut Criterion, id: &str, word: &'static str) {
    c.bench_function(id, |b| {
        b.iter(|| black_box(resolve_alias(black_box(word))));
    });
}

fn bench_mixed(c: &mut Criterion) {
    c.bench_function("alias/mixed", |b| {
        b.iter(|| {
            for &word in MIXED_WORDS {
                black_box(resolve_alias(black_box(word)));
            }
        });
    });
}

fn alias_lookups(c: &mut Criterion) {
    bench_word(c, "alias/hit_hot", "mt");
    bench_word(c, "alias/hit_head", "MozAnimation");
    bench_word(c, "alias/hit_mid", "WebkitAlignItems");
    bench_word(c, "alias/hit_tail", "w");
    bench_word(c, "alias/miss", "notARealProp");
    bench_word(c, "alias/passthrough", "marginTop");
    bench_mixed(c);
}

criterion_group!(benches, alias_lookups);
criterion_main!(benches);
