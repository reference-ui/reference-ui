//! Micro-benches for runtime plan building in the atomic compiler.
//! Drives the public `PlanBuilder::build` (and its `build_diet` sibling, the
//! production `!proof` path) over a fixed set of eight authored declarations
//! spanning scalars, tokens, conditions, importance, and responsive arrays and
//! objects. `build_keyed` and `resolve_entry` are private, so `build` is the
//! hottest feasible public unit; both cases share the same declaration set.

use atomic::atom::AtomSet;
use atomic::runtime::{AuthoredDeclaration, PlanBuilder};
use atomic::BaseSystem;
use criterion::{criterion_group, criterion_main, Criterion};
use std::hint::black_box;
use serde_json::json;

/// One fixed authored declaration: conditions, prop, JSON value, importance.
struct Decl {
    when: Vec<String>,
    prop: &'static str,
    value: serde_json::Value,
    important: bool,
}

/// Eight realistic declarations covering every `resolve_entry` shape.
fn decls() -> Vec<AuthoredDeclaration> {
    let rows = [
        Decl {
            when: Vec::new(),
            prop: "mt",
            value: json!("2r"),
            important: false,
        },
        Decl {
            when: Vec::new(),
            prop: "color",
            value: json!("blue.600"),
            important: false,
        },
        Decl {
            when: vec!["_hover".to_string()],
            prop: "mt",
            value: json!("2r"),
            important: false,
        },
        Decl {
            when: Vec::new(),
            prop: "color",
            value: json!("red"),
            important: true,
        },
        Decl {
            when: Vec::new(),
            prop: "mt",
            value: json!(["1r", "2r", null, "4r"]),
            important: false,
        },
        Decl {
            when: Vec::new(),
            prop: "mt",
            value: json!({"base": "1r", "md": "3r"}),
            important: false,
        },
        Decl {
            when: Vec::new(),
            prop: "px",
            value: json!("2r"),
            important: false,
        },
        Decl {
            when: Vec::new(),
            prop: "width",
            value: json!("100px"),
            important: false,
        },
    ];
    rows.into_iter()
        .map(|row| AuthoredDeclaration {
            when: row.when,
            prop: row.prop.to_string(),
            value: row.value,
            important: row.important,
        })
        .collect()
}

/// Build full plans over the fixed declarations per iteration.
fn full(criterion: &mut Criterion) {
    let system = BaseSystem::lib_fixture();
    let decls = decls();
    criterion.bench_function("build", |b| {
        b.iter(|| {
            let mut atoms = AtomSet::new();
            let mut diagnostics = Vec::new();
            let mut builder =
                PlanBuilder::new(&system.name, system, &mut atoms, &mut diagnostics);
            black_box(builder.build(black_box(&decls)))
        });
    });
}

/// Build diet plans (the production `!proof` path) over the same set.
fn diet(criterion: &mut Criterion) {
    let system = BaseSystem::lib_fixture();
    let decls = decls();
    criterion.bench_function("build_diet", |b| {
        b.iter(|| {
            let mut atoms = AtomSet::new();
            let mut diagnostics = Vec::new();
            let mut builder =
                PlanBuilder::new(&system.name, system, &mut atoms, &mut diagnostics);
            black_box(builder.build_diet(black_box(&decls)))
        });
    });
}

criterion_group!(benches, full, diet);
criterion_main!(benches);
