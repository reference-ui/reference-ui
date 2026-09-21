//! Micro-benches for diagnostic line indexing in the atomic compiler.
//! Builds one fixed CSS-heavy sheet, then times `LineIndex::for_source` over
//! it and `LineIndex::line_col` queries at the start, middle, and end. A free
//! `line_col` scan case at the end offset pins the baseline the index beats.
//! The fixture is pure ASCII, so every byte offset is a char boundary.

use atomic::diagnostics::{line_col, LineIndex};
use criterion::{criterion_group, criterion_main, Criterion};
use std::hint::black_box;

/// One realistic utility block; the sheet repeats it with varied line lengths.
const CSS_CHUNK: &str = "@layer utilities {\n  .mt_2r {\n    margin-top: calc(2 * var(--spacing-root));\n  }\n  .bg_n300:hover {\n    background-color: var(--colors-n-300);\n  }\n  @media (min-width: 48rem) {\n    .md\\:px_4r {\n      padding-left: calc(4 * var(--spacing-root));\n      padding-right: calc(4 * var(--spacing-root));\n    }\n  }\n}\n";

/// Sheets under test: 200 blocks, roughly 3.4k lines of utilities.
fn sheet() -> String {
    CSS_CHUNK.repeat(200)
}

/// Time one index build over the fixed sheet per iteration.
fn build(criterion: &mut Criterion) {
    let sheet = sheet();
    criterion.bench_function("for_source", |b| {
        b.iter(|| black_box(LineIndex::for_source(black_box(&sheet))));
    });
}

/// Time one indexed query at a fixed offset per iteration.
fn query(criterion: &mut Criterion, name: &str, offset: u32) {
    let sheet = sheet();
    let index = LineIndex::for_source(&sheet);
    criterion.bench_function(name, |b| {
        b.iter(|| black_box(index.line_col(black_box(&sheet), black_box(offset))));
    });
}

/// Time one full scan at the end offset: the baseline the index replaces.
fn scan_end(criterion: &mut Criterion) {
    let sheet = sheet();
    let offset = sheet.len() as u32;
    criterion.bench_function("scan_end", |b| {
        b.iter(|| black_box(line_col(black_box(&sheet), black_box(offset))));
    });
}

fn line_index(criterion: &mut Criterion) {
    build(criterion);
    let len = sheet().len() as u32;
    query(criterion, "start", 0);
    query(criterion, "middle", len / 2);
    query(criterion, "end", len);
    scan_end(criterion);
}

criterion_group!(benches, line_index);
criterion_main!(benches);
