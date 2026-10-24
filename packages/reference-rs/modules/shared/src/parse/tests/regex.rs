//! Regex literals in the pre-scan: what a slash starts and what a regex can no longer hide.
//! A `/` where an expression can start opens a regex, which is skipped whole, so a quote or a backtick inside it cannot
//! start a string or a template that hides what follows. A division is not a regex. Each bypass test puts 5,000 nested
//! parentheses behind the shape that used to hide them, and each false-refusal test repeats a shape that used to count a level
//! per repeat.

use super::super::{scan_nesting, NestingRefusal, MAX_NESTING};
use super::measure::assert_linear;
use oxc_span::SourceType;

fn ts() -> SourceType {
    SourceType::ts()
}

const DEEP: usize = 5_000;

fn parens(depth: usize) -> String {
    format!("{}1{}", "(".repeat(depth), ")".repeat(depth))
}

fn refused_at(line: u32) -> Result<usize, NestingRefusal> {
    Err(NestingRefusal {
        depth: MAX_NESTING + 1,
        line,
    })
}

#[test]
fn a_regex_with_a_quote_cannot_hide_the_nesting_after_it() {
    for regex in [
        "/\"/", "/'/", "/[\"']/", "/`/", "/\\//", "/[/]/", "/\"[(]/", "/\\(\"/g",
    ] {
        let source = format!("x = {regex}; {};\n", parens(DEEP));
        assert_eq!(
            scan_nesting(&source, ts()),
            refused_at(1),
            "after the regex {regex}"
        );
    }
}

#[test]
fn a_regex_with_a_backtick_does_not_open_a_template() {
    let source = format!("const r = /`/;\n{};\n", parens(DEEP));
    assert_eq!(scan_nesting(&source, ts()), refused_at(2));
}

#[test]
fn a_slash_where_an_expression_starts_is_a_regex() {
    let openers = [
        "= ", "return ", "typeof ", "case ", "(", "[", ", ", "&& ", "? ", ": ", "! ", "=> ", "{ ",
        "; ", "} ",
    ];
    for before in openers {
        let source = format!("{before}/\"/.test(s); {};\n", parens(DEEP));
        assert_eq!(
            scan_nesting(&source, ts()),
            refused_at(1),
            "after {before:?}"
        );
    }
}

#[test]
fn a_slash_after_a_value_is_a_division_and_hides_nothing() {
    let deep = parens(DEEP);
    for before in ["a", "a[0]", "(a)", "1", "a.b", "this"] {
        let source = format!("x = {before} / {deep} / b;\n");
        assert_eq!(
            scan_nesting(&source, ts()),
            refused_at(1),
            "after {before:?}"
        );
    }
}

#[test]
fn a_keyword_used_as_a_property_name_does_not_start_an_expression() {
    let deep = parens(DEEP);
    for property in ["return", "typeof", "in", "default", "case"] {
        let source = format!("x = a.{property} / {deep} / b;\n");
        assert_eq!(
            scan_nesting(&source, ts()),
            refused_at(1),
            "after .{property}"
        );
    }
}

#[test]
fn a_slash_after_the_head_of_if_while_for_or_with_is_a_regex() {
    let heads = [
        "if (x)",
        "while (x)",
        "for (;;)",
        "with (o)",
        "else if (x)",
        "if (f(a, [b]))",
        "if (x) /* c */",
        "if (x)\n",
    ];
    for head in heads {
        let source = format!("{head} /\"/.test(s); {};\n", parens(DEEP));
        let line = if head.ends_with('\n') { 2 } else { 1 };
        assert_eq!(
            scan_nesting(&source, ts()),
            refused_at(line),
            "after {head:?}"
        );
    }
}

#[test]
fn a_slash_after_any_other_parenthesis_is_a_division() {
    let deep = parens(DEEP);
    for before in ["f(x)", "(a + b)", "iff (x)", "a.if (x)", "if (x) y(z)"] {
        let source = format!("{before} / {deep} / b;\n");
        assert_eq!(
            scan_nesting(&source, ts()),
            refused_at(1),
            "after {before:?}"
        );
    }
}

