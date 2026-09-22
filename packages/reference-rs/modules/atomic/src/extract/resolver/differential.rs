//! The staging differential: force-unstage vs census vs full staging over one
//! fixture repo. With an empty plan every reached file falls back to
//! memory-content re-parse, with a full plan nothing does, and the census
//! (shipped) stages the middle — all three must resolve identical values,
//! including the tsconfig-aliased true miss and the nested-import arm.

use module_graph::ModuleKey;
use rustc_hash::FxHashMap;
use oxc_allocator::Allocator;
use oxc_parser::Parser;
use oxc_span::SourceType;

use super::{
    ImportRef, LocalConstants, ResolvedExport, RetainedSource, StreamedSource, ValueGraph,
};
use super::staging::StagingPlan;

/// One differential fixture: path, content, and the stream gate.
struct Fixture {
    path: &'static str,
    content: &'static str,
    streamed: bool,
}

/// The differential repo: relative edges, a star barrel, an unimported
/// dead exporter (skips), a tsconfig-aliased target (a true census
/// miss: bare, so the census skips it and the fallback serves it), and
/// an edgeless file (unstages; nothing reaches it).
fn fixtures() -> Vec<Fixture> {
    vec![
        Fixture {
            path: "/v/src/app.ts",
            content: "import { button } from './tokens'\nimport { base } from './barrel'\nimport { gap } from '@/aliased'\nexport const x = 1",
            streamed: false,
        },
        Fixture {
            path: "/v/src/tokens.ts",
            content: "import { base } from './base'\nexport const button = { ...base, padding: '4px' }",
            streamed: false,
        },
        Fixture {
            path: "/v/src/base.ts",
            content: "export const base = { color: 'red' }",
            streamed: true,
        },
        Fixture {
            path: "/v/src/barrel.ts",
            content: "export * from './base'",
            streamed: false,
        },
        Fixture {
            path: "/v/src/aliased.ts",
            content: "export const gap = '12px'",
            streamed: false,
        },
        Fixture {
            path: "/v/src/dead.ts",
            content: "export const FACTOR_1 = 8\nexport function combine1(left: number, right: number): number {\n  return (left + right) * FACTOR_1\n}",
            streamed: true,
        },
        Fixture {
            path: "/v/src/plain.ts",
            content: "export const ok = 'yes'\nfunction g() {\n  const q = 1\n  return q\n}",
            streamed: false,
        },
    ]
}

/// Hand-mirrored scope refs per importer (what `import_refs` finds).
fn refs_for(path: &str) -> Vec<ImportRef> {
    let one = |local: &str, imported: &str, specifier: &str| ImportRef {
        local: local.into(),
        imported: imported.into(),
        specifier: specifier.into(),
    };
    match path {
        "/v/src/app.ts" => vec![
            one("button", "button", "./tokens"),
            one("base", "base", "./barrel"),
            one("gap", "gap", "@/aliased"),
        ],
        "/v/src/tokens.ts" => vec![one("base", "base", "./base")],
        _ => Vec::new(),
    }
}

/// Sorted debug snapshot of one resolved map (deterministic: ordered
/// containers only, keys sorted because maps hash).
fn snapshot(map: FxHashMap<String, ResolvedExport>) -> Vec<(String, String)> {
    let mut out: Vec<(String, String)> = map
        .into_iter()
        .map(|(name, export)| (name, format!("{export:?}")))
        .collect();
    out.sort_by(|left, right| left.0.cmp(&right.0));
    out
}

/// Resolve every importer's refs under a plan factory.
fn resolve_under<'x>(make: &dyn Fn() -> ValueGraph<'x>) -> Vec<(String, Vec<(String, String)>)> {
    let mut graph = make();
    ["/v/src/app.ts", "/v/src/tokens.ts"]
        .iter()
        .map(|path| {
            let refs = refs_for(path);
            (path.to_string(), snapshot(graph.resolve_file_imports(path, &refs)))
        })
        .collect()
}

