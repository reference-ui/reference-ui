//! Lexing holes the second review found, each rebuilt with a nest hidden behind it.
//! A regex after the `)` of an `if` was read as a division, `of` was read as a keyword, a division after an object literal was
//! read as a regex, and a TSX generic function type was read as an element whose text hid what followed. Each test builds a shape
//! from the review's probe with 5,000 nested levels. A `)` inside a string keeps the raw net from counting those levels, so only
//! the main scan can refuse the source.

use super::super::{scan_nesting, NestingRefusal, MAX_NESTING};
use oxc_span::SourceType;

fn ts() -> SourceType {
    SourceType::ts()
}

fn tsx() -> SourceType {
    SourceType::tsx()
}

const DEEP: usize = 5_000;

fn refused_at(line: u32) -> Result<usize, NestingRefusal> {
    Err(NestingRefusal {
        depth: MAX_NESTING + 1,
        line,
    })
}

/// 5,000 nested parentheses that each hold a string with a `)`, joined by `sep`: the raw net sees one level, the scan 5,000.
fn deflated(sep: &str) -> String {
    format!("{}1{}", format!("(')'{sep}").repeat(DEEP), ")".repeat(DEEP))
}

#[test]
fn a_regex_after_the_head_of_an_if_cannot_hide_a_call_chain() {
    let calls = "(')'".repeat(DEEP) + &")".repeat(DEEP + 1);
    let source = format!("if (x) /'/.test(s); f{calls}\n");
    assert_eq!(scan_nesting(&source, ts()), refused_at(1));
}

#[test]
fn a_regex_after_the_head_of_an_if_cannot_hide_a_sum() {
    let source = format!("if (x) /'/.test(s); y = {};\n", deflated(" + "));
    assert_eq!(scan_nesting(&source, ts()), refused_at(1));
}

#[test]
fn a_regex_after_the_head_of_an_if_cannot_hide_plain_parentheses() {
    let source = format!(
        "if (x) /'/.test(s); y = {}1{};\n",
        "(".repeat(DEEP),
        ")".repeat(DEEP)
    );
    assert_eq!(scan_nesting(&source, ts()), refused_at(1));
}

#[test]
fn a_regex_after_the_head_of_an_if_cannot_hide_generics() {
    let source = format!(
        "if (x) /'/.test(s); type A = {}string{};\n",
        "Array<".repeat(DEEP),
        ">".repeat(DEEP)
    );
    assert_eq!(scan_nesting(&source, ts()), refused_at(1));
}

#[test]
fn a_regex_after_the_head_of_an_if_cannot_hide_elements() {
    let source = format!(
        "if (x) /'/.test(s); y = {}x{};\n",
        "<div>".repeat(DEEP),
        "</div>".repeat(DEEP)
    );
    assert_eq!(scan_nesting(&source, tsx()), refused_at(1));
}

#[test]
fn of_is_an_identifier_and_a_slash_after_it_is_a_division() {
    let source = format!("let of = 1;\nx = of / {} / 1;\n", deflated(" + "));
    assert_eq!(scan_nesting(&source, ts()), refused_at(2));
}

#[test]
fn a_slash_after_an_object_literal_is_a_division() {
    let source = format!("x = {{}} / {} / 1;\n", deflated(" + "));
    assert_eq!(scan_nesting(&source, ts()), refused_at(1));
}

#[test]
fn a_generic_function_type_in_tsx_cannot_hide_a_nest_behind_a_stray_greater_than() {
    let source = format!(
        "type F = <T>(a: {}string{}) => T;\n",
        "(')' | ".repeat(DEEP),
        ")".repeat(DEEP)
    );
    assert_eq!(scan_nesting(&source, tsx()), refused_at(1));
}
