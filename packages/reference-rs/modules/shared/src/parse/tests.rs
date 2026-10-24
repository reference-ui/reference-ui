//! Unit tests for the nesting gate.
//! They pin the limit and the line it reports, what the scan skips (strings, comments, template text), how TypeScript
//! generics count against plain JavaScript, that comparisons never accumulate depth, and the Oxc failure shape of a
//! refusal. A source within the bound must reach Oxc unchanged. The submodules hold the JSX rules, the regex rule, unclosed
//! `<`, the raw net, the screened sources that carry their verdict to the parse, and the measurements, which run only when
//! `SHARED_MEASURE_OUT` names a file.

use oxc_allocator::Allocator;
use oxc_span::SourceType;

use super::{
    line_start, parse_bounded, refused_parser_return, scan_nesting, NestingRefusal, MAX_NESTING,
};

mod chains;
mod generated;
mod holes;
mod jsx;
mod measure;
mod raw;
mod regex;
mod screened;
mod unclosed;

fn ts() -> SourceType {
    SourceType::ts()
}

fn js() -> SourceType {
    SourceType::mjs()
}

#[test]
fn brackets_count_and_the_limit_is_inclusive() {
    assert_eq!(
        scan_nesting(&"(".repeat(MAX_NESTING), ts()),
        Ok(MAX_NESTING)
    );
    assert_eq!(
        scan_nesting(&"(".repeat(MAX_NESTING + 1), ts()),
        Err(NestingRefusal {
            depth: MAX_NESTING + 1,
            line: 1
        })
    );
}

#[test]
fn refusal_names_the_line_where_the_limit_is_crossed() {
    let source = format!("\n\n{}", "[".repeat(MAX_NESTING + 1));
    assert_eq!(
        scan_nesting(&source, ts()),
        Err(NestingRefusal {
            depth: MAX_NESTING + 1,
            line: 3
        })
    );
}

#[test]
fn refusal_message_names_the_line_and_the_fix() {
    let refusal = NestingRefusal {
        depth: MAX_NESTING + 1,
        line: 7,
    };
    assert_eq!(
        refusal.message(),
        "nesting deeper than 1024 levels at line 7; split or flatten the deeply nested expression"
    );
}

#[test]
fn closed_brackets_release_depth_for_later_siblings() {
    let siblings = "f({ a: [1] }); ".repeat(MAX_NESTING * 4);
    assert_eq!(scan_nesting(&siblings, ts()), Ok(3));
}

#[test]
fn strings_comments_and_template_text_hide_their_brackets() {
    let hidden = "(".repeat(MAX_NESTING * 2);
    let source = format!(
        "const s = \"{hidden}\";\n// {hidden}\n/* {hidden} */\nconst t = `{hidden}`;\nconst u = 'x';\n"
    );
    assert_eq!(scan_nesting(&source, ts()), Ok(0));
}

#[test]
fn an_unterminated_string_stops_at_its_line() {
    let source = format!(
        "const s = \"{}\nconst t = (1);\n",
        "(".repeat(MAX_NESTING * 2)
    );
    assert_eq!(scan_nesting(&source, ts()), Ok(1));
}

#[test]
fn template_expressions_count_and_return_to_the_text() {
    assert_eq!(scan_nesting("`a${ (1) }b${ [2] }c`", ts()), Ok(2));
    let nested = format!("`{}", "${`".repeat(MAX_NESTING + 1));
    assert!(matches!(
        scan_nesting(&nested, ts()),
        Err(NestingRefusal { depth, .. }) if depth == MAX_NESTING + 1
    ));
}

#[test]
fn typescript_generics_nest_and_plain_javascript_does_not() {
    let generics = format!(
        "let x: {}string{};",
        "Array<".repeat(MAX_NESTING + 1),
        ">".repeat(MAX_NESTING + 1)
    );
    assert!(matches!(
        scan_nesting(&generics, ts()),
        Err(NestingRefusal { depth, .. }) if depth == MAX_NESTING + 1
    ));
    assert_eq!(scan_nesting(&generics, js()), Ok(0));
}

#[test]
fn comparisons_do_not_accumulate_depth() {
    assert_eq!(scan_nesting(&"a<b;".repeat(5000), ts()), Ok(0));
    assert_eq!(
        scan_nesting(&"if (a<b) f(c<d);\n".repeat(5000), ts()),
        Ok(1)
    );
}

#[test]
fn arrows_inside_generics_close_cleanly() {
    let source = "let f: Array<() => void> = g;\n".repeat(3000);
    assert_eq!(scan_nesting(&source, ts()), Ok(2));
}

#[test]
fn a_refused_source_gives_oxc_failure_shape_with_no_program() {
    let allocator = Allocator::default();
    let parsed = refused_parser_return(&allocator, ts());
    assert!(parsed.panicked);
    assert!(parsed.program.body.is_empty());
    assert!(parsed.errors.is_empty());
}

#[test]
fn line_start_is_the_byte_after_the_previous_newline() {
    let source = "ab\ncd\n\nef";
    assert_eq!(line_start(source, 1), 0);
    assert_eq!(line_start(source, 2), 3);
    assert_eq!(line_start(source, 3), 6);
    assert_eq!(line_start(source, 4), 7);
}

#[test]
fn a_source_within_the_bound_reaches_oxc_unchanged() {
    let allocator = Allocator::default();
    let source = "const a = [1, 2, { b: (3) }];\nexport default a;\n";
    let parsed = parse_bounded(&allocator, source, ts()).expect("within the bound");
    assert!(parsed.errors.is_empty());
    assert_eq!(parsed.program.body.len(), 2);
}
