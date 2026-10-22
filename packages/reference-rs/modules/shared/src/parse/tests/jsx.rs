//! JSX nesting in the pre-scan: element levels and the limit.
//! An element counts once its closing tag or its `/>` is seen, so one that never closes counts nothing. One group of tests
//! covers each miscount risk (comparisons, TypeScript generics, arrow generics, text or strings that mention `<`, and generic
//! function types, which TSX first reads as elements), plus the tag rules a start tag follows. Each risk repeats its shape
//! thousands of times, so a miscount that stays on the stack would refuse the file, and each bypass puts 5,000 nested
//! parentheses behind the shape that used to hide them.

use super::super::{scan_nesting, NestingRefusal, MAX_NESTING};
use oxc_span::SourceType;

fn tsx() -> SourceType {
    SourceType::tsx()
}

fn jsx() -> SourceType {
    SourceType::jsx()
}

fn ts() -> SourceType {
    SourceType::ts()
}

fn js() -> SourceType {
    SourceType::mjs()
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
fn jsx_elements_count_one_level_each_up_to_the_limit() {
    let closed = format!(
        "{}{}",
        "<div>".repeat(MAX_NESTING),
        "</div>".repeat(MAX_NESTING)
    );
    assert_eq!(scan_nesting(&closed, tsx()), Ok(MAX_NESTING));
    assert_eq!(scan_nesting(&closed, jsx()), Ok(MAX_NESTING));
    let too_deep = format!(
        "{}{}",
        "<div>".repeat(MAX_NESTING + 1),
        "</div>".repeat(MAX_NESTING + 1)
    );
    assert_eq!(
        scan_nesting(&too_deep, tsx()),
        Err(NestingRefusal {
            depth: MAX_NESTING + 1,
            line: 1
        })
    );
}

#[test]
fn the_refusal_names_the_line_of_the_element_that_crosses_the_limit() {
    let source = format!(
        "\n\n{}{}",
        "<p>".repeat(MAX_NESTING + 1),
        "</p>".repeat(MAX_NESTING + 1)
    );
    assert_eq!(
        scan_nesting(&source, tsx()),
        Err(NestingRefusal {
            depth: MAX_NESTING + 1,
            line: 3
        })
    );
}

#[test]
fn self_closing_elements_and_fragments_count_only_while_open() {
    let siblings = format!("<div>{}</div>", "<br />".repeat(5000));
    assert_eq!(scan_nesting(&siblings, tsx()), Ok(2));
    let fragments = format!("{}{}", "<>".repeat(MAX_NESTING), "</>".repeat(MAX_NESTING));
    assert_eq!(scan_nesting(&fragments, tsx()), Ok(MAX_NESTING));
    let too_deep = format!(
        "{}{}",
        "<>".repeat(MAX_NESTING + 1),
        "</>".repeat(MAX_NESTING + 1)
    );
    assert_eq!(
        scan_nesting(&too_deep, tsx()),
        Err(NestingRefusal {
            depth: MAX_NESTING + 1,
            line: 1
        })
    );
}

#[test]
fn comparisons_count_for_nothing_in_tsx() {
    let generic_looking = "if (a < b && c<d) x = e >= f < g;\n".repeat(3000);
    assert_eq!(scan_nesting(&generic_looking, tsx()), Ok(1));
    let plain = "const ok = a < b ? c : d < e;\n".repeat(3000);
    assert_eq!(scan_nesting(&plain, tsx()), Ok(0));
}

#[test]
fn typescript_generics_count_for_nothing_in_tsx() {
    let source =
        "const v = useState<number>(0);\nfoo<T>();\nconst m = new Map<string, Array<T>>();\n"
            .repeat(2000);
    assert_eq!(scan_nesting(&source, tsx()), Ok(2));
}

#[test]
fn arrow_generics_are_not_elements_in_tsx() {
    let source = "const f = <T,>(x: T) => x;\nconst g = <T extends unknown>(x: T) => x;\nconst h = <const T,>(x: T) => x;\n"
        .repeat(2000);
    assert_eq!(scan_nesting(&source, tsx()), Ok(1));
    assert_eq!(scan_nesting(&source, ts()), Ok(1));
}

#[test]
fn text_that_mentions_angle_brackets_is_not_a_tag() {
    let strings = "const s = \"<div>\";\n".repeat(2000);
    let templates = "const t = `<div>`;\n".repeat(2000);
    let comments = "// <div>\n/* <div> */\n".repeat(2000);
    let attribute = "const a = <a title=\"<div>\">x</a>;\n".repeat(2000);
    assert_eq!(scan_nesting(&strings, tsx()), Ok(0));
    assert_eq!(scan_nesting(&templates, tsx()), Ok(0));
    assert_eq!(scan_nesting(&comments, tsx()), Ok(0));
    assert_eq!(scan_nesting(&attribute, tsx()), Ok(1));
}

#[test]
fn jsx_text_is_raw_so_quotes_slashes_and_comment_openers_cannot_hide_a_tag() {
    let apostrophes = "const p = <p>don't &lt;div&gt; use <b>x</b></p>;\n".repeat(2000);
    assert_eq!(scan_nesting(&apostrophes, tsx()), Ok(2));
    let urls = "<p>see http://x</p>\n".repeat(2000);
    assert_eq!(scan_nesting(&urls, tsx()), Ok(1));
    // `/* open` is text, so `</p>` closes the paragraph and the 1023 children fit inside the div: depth 1024. A comment
    // read from the text would hide `</p>` and leave the depth at 1.
    let children = format!(
        "{}{}",
        "<i>".repeat(MAX_NESTING - 1),
        "</i>".repeat(MAX_NESTING - 1)
    );
    let open_comment = format!("<div><p>/* open</p>{children}</div>");
    assert_eq!(scan_nesting(&open_comment, tsx()), Ok(MAX_NESTING));
}

#[test]
fn an_element_inside_an_expression_container_nests_inside_its_braces() {
    let source = "<ul>{items.map(x => <li>{x < 2 ? <b/> : <i/>}</li>)}</ul>\n".repeat(2000);
    assert_eq!(scan_nesting(&source, tsx()), Ok(6));
}

#[test]
fn attribute_strings_take_no_escapes_and_a_comment_in_a_tag_hides_its_quote() {
    let attribute = "<a title=\"x\\\">y</a>\n".repeat(2000);
    assert_eq!(scan_nesting(&attribute, tsx()), Ok(1));
    let comment = "<a /* don't */ b=\"1\">x</a>\n".repeat(2000);
    assert_eq!(scan_nesting(&comment, tsx()), Ok(1));
}

#[test]
fn a_tag_with_type_arguments_is_one_element() {
    let source = "<Select<Option<string>> value=\"a\"><i /></Select>\n".repeat(1500);
    assert_eq!(scan_nesting(&source, tsx()), Ok(2));
}

#[test]
fn typescript_assertions_are_not_elements_outside_tsx() {
    let source = "const x = <any>y;\n".repeat(3000);
    assert_eq!(scan_nesting(&source, ts()), Ok(0));
}

#[test]
fn javascript_is_not_jsx_for_the_pre_scan() {
    let source = "<div>".repeat(2000);
    assert_eq!(scan_nesting(&source, js()), Ok(0));
}

#[test]
fn a_generic_function_type_cannot_hide_the_nesting_after_it() {
    let heads = [
        "type F = <T>(x: T) => T;",
        "declare const f: <U>(fn: (t: string) => U) => U[];",
        "interface A { <T>(x: T): T }",
        "interface A { map: <U>(fn: (t: string) => U) => U[] }",
        "type C = { <T>(x: T): T; <U>(y: U): U };",
    ];
    for head in heads {
        let source = format!("{head}\nx = {};\n", parens(DEEP));
        assert_eq!(scan_nesting(&source, tsx()), refused_at(2), "after {head}");
    }
}

#[test]
fn a_generic_function_type_repeated_adds_no_depth() {
    let alias = format!(
        "type F = <T>(x: T) => T;\n{}",
        "const a: Array<string> = [];\nexport function f(): Promise<void> { return g<number>(1) }\n".repeat(3000)
    );
    assert_eq!(scan_nesting(&alias, tsx()), Ok(2));
    let member = "interface A { map: <U>(fn: (t: string) => U) => U[] }\n".repeat(3000);
    assert_eq!(scan_nesting(&member, tsx()), Ok(2));
    let signature = "type C = { <T>(x: T): T };\n".repeat(3000);
    assert_eq!(scan_nesting(&signature, tsx()), Ok(1));
}

#[test]
fn text_that_cannot_hold_a_greater_than_or_a_closing_brace_ends_a_misread_element() {
    // `>` and `}` are not allowed in JSX text, so an element that meets one was a generic: it ends there, unclosed.
    let greater = format!("const f = <T>(x: T) => x;\n{};\n", parens(DEEP));
    assert_eq!(scan_nesting(&greater, tsx()), refused_at(2));
    let brace = format!("const o = {{ a: <T>(x) }};\n{};\n", parens(DEEP));
    assert_eq!(scan_nesting(&brace, tsx()), refused_at(2));
}

#[test]
fn an_element_after_a_comment_is_still_an_element() {
    let block = "x = /* c */ <div>it's (open</div>\n".repeat(3000);
    assert_eq!(scan_nesting(&block, tsx()), Ok(1));
    let line = "const l = [\n  // first\n  <A key=\"a\">it's (open</A>,\n];\n".repeat(3000);
    assert_eq!(scan_nesting(&line, tsx()), Ok(2));
}

#[test]
fn unclosed_elements_count_nothing_and_closed_ones_count_where_they_close() {
    assert_eq!(scan_nesting(&"<div>".repeat(5000), tsx()), Ok(0));
    let closed = |depth: usize| format!("{}{}", "<div>".repeat(depth), "</div>".repeat(depth));
    assert_eq!(scan_nesting(&closed(MAX_NESTING), tsx()), Ok(MAX_NESTING));
    assert_eq!(scan_nesting(&closed(MAX_NESTING + 1), tsx()), refused_at(1));
}

#[test]
fn a_refused_element_nest_names_the_line_of_the_element_that_crosses_the_limit() {
    let source = format!("{}x{}", "<p>\n".repeat(1100), "</p>\n".repeat(1100));
    assert_eq!(
        scan_nesting(&source, tsx()),
        Err(NestingRefusal {
            depth: MAX_NESTING + 1,
            line: 76
        })
    );
}

#[test]
fn type_arguments_that_never_close_cannot_make_the_scan_quadratic() {
    // Each `<a<` reads ahead for the `>` that closes its type arguments and never finds one. The reads are charged to the
    // scan's lookahead, which ends them after a few megabytes, not a thousand bytes for each of 800,000 tags.
    let source = "(<a<)".repeat(800_000);
    let started = std::time::Instant::now();
    assert_eq!(scan_nesting(&source, tsx()), Ok(1));
    assert!(
        started.elapsed() < std::time::Duration::from_secs(5),
        "the scan took {:?}",
        started.elapsed()
    );
}
