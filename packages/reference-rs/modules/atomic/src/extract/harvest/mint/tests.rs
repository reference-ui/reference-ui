//! Mint driver tests: the kind gate, twin suppression, and the color allowlist.
//!
//! Gate assertions mint one pool value at a time onto a bare sink over a
//! caller-supplied system (`bare_system` for the tokenless floor,
//! `token_system` for the token-license arm); reporting assertions drive
//! the real `mint()` over an empty seed.

use smallvec::SmallVec;

use super::super::sinks::SinkSite;
use super::*;

/// A bare `(prop, when)` sink for gate assertions.
fn sink_for(prop: &str) -> Sink {
    Sink::for_site(SinkSite {
        prop,
        when: &SmallVec::new(),
        file: "t.ts",
        line: None,
        column: None,
        span: None,
    })
    .expect("known style prop sinks")
}

/// Mint the pool values onto one sink over the given wants; the count.
fn mint_count(
    pool_values: &[&str],
    sink: &Sink,
    wants: &mut Vec<Want>,
    system: &BaseSystem,
) -> usize {
    let mut pool = HarvestPool::default();
    for value in pool_values {
        pool.insert(value);
    }
    let mut authored = Vec::new();
    let mut state = MintState {
        seen: wants.iter().map(twin_key_for).collect(),
        wants,
        authored: &mut authored,
    };
    mint_sink(&pool, sink, &mut state, system).count
}

/// A tokenless system: the allowlist's token arm never fires.
fn bare_system() -> BaseSystem {
    BaseSystem::default()
}

/// A system declaring one color token plus a decoy in another category.
fn token_system() -> BaseSystem {
    use base_system::TokenLeaf;

    let mut system = BaseSystem::default();
    system.tokens.insert_leaf(TokenLeaf {
        category: "colors",
        path: "white",
        light: "#fff",
        dark: "#fff",
    });
    system.tokens.insert_leaf(TokenLeaf {
        category: "spacing",
        path: "red",
        light: "1px",
        dark: "1px",
    });
    system
}

#[test]
fn auto_none_gate_on_validity_tables() {
    let system = bare_system();
    let order = sink_for("order");
    let margin_top = sink_for("marginTop");
    let mut wants = Vec::new();
    assert_eq!(mint_count(&["auto"], &order, &mut wants, &system), 0);
    assert_eq!(mint_count(&["auto"], &margin_top, &mut wants, &system), 1);
    let display = sink_for("display");
    let color = sink_for("color");
    assert_eq!(mint_count(&["none"], &display, &mut wants, &system), 1);
    assert_eq!(mint_count(&["none"], &color, &mut wants, &system), 0);
}

#[test]
fn css_wide_keywords_ride_everywhere() {
    let system = bare_system();
    let order = sink_for("order");
    let mut wants = Vec::new();
    assert_eq!(mint_count(&["inherit"], &order, &mut wants, &system), 1);
    assert_eq!(mint_count(&["var(--x)"], &order, &mut wants, &system), 1);
}

/// Mint the pool values onto one sink; the kind-accepted offering.
fn mint_offered(
    pool_values: &[&str],
    sink: &Sink,
    wants: &mut Vec<Want>,
    system: &BaseSystem,
) -> Vec<Box<str>> {
    let mut pool = HarvestPool::default();
    for value in pool_values {
        pool.insert(value);
    }
    let mut authored = Vec::new();
    let mut state = MintState {
        seen: wants.iter().map(twin_key_for).collect(),
        wants,
        authored: &mut authored,
    };
    mint_sink(&pool, sink, &mut state, system).offered
}

#[test]
fn offering_keeps_twin_skipped_values() {
    let system = bare_system();
    let color = sink_for("color");
    let mut wants = vec![Want::new("color", AtomValue::String("inherit".into()))];
    assert_eq!(
        mint_offered(&["inherit"], &color, &mut wants, &system),
        vec!["inherit".into()]
    );
    assert_eq!(
        mint_offered(&["inherit"], &color, &mut Vec::new(), &system),
        vec!["inherit".into()]
    );
    let width = sink_for("width");
    assert!(mint_offered(&["red"], &width, &mut Vec::new(), &system).is_empty());
}

