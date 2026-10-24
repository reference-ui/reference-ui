//! The unbracketed chains Oxc recurses through, and the real code the chain count must leave alone.
//! A run of prefix operators, `?:`, `=>` or assignment longer than `MAX_OPEN` is refused with the line it crossed on, and a run
//! of exactly `MAX_OPEN` passes. The second group builds the sources a chain count could misread, each far past `MAX_OPEN`
//! tokens in total but never that many in one run: statements, lists, comparisons, optional members, minified code and
//! tokens hidden in strings and comments. None of them may be refused. The stack test, which runs only when
//! `SHARED_MEASURE_OUT` is set, parses each shape at the limit on a 16 MiB thread, the smallest stack a lane runs on.

use super::super::{check_nesting, scan_nesting, NestingRefusal, MAX_OPEN};
use oxc_span::SourceType;

fn ts() -> SourceType {
    SourceType::ts()
}

fn refused(line: u32) -> Result<usize, NestingRefusal> {
    Err(NestingRefusal {
        depth: MAX_OPEN + 1,
        line,
    })
}

/// The scan's and the gate's verdicts on `source`, which must agree.
fn verdict(source: &str) -> Result<usize, NestingRefusal> {
    let scanned = scan_nesting(source, ts());
    assert_eq!(check_nesting(source, ts()).is_ok(), scanned.is_ok());
    scanned
}

/// `unit` repeated `links` times between `head` and `tail`.
fn chain(head: &str, unit: &str, links: usize, tail: &str) -> String {
    format!("{head}{}{tail}\n", unit.repeat(links))
}

/// Each chain shape: its head, the unit that repeats, and the tail that ends the expression.
const SHAPES: [(&str, &str, &str, &str); 12] = [
    ("bang", "export default ", "!", "true"),
    ("tilde", "export default ", "~", "1"),
    ("minus", "export default ", "- ", "1"),
    ("plus", "export default ", "+ ", "1"),
    ("typeof", "export default ", "typeof ", "1"),
    ("void", "export default ", "void ", "1"),
    ("delete", "export default ", "delete ", "x"),
    ("await", "async function f() { return ", "await ", "1 }"),
    ("ternary", "export default ", "a ? 1 : ", "0"),
    ("arrow", "export default ", "x => ", "1"),
    ("assign", "", "b = ", "1"),
    ("compound", "", "b += ", "1"),
];

#[test]
fn a_run_at_the_limit_passes_and_one_link_more_is_refused() {
    for (name, head, unit, tail) in SHAPES {
        assert_eq!(
            verdict(&chain(head, unit, MAX_OPEN, tail)),
            Ok(if name == "await" { 1 } else { 0 }),
            "{name} at the limit"
        );
        let refusal = verdict(&chain(head, unit, MAX_OPEN + 1, tail));
        assert_eq!(refusal, refused(1), "{name} one past the limit");
    }
}

#[test]
fn a_refusal_names_the_line_the_run_crossed_the_limit_on() {
    let source = format!(
        "const a = 1;\n\n{}",
        chain("export default ", "!", MAX_OPEN + 1, "0")
    );
    assert_eq!(verdict(&source), refused(3));
}

#[test]
fn a_chain_inside_brackets_is_refused_too() {
    let source = chain("f({ a: [(", "a ? 1 : ", MAX_OPEN + 1, "0)] })");
    assert_eq!(verdict(&source), refused(1));
}

#[test]
fn a_mixed_run_of_prefix_operators_counts_as_one() {
    let source = chain("export default ", "!- ~", MAX_OPEN / 3 + 1, "1");
    assert_eq!(verdict(&source), refused(1));
}

#[test]
fn a_chain_split_by_lines_that_continue_the_expression_is_one_run() {
    let ternary = chain("const v =\n", "  a ?\n  1 :\n", MAX_OPEN, "  0");
    assert_eq!(verdict(&ternary), refused(2 * MAX_OPEN as u32));
    let curried = chain("const f =\n", "  x =>\n", MAX_OPEN + 1, "  1");
    assert!(verdict(&curried).is_err());
}

#[test]
fn a_prefix_run_continues_across_whitespace_and_comments() {
    let source = chain("export default ", "! /* c */\n", MAX_OPEN + 1, "true");
    assert_eq!(verdict(&source), refused(MAX_OPEN as u32 + 1));
}

fn unrefused(source: &str) {
    assert!(
        verdict(source).is_ok(),
        "refused: {}",
        &source[..source.len().min(80)]
    );
}

const MANY: usize = MAX_OPEN * 3;

#[test]
fn statements_end_a_run() {
    unrefused(&"x = a ? 1 : 2;".repeat(MANY));
    unrefused(&"x = a ? 1 : 2\n".repeat(MANY));
    unrefused(&"const f = x => x\n".repeat(MANY));
    unrefused(&"a = b = c = d\n".repeat(MANY));
    unrefused(&"v = !a;".repeat(MANY));
}

#[test]
fn commas_end_a_run() {
    unrefused(&format!("[{}0]", "a ? 1 : 2, ".repeat(MANY)));
    unrefused(&format!("f({}0)", "x => x, ".repeat(MANY)));
    unrefused(&format!("let {}z = 0", "a = 1, ".repeat(MANY)));
    unrefused(&format!("[{}0]", "-1, ".repeat(MANY)));
}

