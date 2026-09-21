//! Micro-benches for want resolution and atom identity in the atomic compiler.
//! Drives the public `resolve_want_with` over a fixed set of realistic wants
//! covering the token, rhythm, shorthand, unit, and conditioned paths. The
//! trailing group pins `Atom::eq` hit and miss costs, since every `AtomSet`
//! insert pays one comparison per hash collision. Inputs are committed inline
//! consts resolved against the frozen lib fixture, so runs are deterministic.

use atomic::atom::{Atom, AtomValue, CssValue, Want};
use atomic::diagnostics::DiagnosticLocation;
use atomic::resolve::{resolve_want_with, ResolveSession};
use atomic::BaseSystem;
use criterion::{criterion_group, criterion_main, Criterion};
use std::hint::black_box;
use smallvec::smallvec;

/// One fixed resolve input: authored prop, value, and condition stack.
struct Case {
    name: &'static str,
    prop: &'static str,
    value: &'static str,
    when: &'static [&'static str],
}

/// Realistic wants, one per resolve path. Values mirror the resolve tests.
const CASES: &[Case] = &[
    Case {
        name: "token",
        prop: "color",
        value: "blue.600",
        when: &[],
    },
    Case {
        name: "rhythm",
        prop: "mt",
        value: "2r",
        when: &[],
    },
    Case {
        name: "shorthand",
        prop: "px",
        value: "2r",
        when: &[],
    },
    Case {
        name: "unit",
        prop: "width",
        value: "100px",
        when: &[],
    },
    Case {
        name: "conditioned",
        prop: "mt",
        value: "2r",
        when: &["_hover"],
    },
];

/// Build one committed want from its case row.
fn want_for(case: &Case) -> Want {
    let when = case.when.iter().map(|cond| (*cond).into()).collect();
    Want::new(case.prop, AtomValue::String(case.value.into())).with_when(when)
}

/// Resolve one fixed want per iteration against the lib fixture.
fn run_case(criterion: &mut Criterion, case: &Case) {
    let system = BaseSystem::lib_fixture();
    let want = want_for(case);
    criterion.bench_function(case.name, |b| {
        b.iter(|| {
            let mut diagnostics = Vec::new();
            let mut session = ResolveSession {
                system,
                diagnostics: &mut diagnostics,
                location: DiagnosticLocation::default(),
                sink: None,
                want: None,
            };
            black_box(resolve_want_with(black_box(&want), &mut session))
        });
    });
}

fn resolve(criterion: &mut Criterion) {
    for case in CASES {
        run_case(criterion, case);
    }
}

/// Base atom every equality case compares against.
fn base_atom() -> Atom {
    Atom::new(
        "mt".into(),
        CssValue::String("2r".into()),
        smallvec![],
        false,
    )
}

/// Time one `Atom::eq` shape per iteration.
fn eq_case(criterion: &mut Criterion, name: &str, other: &Atom) {
    let base = base_atom();
    criterion.bench_function(name, |b| {
        b.iter(|| black_box(&base) == black_box(other));
    });
}

fn atom_eq(criterion: &mut Criterion) {
    let hit = base_atom();
    let prop_miss = Atom::new(
        "mb".into(),
        CssValue::String("2r".into()),
        smallvec![],
        false,
    );
    let value_miss = Atom::new(
        "mt".into(),
        CssValue::String("4r".into()),
        smallvec![],
        false,
    );
    let important_miss = Atom::new(
        "mt".into(),
        CssValue::String("2r".into()),
        smallvec![],
        true,
    );
    eq_case(criterion, "hit", &hit);
    eq_case(criterion, "prop_miss", &prop_miss);
    eq_case(criterion, "value_miss", &value_miss);
    eq_case(criterion, "important_miss", &important_miss);
}

criterion_group!(benches, resolve, atom_eq);
criterion_main!(benches);