#[test]
fn alias_twins_and_exact_dupes_skip() {
    let system = bare_system();
    let mt = sink_for("mt");
    let mut wants = vec![Want::new("marginTop", AtomValue::String("1px".into()))];
    assert_eq!(mint_count(&["1px", "2px"], &mt, &mut wants, &system), 1);
    let color = sink_for("color");
    let mut wants = vec![Want::new("color", AtomValue::String("inherit".into()))];
    assert_eq!(mint_count(&["inherit"], &color, &mut wants, &system), 0);
}

#[test]
fn color_allowlist_blocks_expressions_and_unlicensed_words() {
    let system = bare_system();
    let color = sink_for("color");
    let mut wants = Vec::new();
    for value in [
        "oklch(0.7 0.1 180)",
        "rgb(0,0,0)",
        "color-mix(in srgb, red 50%, blue)",
        "#0af",
        "red",
        "white",
    ] {
        assert_eq!(mint_count(&[value], &color, &mut wants, &system), 0, "{value}");
    }
    for value in [
        "currentColor",
        "CURRENTCOLOR",
        "transparent",
        "Transparent",
        "inherit",
        "initial",
        "unset",
        "revert",
        "revert-layer",
    ] {
        assert_eq!(
            mint_count(&[value], &color, &mut Vec::new(), &system),
            1,
            "{value}"
        );
    }
}

#[test]
fn color_allowlist_licenses_declared_color_tokens() {
    let system = token_system();
    let color = sink_for("color");
    assert_eq!(
        mint_count(&["white"], &color, &mut Vec::new(), &system),
        1,
        "colors.white licenses the literal"
    );
    assert_eq!(
        mint_count(&["red"], &color, &mut Vec::new(), &system),
        0,
        "spacing.red is no color token"
    );
    assert_eq!(
        mint_count(&["White"], &color, &mut Vec::new(), &system),
        0,
        "token matching is case-sensitive, fail closed"
    );
}

#[test]
fn opaque_references_never_mint_a_color_but_ride_elsewhere() {
    let system = bare_system();
    let color = sink_for("color");
    let order = sink_for("order");
    for value in ["var(--spacing-4r, 16px)", "var(--x)", "env(safe-area-inset-top)"] {
        assert_eq!(
            mint_count(&[value], &color, &mut Vec::new(), &system),
            0,
            "{value} on color"
        );
    }
    assert_eq!(
        mint_count(&["var(--x)"], &order, &mut Vec::new(), &system),
        1,
        "var rides off color positions"
    );
}

#[test]
fn none_stays_oracle_gated_on_color_props() {
    let system = bare_system();
    let fill = sink_for("fill");
    let color = sink_for("color");
    assert_eq!(mint_count(&["none"], &fill, &mut Vec::new(), &system), 1);
    assert_eq!(mint_count(&["none"], &color, &mut Vec::new(), &system), 0);
}

#[test]
fn empty_sinks_skip_seed_without_effects() {
    let pool = HarvestPool::default();
    let system = BaseSystem::default();
    let mut wants = vec![Want::new("color", AtomValue::String("red".into()))];
    let mut authored = Vec::new();
    let mut diagnostics = Vec::new();
    let mut session = DiagnosticsSession::new();
    mint(MintCtx {
        pool: &pool,
        sinks: &[],
        system: &system,
        wants: &mut wants,
        authored: &mut authored,
        diagnostics: &mut diagnostics,
        sink: &mut session,
    });
    assert_eq!(wants.len(), 1);
    assert!(authored.is_empty());
    assert!(diagnostics.is_empty());
    assert!(session.facts().is_empty());
}

#[test]
fn mint_reports_fact_and_legacy_info() {
    let mut pool = HarvestPool::default();
    pool.insert("inherit");
    let sink = sink_for("color");
    let system = BaseSystem::default();
    let mut wants = Vec::new();
    let mut authored = Vec::new();
    let mut diagnostics = Vec::new();
    let mut session = DiagnosticsSession::new();
    mint(MintCtx {
        pool: &pool,
        sinks: std::slice::from_ref(&sink),
        system: &system,
        wants: &mut wants,
        authored: &mut authored,
        diagnostics: &mut diagnostics,
        sink: &mut session,
    });
    assert!(matches!(
        session.facts(),
        [DiagnosticFact::HarvestOutcome { minted: 1, .. }]
    ));
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(
        diagnostics[0].message,
        "color under []: 1 harvested value minted"
    );
    assert_eq!(diagnostics[0].file.as_deref(), Some("t.ts"));
}
