//! Depth-gate tests: a chain per construct past the limit, the exact limit, and the located refusal.
//! Each test parses on a 256 MiB thread, so a chain that Oxc parses by recursion stays clear of the harness's small
//! stack. The tests take inline sources, run the gate or `parse_source` on them, and emit assertion failures that
//! name the chain shape the gate let through or refused wrongly.

use oxc_allocator::Allocator;
use oxc_parser::Parser;
use oxc_span::SourceType;
use shared::parse::ScreenedSource;

use super::{check, MAX_DEPTH};

/// Runs `body` on a thread with a 32 MiB stack and returns its result.
fn on_big_stack<T: Send>(body: impl FnOnce() -> T + Send) -> T {
    std::thread::scope(|scope| {
        std::thread::Builder::new()
            .stack_size(256 << 20)
            .spawn_scoped(scope, body)
            .map(|worker| worker.join().expect("test thread panicked"))
            .expect("test thread did not start")
    })
}

/// True when `code` parses as TypeScript and the depth gate refuses it.
fn refused(code: &str) -> bool {
    refused_named("chain", code)
}

/// `refused` with the chain's name in the failure message.
fn refused_named(name: &str, code: &str) -> bool {
    let allocator = Allocator::default();
    let parsed = Parser::new(&allocator, code, SourceType::ts()).parse();
    assert!(!parsed.panicked, "the {name} chain must parse");
    check(&parsed.program).is_err()
}

/// The chain shapes the walkers recurse through, each as a statement of `count` links.
fn chains(count: usize) -> Vec<(&'static str, String)> {
    let at = |head: &str, link: &str, tail: &str| format!("export const z = {head}{}{tail}\n", link.repeat(count));
    vec![
        ("unary", at("", "!", "x")),
        ("negation", at("", "- ", "1")),
        ("void", at("", "void ", "1")),
        ("binary", at("1", " + 1", "")),
        ("logical", at("a", " || a", "")),
        ("conditional alternate", at("", "a ? 1 : ", "2")),
        ("member", at("a", ".b", "")),
        ("computed member", at("a", "['b']", "")),
        ("optional chain", at("a", "?.b", "")),
        ("call chain", at("a", "()", "")),
        ("as chain", at("x", " as any", "")),
        ("non-null chain", at("x", "!", "")),
        ("assignment chain", format!("let a; export const z = {}a\n", "a = ".repeat(count))),
        ("arrow chain", at("", "() => ", "1")),
        ("type array chain", format!("export type Z = number{};\n", "[]".repeat(count))),
        ("else-if chain", format!("if (a) {{}}{}\n", " else if (a) {}".repeat(count))),
        ("conditional type chain", format!("export type Z<X> = {}2;\n", "X extends string ? 1 : ".repeat(count))),
    ]
}

#[test]
fn every_chain_shape_past_the_limit_is_refused() {
    on_big_stack(|| {
        for (name, code) in chains(MAX_DEPTH + 100) {
            assert!(refused_named(name, &code), "{name} chain of {} links must be refused", MAX_DEPTH + 100);
        }
    });
}

#[test]
fn every_chain_shape_well_under_the_limit_passes() {
    on_big_stack(|| {
        for (name, code) in chains(MAX_DEPTH / 4) {
            assert!(!refused_named(name, &code), "{name} chain of {} links must pass", MAX_DEPTH / 4);
        }
    });
}

#[test]
fn the_limit_is_exact_for_a_binary_chain() {
    on_big_stack(|| {
        // The statement and the declarator's init cost a few levels; the smallest refused chain sits within ten of the limit.
        let smallest = (MAX_DEPTH - 10..=MAX_DEPTH + 10)
            .find(|links| refused(&format!("export const z = 1{}\n", " + 1".repeat(*links))))
            .expect("a chain within ten links of the limit must be refused");
        assert!(!refused(&format!("export const z = 1{}\n", " + 1".repeat(smallest - 1))));
        assert!(refused(&format!("export const z = 1{}\n", " + 1".repeat(smallest))));
    });
}

#[test]
fn a_hundred_thousand_links_end_the_walk_at_the_limit() {
    on_big_stack(|| {
        let code = format!("export const z = 1{}\n", " + 1".repeat(100_000));
        assert!(refused(&code));
    });
}

#[test]
fn the_refusal_names_the_line_of_the_node_that_crossed() {
    on_big_stack(|| {
        let code = format!("export const a = 1\nexport const b = 2\nexport const z = 1{}\n", " + 1".repeat(MAX_DEPTH + 50));
        let allocator = Allocator::default();
        let source = ScreenedSource::screen(code, SourceType::ts());
        let parsed = crate::parse_source(&source, &allocator);
        assert!(parsed.panicked);
        assert_eq!(parsed.errors.len(), 1);
        assert_eq!(
            parsed.errors[0].message,
            format!(
                "code nested deeper than {MAX_DEPTH} levels at line 3; split or flatten the long chain of operators, else-if branches or conditional types"
            )
        );
    });
}

#[test]
fn a_bracket_nest_the_shared_gate_accepts_passes() {
    on_big_stack(|| {
        let code = format!("export const z = {}1{}\n", "(".repeat(1000), ")".repeat(1000));
        assert!(!refused(&code));
    });
}