#[test]
fn force_unstage_matches_census_matches_full_staging() {
    let files = fixtures();
    // The tsconfig rides the sources only (never parsed): the ladder
    // reads it through the fs exactly as it reads the disk in prod.
    let mut sources: Vec<(String, String)> = files
        .iter()
        .map(|file| (file.path.to_string(), file.content.to_string()))
        .collect();
    sources.push((
        "/v/tsconfig.json".to_string(),
        "{\"compilerOptions\": {\"baseUrl\": \".\", \"paths\": {\"@/*\": [\"src/*\"]}}}".to_string(),
    ));
    let allocators: Vec<Allocator> = files.iter().map(|_| Allocator::default()).collect();
    let parsed: Vec<_> = files
        .iter()
        .zip(allocators.iter())
        .map(|(file, allocator)| {
            Parser::new(allocator, file.content, SourceType::ts()).parse()
        })
        .collect();
    for (file, ret) in files.iter().zip(parsed.iter()) {
        assert!(!ret.panicked, "{} parses", file.path);
    }
    let retained: Vec<RetainedSource<'_>> = files
        .iter()
        .zip(parsed.iter())
        .enumerate()
        .filter(|(_, (file, _))| !file.streamed)
        .map(|(index, (file, ret))| RetainedSource {
            path: sources[index].0.as_str(),
            content: sources[index].1.as_str(),
            program: &ret.program,
        })
        .collect();
    let streamed = || {
        files
            .iter()
            .zip(parsed.iter())
            .filter(|(file, _)| file.streamed)
            .map(|(file, ret)| StreamedSource::collect(&ret.program, file.path, file.content))
            .collect::<Vec<_>>()
    };
    let project = LocalConstants::new();
    let full_keys: Vec<ModuleKey> = files
        .iter()
        .map(|file| ModuleKey::new(file.path))
        .collect();

    let census = resolve_under(&|| ValueGraph::new(&sources, &retained, streamed(), &project));
    let empty = resolve_under(&|| {
        ValueGraph::new_with_plan(&sources, &retained, streamed(), &project, StagingPlan::empty())
    });
    let full = resolve_under(&|| {
        ValueGraph::new_with_plan(
            &sources,
            &retained,
            streamed(),
            &project,
            StagingPlan::full(full_keys.clone().into_iter()),
        )
    });
    assert_eq!(census, empty, "census matches force-unstage");
    assert_eq!(census, full, "census matches full staging");

    // Sanity: the values actually folded (not identically empty). The
    // alias target is a true census miss, so `gap` proves the fallback.
    let app = &census[0].1;
    let button = app.iter().find(|(name, _)| name == "button").expect("button folds");
    assert!(button.1.contains("4px"), "{button:?}");
    let gap = app.iter().find(|(name, _)| name == "gap").expect("gap folds");
    assert!(gap.1.contains("12px"), "{gap:?}");
    // `base` fans through the star barrel to base's object.
    let base = app.iter().find(|(name, _)| name == "base").expect("base folds");
    assert!(base.1.contains("red"), "{base:?}");
}

#[test]
fn census_plan_stages_edges_and_targets_only() {
    let files = fixtures();
    let allocators: Vec<Allocator> = files.iter().map(|_| Allocator::default()).collect();
    let parsed: Vec<_> = files
        .iter()
        .zip(allocators.iter())
        .map(|(file, allocator)| {
            Parser::new(allocator, file.content, SourceType::ts()).parse()
        })
        .collect();
    let records: Vec<module_graph::ModuleRecord> = parsed
        .iter()
        .map(|ret| module_graph::ModuleRecord::collect(&ret.program))
        .collect();
    let keys: Vec<ModuleKey> = files
        .iter()
        .map(|file| ModuleKey::new(file.path))
        .collect();
    let set: std::collections::HashSet<ModuleKey> = keys.iter().cloned().collect();
    let plan = StagingPlan::census(
        keys.iter().cloned().zip(records.iter()),
        &|key| set.contains(key),
    );
    // Edged files and relative targets stage; the dead exporter, the
    // alias-only target (bare: a deliberate miss), and the edgeless
    // nested file unstage.
    for path in ["/v/src/app.ts", "/v/src/tokens.ts", "/v/src/base.ts", "/v/src/barrel.ts"] {
        assert!(plan.stages(&ModuleKey::new(path)), "{path} stages");
    }
    for path in ["/v/src/aliased.ts", "/v/src/dead.ts", "/v/src/plain.ts"] {
        assert!(!plan.stages(&ModuleKey::new(path)), "{path} unstages");
    }
}