#[test]
fn of_is_an_identifier_not_a_keyword_that_takes_an_operand() {
    let source = format!("const of = 4;\nx = of / {} / 1;\n", parens(DEEP));
    assert_eq!(scan_nesting(&source, ts()), refused_at(2));
}

#[test]
fn a_slash_after_an_object_literal_is_a_division_and_after_a_block_a_regex() {
    let deep = parens(DEEP);
    for object in [
        "x = {}",
        "x = { a: 1 }",
        "y = z ? 1 : {}",
        "export default {}",
        "return {}",
        "throw {}",
    ] {
        let source = format!("{object} / {deep} / b;\n");
        assert_eq!(
            scan_nesting(&source, ts()),
            refused_at(1),
            "after {object:?}"
        );
    }
    let blocks = [
        "if (x) {}",
        "function f() {}",
        "else {}",
        "try {}",
        "class A {}",
        "x = () => {}",
        ";{}",
    ];
    for block in blocks {
        let source = format!("{block}\n/\"/.test(s); {deep};\n");
        assert_eq!(
            scan_nesting(&source, ts()),
            refused_at(2),
            "after {block:?}"
        );
    }
}

#[test]
fn a_slash_with_no_closing_slash_on_its_line_is_not_a_regex() {
    let source = format!("x = /\n{};\n", parens(DEEP));
    assert_eq!(scan_nesting(&source, ts()), refused_at(2));
    // A backslash at the end of the line does not carry the regex onto the next line, where a slash would close it.
    let escaped = format!("x = /a\\\n{} / 2;\n", parens(DEEP));
    assert_eq!(scan_nesting(&escaped, ts()), refused_at(2));
}

#[test]
fn a_regex_character_class_may_hold_a_slash_and_an_escaped_slash_does_not_close() {
    let class = format!("x = /[/\"]/; {};\n", parens(DEEP));
    assert_eq!(scan_nesting(&class, ts()), refused_at(1));
    let escaped = format!("x = /\\/\"/; {};\n", parens(DEEP));
    assert_eq!(scan_nesting(&escaped, ts()), refused_at(1));
}

#[test]
fn a_quote_class_regex_repeated_adds_no_depth() {
    let source = "const r = /[\"']/g; f((1));\n".repeat(3000);
    assert_eq!(scan_nesting(&source, ts()), Ok(2));
}

#[test]
fn a_backtick_regex_before_templates_leaves_the_templates_intact() {
    let source = "const r = /`/;\n".to_string() + &"const s = `a ${b} (c`;\n".repeat(3000);
    assert_eq!(scan_nesting(&source, ts()), Ok(1));
}

#[test]
fn a_comment_between_the_operator_and_the_slash_does_not_hide_the_regex() {
    let block = format!("x = /* c */ /\"/; {};\n", parens(DEEP));
    assert_eq!(scan_nesting(&block, ts()), refused_at(1));
    let line = format!("x = // c\n /\"/; {};\n", parens(DEEP));
    assert_eq!(scan_nesting(&line, ts()), refused_at(2));
    let chain = format!("x = /* a */ // b\n /* c */ /\"/; {};\n", parens(DEEP));
    assert_eq!(scan_nesting(&chain, ts()), refused_at(2));
}

#[test]
fn slashes_that_never_close_cannot_make_the_scan_quadratic() {
    // Each `=/[` opens a class that swallows the rest of the line, so each slash reads ahead to the end of it. The reads are
    // charged to the scan's lookahead, which ends them after a few megabytes, not a thousand reads of eight. The source
    // doubles in slashes and in filler together, so a read per slash across the line would quadruple the time.
    assert_linear(
        "unclosed regex classes",
        250,
        |slashes| {
            format!(
                "{}{}{}\n",
                "=/[".repeat(slashes),
                "x".repeat(slashes * 2_000),
                "]".repeat(slashes)
            )
        },
        |source| assert!(scan_nesting(source, ts()).is_ok()),
    );
}