#[test]
fn a_closed_bracket_level_ends_its_run() {
    unrefused(&"(a ? 1 : 2)".repeat(MANY));
    unrefused(&"f(x => x)".repeat(MANY));
    unrefused(&"{ a = 1 }".repeat(MANY));
    unrefused(&"[x = 1]".repeat(MANY));
    let halves = format!(
        "((({}0))) + ((({}0)))",
        "a ? 1 : ".repeat(MAX_OPEN - 1),
        "a ? 1 : ".repeat(MAX_OPEN - 1)
    );
    unrefused(&halves);
}

#[test]
fn a_bracket_level_counts_apart_from_the_level_around_it() {
    let source = format!(
        "{}(0 + {}0){}0",
        "a ? 1 : ".repeat(MAX_OPEN - 10),
        "b ? 1 : ".repeat(MAX_OPEN - 10),
        " + 1 ? 1 : ".repeat(5)
    );
    unrefused(&source);
}

#[test]
fn operators_that_are_not_chain_links_are_not_counted() {
    unrefused(&"a == b != c === d !== e <= f >= g;".repeat(MANY));
    unrefused(&format!("x = {}b;", "a ?? ".repeat(MANY)));
    unrefused(&format!("x = a{};", "?.b".repeat(MANY)));
    unrefused(&format!("x = a{};", "?.[0]?.(1)".repeat(MANY)));
    unrefused(&format!("x = {}0;", "a && ".repeat(MANY)));
    unrefused(&format!("x = {}0;", "!a && ".repeat(MANY)));
    unrefused(&format!("x = 0{};", " + 1".repeat(MANY)));
    unrefused(&format!("x = a{};", "!".repeat(MANY)));
    unrefused(&format!("x = i{};", "-- - j".repeat(MANY)));
    unrefused(&format!("x = 1e5{};", " - 1e-5".repeat(MANY)));
}

#[test]
fn typescript_optional_markers_are_not_ternaries() {
    unrefused(&format!(
        "interface A {{ {} }}",
        "a?: string; ".repeat(MANY)
    ));
    unrefused(&format!(
        "interface A {{ {} }}",
        "m?(): void; ".repeat(MANY)
    ));
    unrefused(&format!("type A = {{ {} }}", "a?: string, ".repeat(MANY)));
    unrefused(&format!("function f({}z) {{}}", "a?, ".repeat(MANY)));
}

#[test]
fn minified_one_line_code_is_not_refused() {
    let minified = "var a=b?c:d,e=f=>g,h=!i;if(j){k=l?m:n}else{o=p}q=r&&s||t;";
    unrefused(&minified.repeat(MANY));
    unrefused(&format!("var {}z=0", "a=b?c:d,".repeat(MANY)));
    unrefused(&format!("x={{{}}}", "a:b?c:d,".repeat(MANY)));
}

#[test]
fn chain_tokens_in_strings_comments_templates_and_regexes_are_hidden() {
    let hidden = |unit: &str| unit.repeat(MANY);
    unrefused(&format!("x = '{}';", hidden("!")));
    unrefused(&format!("x = \"{}\";", hidden("a ? 1 : ")));
    unrefused(&format!("x = `{}`;", hidden("typeof ")));
    unrefused(&format!("/* {} */ x = 1;", hidden("x => ")));
    unrefused(&format!("// {}\nx = 1;", hidden("a = ")));
    unrefused(&format!("x = /{}/;", hidden("!")));
    unrefused(&format!("x = `${{a}} {} ${{b}}`;", hidden("= ")));
}

#[test]
fn keyword_operators_count_only_as_operators() {
    unrefused(&format!("x = a{};", ".typeof".repeat(MANY)));
    unrefused(&format!("x = {{ {} }};", "void: 1, ".repeat(MANY)));
    unrefused(&format!("x = {}0;", "await f() + ".repeat(MANY)));
    unrefused(&format!("x = {}0;", "typeof a + ".repeat(MANY)));
    unrefused(&format!(
        "x = {}0;",
        "avoid delete_ voided adelete + ".repeat(MANY)
    ));
    unrefused(&"typeof a; void b; delete c.d;".repeat(MANY));
}

/// A chain shape parsed by Oxc at the limit on a 16 MiB thread, the smallest stack any lane runs on. A shape that needs more
/// aborts the test process, so this runs only when `SHARED_MEASURE_OUT` is set, on a release build.
#[test]
fn oxc_parses_every_shape_at_the_limit_on_the_smallest_lane_stack() {
    if std::env::var_os("SHARED_MEASURE_OUT").is_none() {
        return;
    }
    for (name, head, unit, tail) in SHAPES {
        let source = chain(head, unit, MAX_OPEN, tail);
        let parsed = std::thread::Builder::new()
            .stack_size(16 << 20)
            .spawn(move || {
                let allocator = oxc_allocator::Allocator::default();
                let parsed = oxc_parser::Parser::new(&allocator, &source, ts()).parse();
                (parsed.errors.len(), parsed.panicked)
            })
            .expect("thread starts")
            .join()
            .expect("thread joins");
        assert_eq!(parsed.1, false, "{name} panicked");
    }
}
