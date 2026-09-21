//! Criterion micro-benches for `canon::css::values::classify_css_value`.
//!
//! The value classifier fences complete CSS from token paths on every resolve, so
//! these benches pin each recognition shape: lengths, hex/named/function colors,
//! CSS-wide keywords, and kind-agnostic `var()` references. Miss cases cover plain
//! words and dotted token paths; the mixed workload blends hits with rejects.

use std::hint::black_box;

use canon::css::values::classify::classify_css_value;
use criterion::{criterion_group, criterion_main, Criterion};

/// Value blend: lengths, colors, keywords, `var()`, and token-path rejects.
const MIXED_VALUES: &[&str] = &[
    "13px",
    "red",
    "#ff0000",
    "auto",
    "var(--brand)",
    "rgb(0,0,0)",
    "1.25rem",
    "hello",
    "ui.button.mutedBackground",
];

fn bench_value(c: &mut Criterion, id: &str, value: &'static str) {
    c.bench_function(id, |b| {
        b.iter(|| black_box(classify_css_value(black_box(value))));
    });
}

fn bench_mixed(c: &mut Criterion) {
    c.bench_function("classify/mixed", |b| {
        b.iter(|| {
            for &value in MIXED_VALUES {
                black_box(classify_css_value(black_box(value)));
            }
        });
    });
}

fn classify_values(c: &mut Criterion) {
    bench_value(c, "classify/length", "13px");
    bench_value(c, "classify/color_hex", "#ff0000");
    bench_value(c, "classify/color_named", "red");
    bench_value(c, "classify/color_fn", "rgb(0,0,0)");
    bench_value(c, "classify/keyword", "auto");
    bench_value(c, "classify/var", "var(--brand)");
    bench_value(c, "classify/miss", "hello");
    bench_value(c, "classify/miss_token", "ui.button.mutedBackground");
    bench_mixed(c);
}

criterion_group!(benches, classify_values);
criterion_main!(benches);
