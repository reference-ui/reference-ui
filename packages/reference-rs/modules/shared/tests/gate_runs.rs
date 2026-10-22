//! The gate-run counter, checked in a process of its own. `gate_runs` counts every `check_nesting` call in a process, and the
//! unit tests of the shared crate run the gate on parallel threads, so a delta read there would also count their calls. This
//! binary holds one test and makes no gate call except the ones it checks, so its deltas are exact: `ScreenedSource::empty`
//! runs no gate, `ScreenedSource::screen` runs exactly one, for a passing source and for a refused one, and `parse_screened`
//! runs none, for either.

use oxc_allocator::Allocator;
use oxc_span::SourceType;
use shared::parse::{gate_runs, parse_screened, ScreenedSource, MAX_NESTING};

/// A two-line source whose line 2 nests past the bound: the shape of the ATM-BOUND-02 deep source, one level over the limit.
fn refused_source() -> String {
    format!(
        "import {{ css }} from '@reference-ui/react'\nexport const deep = css({{ color: {}'green'{} }})\n",
        "(".repeat(MAX_NESTING + 1),
        ")".repeat(MAX_NESTING + 1)
    )
}

#[test]
fn empty_and_parse_screened_run_no_gate_and_screen_runs_exactly_one() {
    let before = gate_runs();
    let empty = ScreenedSource::empty(SourceType::ts());
    assert_eq!(gate_runs(), before, "empty must not run the gate");
    assert!(empty.is_empty());

    let before = gate_runs();
    let passing = ScreenedSource::screen("const a = (1);\n".to_string(), SourceType::ts());
    assert_eq!(gate_runs() - before, 1, "screen of a passing source runs the gate once");
    assert_eq!(passing.refusal(), None);

    let before = gate_runs();
    let refused = ScreenedSource::screen(refused_source(), SourceType::ts());
    assert_eq!(gate_runs() - before, 1, "screen of a refused source runs the gate once");
    assert!(refused.refusal().is_some());

    let allocator = Allocator::default();
    let before = gate_runs();
    assert!(parse_screened(&allocator, &passing).is_ok(), "a passing source parses");
    assert_eq!(parse_screened(&allocator, &refused).err(), refused.refusal());
    assert_eq!(gate_runs(), before, "parse_screened must never run the gate");
}
