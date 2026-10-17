//! Census tests: the staging plan's edge matching, pinned against the scope visitor's own import
//! refs. Each snippet parses once, then the module record's outgoing specifiers and the scope refs
//! must name the same locals, so the census and the walker cannot drift apart. Takes parser
//! fixtures and emits assertions only; nothing here reaches the production census.

use super::*;
use oxc_allocator::Allocator;
use oxc_parser::Parser;
use oxc_span::SourceType;

/// Collect one snippet's record, asserting it parses cleanly.
fn record_of(content: &str) -> ModuleRecord {
    let allocator = Allocator::default();
    let ret = Parser::new(&allocator, content, SourceType::ts()).parse();
    assert!(!ret.panicked, "fixture parses");
    ModuleRecord::collect(&ret.program)
}

/// Census one edged file over the given source keys.
fn census_over(from: &str, content: &str, keys: &[&str]) -> StagingPlan {
    let record = record_of(content);
    let set: FxHashSet<ModuleKey> = keys.iter().map(|key| ModuleKey::new(key)).collect();
    StagingPlan::census([(ModuleKey::new(from), &record)].into_iter(), &|key| {
        set.contains(key)
    })
}

#[test]
fn exact_and_extension_targets_match() {
    let plan = census_over(
        "/v/src/app.ts",
        "import { a } from './tokens'\nimport { b } from './exact.ts'",
        &["/v/src/app.ts", "/v/src/tokens.ts", "/v/src/exact.ts"],
    );
    assert!(plan.stages(&ModuleKey::new("/v/src/app.ts")));
    assert!(plan.stages(&ModuleKey::new("/v/src/tokens.ts")));
    assert!(plan.stages(&ModuleKey::new("/v/src/exact.ts")));
}

#[test]
fn index_and_runtime_remap_targets_match() {
    let plan = census_over(
        "/v/src/app.ts",
        "import { a } from './dir'\nimport { b } from './legacy.js'",
        &["/v/src/app.ts", "/v/src/dir/index.ts", "/v/src/legacy.ts"],
    );
    assert!(plan.stages(&ModuleKey::new("/v/src/dir/index.ts")));
    assert!(plan.stages(&ModuleKey::new("/v/src/legacy.ts")));
}

#[test]
fn bare_absolute_and_empty_match_nothing() {
    for spec in ["@scope/pkg", "pkg/sub", "/abs/path", ""] {
        let target = match_relative_target("/v/src/app.ts", spec, &|_| true);
        assert!(target.is_none(), "{spec}");
    }
    let target = match_relative_target("/v/src/app.ts", "./tokens", &|_| false);
    assert!(target.is_none());
}

#[test]
fn slashless_importers_join_without_a_leading_slash() {
    // Mirrors the ladder's join_under: no dir means no leading slash.
    let target = match_relative_target("app.ts", "./tokens", &|key| key.as_str() == "tokens");
    assert_eq!(target.as_ref().map(ModuleKey::as_str), Some("tokens"));
}

#[test]
fn parent_segments_fold_before_matching() {
    let plan = census_over(
        "/v/src/ui/app.ts",
        "import { r } from '../recipes/one'",
        &["/v/src/ui/app.ts", "/v/src/recipes/one.ts"],
    );
    assert!(plan.stages(&ModuleKey::new("/v/src/recipes/one.ts")));
}

#[test]
fn hops_stars_and_default_hop_carry_outgoing_edges() {
    let plan = census_over(
        "/v/src/barrel.ts",
        "export { a } from './a'\nexport * from './b'\nexport { c as default } from './c'",
        &[
            "/v/src/barrel.ts",
            "/v/src/a.ts",
            "/v/src/b.ts",
            "/v/src/c.ts",
        ],
    );
    assert!(plan.stages(&ModuleKey::new("/v/src/barrel.ts")));
    assert!(plan.stages(&ModuleKey::new("/v/src/a.ts")));
    assert!(plan.stages(&ModuleKey::new("/v/src/b.ts")));
    assert!(plan.stages(&ModuleKey::new("/v/src/c.ts")));
}

#[test]
fn edgeless_files_unstage() {
    // Exports, side-effect imports, type imports, namespace-shape stars,
    // and require calls carry no outgoing specifier: all unstage.
    let cases = [
        "export const FACTOR_1 = 8",
        "import './side-effect'",
        "import type { T } from './types'",
        "export * as ns from './tokens'",
        "const y = require('./y')",
        "const z = await import('./z')",
    ];
    for content in cases {
        let record = record_of(content);
        assert!(outgoing_specifiers(&record).is_empty(), "{content}");
    }
}

#[test]
fn default_and_namespace_edges_count_as_outgoing() {
    // The walk refuses these without loading their targets, but the
    // census still stages both ends: over-staging, the safe direction.
    let record = record_of("import d from './d'\nimport * as n from './n'");
    assert_eq!(outgoing_specifiers(&record).len(), 2);
}

/// Local names the scope table binds as imports.
fn scope_refs(content: &str) -> Vec<String> {
    use crate::extract::constants::LocalConstants;
    use crate::extract::scope;
    let allocator = Allocator::default();
    let ret = Parser::new(&allocator, content, SourceType::ts()).parse();
    assert!(!ret.panicked, "fixture parses");
    let project = LocalConstants::new();
    let mut refs: Vec<String> = scope::collect(&ret.program, &project)
        .import_refs()
        .iter()
        .map(|imp| imp.local.to_string())
        .collect();
    refs.sort();
    refs
}

#[test]
fn scope_refs_match_record_edges() {
    // The FROM-leg invariant: the walk starts exactly where the census
    // stages. Both collectors share the ESM value-import filter.
    let cases = [
        ("import { a, b as c } from './t'", vec!["a", "c"]),
        ("import d from './d'", vec!["d"]),
        ("import * as n from './n'", vec!["n"]),
        ("import type { T } from './t'", vec![]),
        ("import { type T, v } from './t'", vec!["v"]),
        ("import './side-effect'", vec![]),
        ("export const x = 1", vec![]),
    ];
    for (content, expected) in cases {
        let record = record_of(content);
        let mut edged: Vec<String> = record
            .imports
            .iter()
            .map(|edge| edge.local.clone())
            .collect();
        edged.sort();
        assert_eq!(edged, expected, "{content}");
        assert_eq!(scope_refs(content), expected, "{content}");
    }
}
