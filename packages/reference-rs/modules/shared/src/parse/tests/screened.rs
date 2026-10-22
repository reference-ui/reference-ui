//! Unit tests for `ScreenedSource`, the text a caller screens once and parses later. A screened deep source must carry the
//! refusal the bound gives its line, `parse_screened` must hand back that same refusal, and a passing source must parse from
//! its stored text. The gate-run counter is checked in `shared/tests/gate_runs.rs`, which runs in a process of its own,
//! because the tests of this binary run the gate on parallel threads.

use oxc_allocator::Allocator;
use oxc_span::SourceType;

use super::super::{parse_screened, ScreenedSource};

/// The nesting depth of the ATM-BOUND-02 deep source.
const DEPTH: usize = 300_000;

fn ts() -> SourceType {
    SourceType::ts()
}

/// The shape of the ATM-BOUND-02 deep source: an import, then a `css()` value nested `DEPTH` parentheses deep on line 2.
fn deep_source() -> String {
    format!(
        "import {{ css }} from '@reference-ui/react'\nexport const deep = css({{ color: {}'green'{} }})\n",
        "(".repeat(DEPTH),
        ")".repeat(DEPTH)
    )
}

#[test]
fn a_deep_source_is_refused_at_line_two_and_parse_returns_that_refusal() {
    let source = ScreenedSource::screen(deep_source(), ts());
    let refusal = source.refusal().expect("nested past the bound");
    assert_eq!(refusal.line, 2);
    let allocator = Allocator::default();
    assert_eq!(parse_screened(&allocator, &source).err(), Some(refusal));
}

#[test]
fn a_passing_source_parses_from_its_stored_text() {
    let text = "const a = [1, 2, { b: (3) }];\nexport default a;\n";
    let source = ScreenedSource::screen(text.to_string(), ts());
    assert_eq!(source.refusal(), None);
    assert_eq!(source.as_str(), text);
    let allocator = Allocator::default();
    let parsed = parse_screened(&allocator, &source).expect("within the bound");
    assert!(parsed.errors.is_empty());
    assert_eq!(parsed.program.body.len(), 2);
}
