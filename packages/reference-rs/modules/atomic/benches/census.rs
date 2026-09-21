//! Staging-census benches for the atomic compiler, driven through `compile`.
//! `StagingPlan::census`, `probe_union`, and `match_relative_target` are
//! crate-private (and `ValueGraph::new` takes crate-private types), so no
//! external bench can call them directly. These cases instead compile fixed
//! import graphs exercising every census spelling — exact, extensionless,
//! index, runtime-remap, parent-segment, and bare — deterministically, so a
//! profiler can attribute the census frames inside a realistic compile.

use atomic::{compile, BaseSystem, CompileRequest, VirtualSource};
use criterion::{criterion_group, criterion_main, Criterion};
use std::hint::black_box;

/// One leaf file importing the chain next-hop, the shared util, and a bare
/// specifier, so every leaf carries outgoing edges for the census to probe.
fn leaf(index: usize, last: usize) -> VirtualSource {
    let next = if index == last {
        "./shared/util".to_string()
    } else {
        format!("./leaf{}", index + 1)
    };
    VirtualSource {
        path: format!("/v/src/leaf{index}.ts"),
        content: format!(
            "import {{ V }} from '{next}';\nimport {{ U }} from './shared/util';\nimport React from 'react';\nexport const V{index} = V + U + {index};\nexport const R{index} = React;\n"
        ),
    }
}

/// Hub importing one of every census spelling the ladder union probes.
fn hub() -> VirtualSource {
    VirtualSource {
        path: "/v/src/app.ts".to_string(),
        content: "import { V0 } from './leaf0';\nimport { E } from './exact.ts';\nimport { D } from './dir0';\nimport { L } from './legacy0.js';\nimport { U } from './shared/util';\nimport React from 'react';\nexport const APP = V0 + E + D + L + U;\nexport const R = React;\n"
            .to_string(),
    }
}

/// Nested importer reaching the shared util through a parent segment.
fn nested() -> VirtualSource {
    VirtualSource {
        path: "/v/src/ui/app.ts".to_string(),
        content: "import { U } from '../shared/util';\nimport { V0 } from '../leaf0';\nexport const NESTED = U + V0;\n"
            .to_string(),
    }
}

/// Plain const file with no imports: the census's unstage control.
fn plain(path: &str, name: &str) -> VirtualSource {
    VirtualSource {
        path: path.to_string(),
        content: format!("export const {name} = 1;\nexport const V = 2;\nexport const U = 3;\n"),
    }
}

/// Deterministic import graph: hub, nested, shared, exact, leaves, dirs, legacy.
fn graph(leaf_count: usize, dir_count: usize, legacy_count: usize) -> Vec<VirtualSource> {
    let mut files = vec![hub(), nested()];
    files.push(plain("/v/src/shared/util.ts", "U"));
    files.push(plain("/v/src/exact.ts", "E"));
    let last = leaf_count - 1;
    for index in 0..leaf_count {
        files.push(leaf(index, last));
    }
    for index in 0..dir_count {
        files.push(plain(&format!("/v/src/dir{index}/index.ts"), "D"));
    }
    for index in 0..legacy_count {
        files.push(plain(&format!("/v/src/legacy{index}.ts"), "L"));
    }
    files
}

/// Compile one fixed graph per iteration on the production default path.
fn run(criterion: &mut Criterion, name: &str, files: Vec<VirtualSource>) {
    criterion.bench_function(name, |b| {
        b.iter(|| {
            let request = CompileRequest {
                files: Some(files.clone()),
                base_system: BaseSystem::lib_fixture().clone(),
                ..CompileRequest::default()
            };
            black_box(compile(black_box(&request)))
        });
    });
}

fn census(criterion: &mut Criterion) {
    run(criterion, "graph_12_files", graph(5, 2, 1));
    run(criterion, "graph_48_files", graph(30, 8, 6));
}

criterion_group!(benches, census);
criterion_main!(benches);
