//! The raw bracket net: a second count that ignores every lexing rule.
//! It counts `(`, `[` and `{` in every byte of the source, strings, comments, template text and JSX text included, and refuses
//! a source whose count passes eight times the limit. A lexing mistake in the main scan can hide nesting from it, and the
//! net is what still stops a pathological file. The closers never take it below zero.

use super::super::scan::can_refuse;
use super::super::{check_nesting, scan_nesting, NestingRefusal, MAX_NESTING};
use oxc_span::SourceType;

fn ts() -> SourceType {
    SourceType::ts()
}

fn tsx() -> SourceType {
    SourceType::tsx()
}

const CAP: usize = 8 * MAX_NESTING;

fn refused(depth: usize, line: u32) -> Result<usize, NestingRefusal> {
    Err(NestingRefusal { depth, line })
}

#[test]
fn the_net_counts_brackets_that_jsx_text_hides_from_the_scan() {
    let text = |depth: usize| format!("const p = <p>{}</p>;\n", "(".repeat(depth));
    assert_eq!(scan_nesting(&text(CAP), tsx()), Ok(1));
    assert_eq!(scan_nesting(&text(CAP + 1), tsx()), refused(CAP + 1, 1));
}

#[test]
fn the_net_counts_brackets_in_strings_comments_and_templates() {
    let string = format!("const s = '{}';\n", "[".repeat(CAP + 1));
    assert_eq!(scan_nesting(&string, ts()), refused(CAP + 1, 1));
    let comment = format!("\n/* {} */\n", "{".repeat(CAP + 1));
    assert_eq!(scan_nesting(&comment, ts()), refused(CAP + 1, 2));
    let template = format!("\n\nconst t = `{}`;\n", "(".repeat(CAP + 1));
    assert_eq!(scan_nesting(&template, ts()), refused(CAP + 1, 3));
}

#[test]
fn closers_lower_the_net_but_never_below_zero() {
    let balanced = format!("const a = '{}{}';\n", "(".repeat(CAP), ")".repeat(CAP)).repeat(2);
    assert_eq!(scan_nesting(&balanced, ts()), Ok(0));
    let credit = format!(
        "const a = '{}';\nconst b = '{}';\n",
        ")".repeat(20_000),
        "(".repeat(CAP + 1)
    );
    assert_eq!(scan_nesting(&credit, ts()), refused(CAP + 1, 2));
}

#[test]
fn a_division_read_as_a_regex_cannot_hide_a_pathological_nest() {
    // `++ /` is read as the start of a regex, so the scan skips up to the next slash and sees none of the 9,000 parentheses.
    let source = format!(
        "x = a++ / b; {}1{} / c;\n",
        "(".repeat(9000),
        ")".repeat(9000)
    );
    assert_eq!(scan_nesting(&source, ts()), refused(CAP + 1, 1));
}

#[test]
fn the_opener_count_counts_every_kind_of_opener_and_no_closer() {
    assert!(!can_refuse("(".repeat(MAX_NESTING).as_bytes()));
    assert!(can_refuse("(".repeat(MAX_NESTING + 1).as_bytes()));
    assert!(can_refuse(
        format!(
            "{}{}{}{}",
            "(".repeat(300),
            "[".repeat(300),
            "{".repeat(300),
            "<".repeat(125)
        )
        .as_bytes()
    ));
    assert!(!can_refuse(
        format!("{}{}", "(".repeat(1000), ")>]}".repeat(2000)).as_bytes()
    ));
}

/// Token soups for the check against the scan. The first mixes openers, closers, the bytes the scan reads specially and plain
/// text; the others lean on openers, so that some sources pass a limit.
const SOUPS: [&[&str]; 3] = [
    &[
        "(", "(", "(", "[", "{", "<", ")", "]", "}", ">", ";", "/", "\"", "'", "`", "${", "\n",
        "a", "a<", "=>", "</p>", "<p>", "/*", "*/",
    ],
    &["(", "(", "[", "{", "<p>", "Array<", "a", " ", ")", ">"],
    &[
        "Array<", "<p>", "<p>", "a<b", ">", "</p>", ";", "x", "(", ")",
    ],
];

#[test]
fn the_check_gives_the_scan_verdict_for_any_source() {
    let mut state = 0x2545_F491_4F6C_DD1D_u64;
    let mut next = |bound: usize| {
        state ^= state << 13;
        state ^= state >> 7;
        state ^= state << 17;
        (state % bound as u64) as usize
    };
    let mut refused = 0;
    for case in 0..900 {
        let soup = SOUPS[case % SOUPS.len()];
        let length = [40, 400, 3000, 9000, 20_000][case % 5];
        let source: String = (0..length).map(|_| soup[next(soup.len())]).collect();
        for source_type in [ts(), tsx(), SourceType::mjs()] {
            let verdict = scan_nesting(&source, source_type);
            refused += usize::from(verdict.is_err());
            assert_eq!(
                check_nesting(&source, source_type),
                verdict.map(|_| ()),
                "case {case}: {source:?}"
            );
        }
    }
    assert!(
        refused > 100,
        "only {refused} of the soups were refused, so the check was barely tested"
    );
}

#[test]
fn the_check_refuses_and_passes_where_the_scan_does() {
    let shapes = [
        "(".repeat(MAX_NESTING),
        "(".repeat(MAX_NESTING + 1),
        format!(
            "{}x{}",
            "Array<".repeat(MAX_NESTING + 1),
            ">".repeat(MAX_NESTING + 1)
        ),
        format!(
            "{}x{}",
            "<p>".repeat(MAX_NESTING + 1),
            "</p>".repeat(MAX_NESTING + 1)
        ),
        "<p>".repeat(CAP + 1),
        format!("const p = <p>{}</p>;", "(".repeat(CAP + 1)),
        "const x = a<b\n".repeat(CAP),
    ];
    for shape in shapes {
        for source_type in [ts(), tsx()] {
            assert_eq!(
                check_nesting(&shape, source_type),
                scan_nesting(&shape, source_type).map(|_| ())
            );
        }
    }
}
