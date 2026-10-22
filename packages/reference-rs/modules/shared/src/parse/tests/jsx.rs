//! JSX nesting in the pre-scan: element levels and the limit.
//! One group of tests covers each miscount risk (comparisons, TypeScript generics, arrow generics, and text or strings that
//! mention `<`), plus the tag rules a start tag follows.
//! Each risk repeats its shape thousands of times, so a miscount that stays on the stack would refuse the file.

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

#[test]
fn jsx_elements_count_one_level_each_up_to_the_limit() {
    let closed = format!("{}{}", "<div>".repeat(MAX_NESTING), "</div>".repeat(MAX_NESTING));
    assert_eq!(scan_nesting(&closed, tsx()), Ok(MAX_NESTING));
    assert_eq!(scan_nesting(&closed, jsx()), Ok(MAX_NESTING));
    assert_eq!(
        scan_nesting(&"<div>".repeat(MAX_NESTING + 1), tsx()),
        Err(NestingRefusal {
            depth: MAX_NESTING + 1,
            line: 1
        })
    );
}

#[test]
fn the_refusal_names_the_line_of_the_element_that_crosses_the_limit() {
    let source = format!("\n\n{}", "<p>".repeat(MAX_NESTING + 1));
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
    assert_eq!(
        scan_nesting(&"<>".repeat(MAX_NESTING + 1), tsx()),
        Err(NestingRefusal {
            depth: MAX_NESTING + 1,
            line: 1
        })
    );
}

#[test]
fn comparisons_count_for_nothing_in_tsx() {
    let generic_looking = "if (a < b && c<d) x = e >= f < g;\n".repeat(3000);
    assert_eq!(scan_nesting(&generic_looking, tsx()), Ok(2));
    let plain = "const ok = a < b ? c : d < e;\n".repeat(3000);
    assert_eq!(scan_nesting(&plain, tsx()), Ok(0));
}

#[test]
fn typescript_generics_count_for_nothing_in_tsx() {
    let source = "const v = useState<number>(0);\nfoo<T>();\nconst m = new Map<string, Array<T>>();\n".repeat(2000);
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
    // read from the text would hide `</p>` and leave the depth at 2.
    let open_comment = format!("<div><p>/* open</p>{}</div>", "<i>".repeat(MAX_NESTING - 1));
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
