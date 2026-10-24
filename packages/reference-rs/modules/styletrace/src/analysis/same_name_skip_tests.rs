//! Pins that skipping a declared same-name re-export changes nothing the trace reports.
//! Each case writes a small scratch tree, loads every file, and runs the binding collection twice: once as the trace runs it, with the outer module set that arms the skip, and once with that set empty, which walks every declared re-export to its end.
//! It asserts the bindings and the owned-props map are identical, and that the declared-only component is still recorded, so a skip that dropped real contributions would fail here.

use std::collections::{BTreeMap, BTreeSet};
use std::path::PathBuf;

use rustc_hash::FxHashMap;
use shared::testing::ScratchWorkspace;

use super::analyzer::StyleTraceAnalyzer;
use super::model::{TraceModule, TracedBinding};
use super::parser::parse_trace_module;
use super::surface::{StyleSurface, TraceSources};

/// Keeps `title` for itself and reaches no primitive: a declared-only export.
const CARD: &str =
    "export function Card({ title }: { title?: string }) {\n  return <span>{title}</span>\n}\n";

/// Reaches a primitive, so it traces.
const BUTTON: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "export function Button(props: { p?: string }) {\n  return <Div {...props} />\n}\n",
);

const DEFAULT_CARD: &str = "export default function Card({ title }: { title?: string }) {\n  return <span>{title}</span>\n}\n";

type Owned = BTreeMap<String, BTreeSet<String>>;

/// Bindings and owned props, with the skip armed or with the outer module set left empty.
fn collect(files: &[(&str, String)], skip: bool) -> (Vec<TracedBinding>, Owned) {
    let scratch = ScratchWorkspace::new_in(
        &std::env::temp_dir(),
        "same-name-skip",
        "reference-rs-styletrace",
    );
    let surface = StyleSurface::new(
        BTreeSet::from(["p".to_string()]),
        BTreeSet::from(["Div".to_string()]),
    );
    let staged = FxHashMap::default();
    let programs = FxHashMap::default();
    let sources = TraceSources {
        staged: &staged,
        programs: &programs,
    };
    let mut modules: BTreeMap<PathBuf, TraceModule> = BTreeMap::new();
    for (name, text) in files {
        scratch.write(name, text);
        let path = scratch.root().join(name);
        let module =
            parse_trace_module(&path, scratch.root(), &surface, &sources).expect("fixture parses");
        modules.insert(path, module);
    }
    let paths: Vec<PathBuf> = modules.keys().cloned().collect();
    let mut analyzer =
        StyleTraceAnalyzer::new(modules, surface, scratch.root().to_path_buf(), &sources);
    if skip {
        analyzer.outer_modules = paths.iter().cloned().collect();
    }
    let bindings = analyzer
        .collect_bindings(&paths, scratch.root())
        .expect("collects");
    (bindings, analyzer.take_owned_props())
}

/// Asserts both runs agree, and that `owned_key` still carries the declared component's prop.
fn assert_parity(files: &[(&str, &str)], owned_key: &str) {
    let files: Vec<(&str, String)> = files.iter().map(|(n, t)| (*n, (*t).to_string())).collect();
    let skipped = collect(&files, true);
    let walked = collect(&files, false);
    assert_eq!(skipped, walked, "the skip changed the report");
    let owned = skipped
        .1
        .get(owned_key)
        .expect("the declared component is recorded");
    assert!(
        owned.contains("title"),
        "{owned_key} lost its owned prop: {owned:?}"
    );
}

#[test]
fn named_chain() {
    let both = format!("{CARD}{BUTTON}");
    assert_parity(
        &[
            ("index.tsx", "export { Card, Button } from './a'\n"),
            ("a.tsx", "export { Card, Button } from './b'\n"),
            ("b.tsx", &both),
        ],
        "Card",
    );
}

#[test]
fn star_barrel_over_a_chain() {
    assert_parity(
        &[
            ("index.tsx", "export * from './a'\n"),
            ("a.tsx", "export { Card } from './c'\n"),
            ("c.tsx", CARD),
        ],
        "Card",
    );
}

#[test]
fn namespace_expansion_keeps_the_walk() {
    assert_parity(
        &[
            ("index.tsx", "export * as NS from './a'\n"),
            ("a.tsx", "export { Card } from './c'\n"),
            ("c.tsx", CARD),
        ],
        "NS.Card",
    );
}

#[test]
fn default_reexport_takes_the_binding_name() {
    assert_parity(
        &[
            ("index.tsx", "export { default } from './a'\n"),
            ("a.tsx", "export { default } from './c'\n"),
            ("c.tsx", DEFAULT_CARD),
        ],
        "Card",
    );
}

#[test]
fn alias_chain() {
    assert_parity(
        &[
            ("index.tsx", "export { Card as Panel } from './a'\n"),
            ("a.tsx", "export { Card } from './c'\n"),
            ("c.tsx", CARD),
        ],
        "Panel",
    );
}

#[test]
fn cycle_beside_a_declaration() {
    assert_parity(
        &[
            (
                "a.tsx",
                "export { Card } from './b'\nexport { Loop } from './b'\n",
            ),
            (
                "b.tsx",
                "export { Card } from './a'\nexport { Loop } from './a'\n",
            ),
            ("c.tsx", CARD),
        ],
        "Card",
    );
}