/// The nested-import pathological arm, pinned: an `import` inside a
/// function body is invalid ESM — the record's top-level walk always
/// misses it, while the scope visitor may bind it. Whichever way this
/// toolchain's parser tolerates it, all three plans must agree (this
/// toolchain binds it: the test runs the full FROM-miss differential).
#[test]
fn nested_import_pinned_to_fallback_identical() {
    use crate::extract::scope;
    let content = "export const ok = 'yes'\nfunction g() {\n  import { q } from './base'\n  return q\n}";
    let base = "export const base = { color: 'red' }";
    let allocator = Allocator::default();
    let base_allocator = Allocator::default();
    let ret = Parser::new(&allocator, content, SourceType::ts()).parse();
    let base_ret = Parser::new(&base_allocator, base, SourceType::ts()).parse();
    assert!(!base_ret.panicked, "base parses");
    if ret.panicked {
        // The parser rejects the file outright: prod excludes panicked
        // files from retained and streamed alike, so every plan agrees
        // by construction (nothing stages, nothing refines).
        return;
    }
    let sources = vec![
        ("/v/src/nested.ts".to_string(), content.to_string()),
        ("/v/src/base.ts".to_string(), base.to_string()),
    ];
    let project = LocalConstants::new();
    let retained = vec![
        RetainedSource {
            path: sources[0].0.as_str(),
            content: sources[0].1.as_str(),
            program: &ret.program,
        },
        RetainedSource {
            path: sources[1].0.as_str(),
            content: sources[1].1.as_str(),
            program: &base_ret.program,
        },
    ];
    let refs: Vec<ImportRef> = scope::collect(&ret.program, &project)
        .import_refs()
        .into_iter()
        .filter(|imp| imp.local.as_ref() == "q")
        .collect();
    if refs.is_empty() {
        // The visitor drops the nested import: walk-invisible on every
        // arm, so the census correctly unstages the file.
        let record = module_graph::ModuleRecord::collect(&ret.program);
        let base_record = module_graph::ModuleRecord::collect(&base_ret.program);
        let set: std::collections::HashSet<ModuleKey> = ["/v/src/nested.ts", "/v/src/base.ts"]
            .iter()
            .map(|key| ModuleKey::new(key))
            .collect();
        let plan = StagingPlan::census(
            [
                (ModuleKey::new("/v/src/nested.ts"), &record),
                (ModuleKey::new("/v/src/base.ts"), &base_record),
            ]
            .into_iter(),
            &|key| set.contains(key),
        );
        assert!(!plan.stages(&ModuleKey::new("/v/src/nested.ts")));
        return;
    }
    // The visitor binds it: an unstaged walk start, served by the
    // fallback on the census and empty arms — all three must agree.
    let streamed = || Vec::new();
    let mut census = ValueGraph::new(&sources, &retained, streamed(), &project);
    let mut empty = ValueGraph::new_with_plan(
        &sources,
        &retained,
        streamed(),
        &project,
        StagingPlan::empty(),
    );
    let mut full = ValueGraph::new_with_plan(
        &sources,
        &retained,
        streamed(),
        &project,
        StagingPlan::full(
            ["/v/src/nested.ts", "/v/src/base.ts"]
                .iter()
                .map(|key| ModuleKey::new(key)),
        ),
    );
    let census_out = snapshot(census.resolve_file_imports("/v/src/nested.ts", &refs));
    let empty_out = snapshot(empty.resolve_file_imports("/v/src/nested.ts", &refs));
    let full_out = snapshot(full.resolve_file_imports("/v/src/nested.ts", &refs));
    assert_eq!(census_out, empty_out);
    assert_eq!(census_out, full_out);
}
