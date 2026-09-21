//! Ladder micro-benches: cost of one `SpecifierLadder::resolve` call.
//!
//! Every case resolves over a fixed [`MemoryFs`] shaped like a small app (a
//! few dozen files, an index dir, one `node_modules` package with an exports
//! map), so the numbers isolate ladder work — joins and probe counts — from
//! fixture construction. The ladder under test always runs the `Source`
//! policy, the value-compiler rung that `BindingWalk` rides on every edge.
//! Cases walk the probe ladder from a one-spelling hit to a full refusal.

use std::hint::black_box;

use criterion::{Criterion, criterion_group, criterion_main};
use module_graph::{ExtensionPolicy, MemoryFs, ModuleKey, SpecifierLadder};

/// The fixed app world: sources, an index dir, and one exports-mapped package.
const FILES: [(&str, &str); 34] = [
    ("/p/src/app.ts", "app"),
    ("/p/src/tokens.ts", "t"),
    ("/p/src/a.ts", "a"),
    ("/p/src/a.tsx", "ax"),
    ("/p/src/a.js", "aj"),
    ("/p/src/b.tsx", "b"),
    ("/p/src/b.js", "bj"),
    ("/p/src/c.js", "c"),
    ("/p/src/dir/index.tsx", "x"),
    ("/p/src/dir/index.js", "j"),
    ("/p/src/other/index.js", "j"),
    ("/p/src/pages/home.ts", "h"),
    ("/p/src/pages/about.tsx", "a"),
    ("/p/src/pages/settings/index.ts", "s"),
    ("/p/src/components/button.tsx", "b"),
    ("/p/src/components/card.tsx", "c"),
    ("/p/src/components/modal.jsx", "m"),
    ("/p/src/hooks/use_theme.ts", "h"),
    ("/p/src/hooks/use_media.mts", "m"),
    ("/p/src/lib/format.ts", "f"),
    ("/p/src/lib/guards.cts", "g"),
    ("/p/src/styles/reset.css", "css"),
    ("/p/src/types.d.ts", "d"),
    ("/p/shared/tokens.ts", "t"),
    ("/p/shared/theme.ts", "t"),
    ("/p/package.json", "{\"name\":\"app\"}"),
    (
        "/p/node_modules/pkg/package.json",
        "{\"exports\":{\".\":\"./entry.ts\",\"./tokens\":\"./mapped.ts\"}}",
    ),
    ("/p/node_modules/pkg/entry.ts", "e"),
    ("/p/node_modules/pkg/mapped.ts", "m"),
    ("/p/node_modules/pkg/extra.js", "e"),
    ("/p/node_modules/other/package.json", "{\"main\":\"./main.js\"}"),
    ("/p/node_modules/other/main.js", "m"),
    ("/p/src/deep/nested/helper.ts", "h"),
    ("/p/src/deep/nested/more/util.ts", "u"),
];

/// The fixed world every case resolves against.
fn app_world() -> MemoryFs {
    let mut fs = MemoryFs::new();
    for (path, content) in FILES {
        fs.insert(path, content);
    }
    fs
}

/// One resolve case: fixed world, fixed `from`, one hot specifier.
fn bench_case(c: &mut Criterion, name: &str, from: &str, specifier: &str) {
    let fs = app_world();
    let ladder = SpecifierLadder::new(&fs, ExtensionPolicy::Source);
    let from = ModuleKey::new(from);
    c.bench_function(name, |b| {
        b.iter(|| {
            let out = ladder.resolve(black_box(&from), black_box(specifier));
            black_box(out)
        });
    });
}

/// The probe ladder from a one-spelling hit to a full refusal.
fn ladder_benches(c: &mut Criterion) {
    bench_case(c, "relative/explicit_ext", "/p/src/app.ts", "./tokens.ts");
    bench_case(c, "relative/extensionless_probe", "/p/src/app.ts", "./b");
    bench_case(c, "relative/dir_index", "/p/src/app.ts", "./dir");
    bench_case(c, "relative/miss", "/p/src/app.ts", "./missing");
    bench_case(
        c,
        "relative/deep_parent",
        "/p/src/pages/home.ts",
        "../../shared/tokens",
    );
}

criterion_group!(benches, ladder_benches);
criterion_main!(benches);
