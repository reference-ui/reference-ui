//! Unclosed `<` in the pre-scan: a generic or an element counts only once its closer is seen.
//! A `<` that never gets its `>` is a comparison or a shift, so a file full of them is valid code that must not be
//! refused, while a nest of generics or elements that does close past the limit still is. The open constructs of one
//! source are capped at eight times the limit, so an unclosed hostile nest is refused too.

use super::super::{scan_nesting, NestingRefusal, MAX_NESTING};
use oxc_span::SourceType;

fn ts() -> SourceType {
    SourceType::ts()
}

fn tsx() -> SourceType {
    SourceType::tsx()
}

/// A `.js` file parsed as TypeScript, which is how atomic and styletrace parse it.
fn js_as_ts() -> SourceType {
    SourceType::mjs().with_typescript(true)
}

const REPEATS: usize = 3_000;

#[test]
fn a_comparison_with_no_closer_adds_no_level() {
    let source = "const x = a<b\n".repeat(REPEATS);
    assert_eq!(scan_nesting(&source, ts()), Ok(0));
    assert_eq!(scan_nesting(&source, tsx()), Ok(0));
}

#[test]
fn a_comparison_in_an_arrow_body_adds_no_level() {
    let source = "export const ok = (n: number) => n<10\n".repeat(REPEATS);
    assert_eq!(scan_nesting(&source, ts()), Ok(1));
    assert_eq!(scan_nesting(&source, tsx()), Ok(1));
}

#[test]
fn a_left_shift_adds_no_level() {
    let source = "y = a<<b\n".repeat(REPEATS);
    assert_eq!(scan_nesting(&source, ts()), Ok(0));
    assert_eq!(scan_nesting(&source, tsx()), Ok(0));
}

#[test]
fn many_comparisons_in_one_statement_add_no_level() {
    let declarators = "var a=b<c,d=e<f,g=h<i,".repeat(REPEATS / 2) + "z=0;";
    assert_eq!(scan_nesting(&declarators, js_as_ts()), Ok(0));
    let ternaries = "x=e<65?1:e<91?2:".repeat(REPEATS / 2) + "0;";
    assert_eq!(scan_nesting(&ternaries, js_as_ts()), Ok(0));
    let array = format!("const t = [{}];\n", "a<b,".repeat(REPEATS));
    assert_eq!(scan_nesting(&array, ts()), Ok(1));
}

#[test]
fn a_comparison_pair_does_not_pile_up_either() {
    let source = "if (a<b && c>d) f();\nx = a<b || c>d\n".repeat(REPEATS);
    assert_eq!(scan_nesting(&source, ts()), Ok(2));
}

#[test]
fn generics_count_once_their_closers_are_seen() {
    let nest = |depth: usize| {
        format!(
            "let x: {}string{};",
            "Array<".repeat(depth),
            ">".repeat(depth)
        )
    };
    assert_eq!(scan_nesting(&nest(MAX_NESTING), ts()), Ok(MAX_NESTING));
    assert_eq!(
        scan_nesting(&nest(MAX_NESTING + 1), ts()),
        Err(NestingRefusal {
            depth: MAX_NESTING + 1,
            line: 1
        })
    );
}

#[test]
fn generics_without_closers_count_nothing() {
    assert_eq!(scan_nesting(&"Array<".repeat(5000), ts()), Ok(0));
    assert_eq!(scan_nesting(&"<div>".repeat(5000), tsx()), Ok(0));
}

#[test]
fn counted_brackets_and_closed_generics_add_up() {
    let nest = |generics: usize| {
        format!(
            "{}{}x{}{}",
            "(".repeat(1000),
            "Array<".repeat(generics),
            ">".repeat(generics),
            ")".repeat(1000)
        )
    };
    assert_eq!(scan_nesting(&nest(24), ts()), Ok(MAX_NESTING));
    assert_eq!(
        scan_nesting(&nest(25), ts()),
        Err(NestingRefusal {
            depth: MAX_NESTING + 1,
            line: 1
        })
    );
}

#[test]
fn a_refused_nest_names_the_line_of_the_construct_that_crosses_the_limit() {
    // 1,100 generics open one per line and close one per line. The 1,025th level from the innermost one is the 76th opener.
    let source = format!("{}x{}", "Array<\n".repeat(1100), ">\n".repeat(1100));
    assert_eq!(
        scan_nesting(&source, ts()),
        Err(NestingRefusal {
            depth: MAX_NESTING + 1,
            line: 76
        })
    );
}

#[test]
fn open_constructs_are_capped_at_eight_times_the_limit() {
    let cap = 8 * MAX_NESTING;
    assert_eq!(scan_nesting(&"Array<".repeat(cap), ts()), Ok(0));
    assert_eq!(
        scan_nesting(&"Array<".repeat(cap + 1), ts()),
        Err(NestingRefusal {
            depth: cap + 1,
            line: 1
        })
    );
    assert_eq!(scan_nesting(&"<div>".repeat(cap), tsx()), Ok(0));
    assert_eq!(
        scan_nesting(&"<div>".repeat(cap + 1), tsx()),
        Err(NestingRefusal {
            depth: cap + 1,
            line: 1
        })
    );
}
