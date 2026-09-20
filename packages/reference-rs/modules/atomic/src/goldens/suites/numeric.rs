//! Numeric golden suites: decimal parsing, rendering, and verdicts.
//!
//! L3 grammar rows, L4 render rows (including exact shortest-ties), and the
//! composed `canonNumeric` string-funnel rows live here so the suite index
//! stays small. Outputs come from the oracle (`lexical`, `unit`); the
//! runner replays the same inputs through the runtime namer.

use serde_json::{json, Value};

use super::Suite;
use crate::atom::AtomValue;
use crate::diagnostics::DiagnosticLocation;
use crate::resolve::{lexical, unit, ResolveSession};
use base_system::BaseSystem;

pub(crate) fn parse_suite() -> Suite {
    let texts = [
        "1e3", ".5", "01", "5.", "1_0", "0x10", "", "  ", "inf", "INF", "-inf", "nan", "1e", "e5",
        "+", "1e999", "4e-324", "1e-999", "0", "-0", "100", "1E+5",
    ];
    Suite {
        file: "03-parseDecimal.json",
        function: "parseDecimal",
        cases: texts
            .iter()
            .map(|text| (json!(text), parse_output(text)))
            .collect(),
    }
}

/// Grammar verdict: finite values, signed infinities, NaN, or rejection.
fn parse_output(text: &str) -> Value {
    let Some(parsed) = lexical::parse_decimal(text) else {
        return json!({"result": "reject"});
    };
    let value = parsed.value();
    if value.is_finite() {
        let number = serde_json::Number::from_f64(value).expect("finite renders");
        return json!({"result": "finite", "value": number});
    }
    if value.is_nan() {
        return json!({"result": "nan"});
    }
    json!({"result": "infinite", "sign": if value.is_sign_positive() { 1 } else { -1 }})
}

pub(crate) fn render_suite() -> Suite {
    let values = [
        0.0,
        -0.0,
        1000.0,
        0.5,
        0.30000000000000004,
        1e20,
        1e-6,
        2.5,
        123456.789,
        123456789012345680000.0,
        // Exact shortest-ties (doom-4 T2): both neighbors round-trip, so
        // V8 breaks even and Rust breaks away — the expected outputs are
        // the larger magnitudes. Witness, both signs, both tie pairs
        // (`{2,3}` flips, `{7,8}` agrees), and both edges of the possible
        // magnitude range (ties need e2 <= -2, so true exponent edges
        // cannot tie and stay agreement controls above).
        752396555469991.2,
        -1773218474086427.2,
        -595433053192.7812,
        759030055846983.2,
        -946454342405666.2,
        1674911018215997.8,
        2010292554367850.8,
    ];
    Suite {
        file: "04-renderDecimal.json",
        function: "renderDecimal",
        cases: values
            .iter()
            .map(|value| {
                let number = serde_json::Number::from_f64(*value).expect("finite renders");
                (json!(number), json!(lexical::render_decimal(*value)))
            })
            .collect(),
    }
}

pub(crate) fn numeric_suite() -> Suite {
    let probes = [
        ("padding", "1e3"),
        ("padding", ".5"),
        ("padding", "01"),
        ("padding", "-0"),
        ("padding", "0"),
        ("padding", "1e21"),
        ("padding", "1e-7"),
        ("top", "0x10"),
        ("margin", ""),
        ("margin", "  "),
        ("color", ".5"),
        ("color", "-0"),
        ("color", "01"),
        ("color", "0x10"),
        ("color", "Infinity"),
        ("padding", "inf"),
        ("padding", "INF"),
        ("padding", "Infinity"),
        ("padding", "NaN"),
        ("padding", "nan"),
        ("padding", " 0x10"),
        ("fontFamily", "1e3"),
        // Shortest-tie stems through the string funnel (doom-4 T2): the
        // witness and its negative render the larger magnitude.
        ("width", "752396555469991.2"),
        ("width", "-1773218474086427.2"),
    ];
    Suite {
        file: "08-canonNumeric.json",
        function: "canonNumeric",
        cases: probes
            .iter()
            .map(|(prop, value)| {
                (
                    json!({"prop": prop, "value": value}),
                    numeric_output(prop, value),
                )
            })
            .collect(),
    }
}

/// Composed numeric verdict: the class stem, or the refusal code.
fn numeric_output(prop: &str, value: &str) -> Value {
    let system = BaseSystem::lib_fixture();
    let mut diagnostics = Vec::new();
    let mut session = ResolveSession {
        system,
        diagnostics: &mut diagnostics,
        location: DiagnosticLocation::default(),
        sink: None,
        want: None,
    };
    let css = unit::css_value_from_authored(prop, AtomValue::String(value.into()), &mut session);
    match css {
        Some(css) => json!({"stem": css.class_name_str()}),
        None => {
            let code = diagnostics
                .last()
                .map(|diag| diag.code.as_str())
                .unwrap_or("silent");
            json!({"refused": code})
        }
    }
}
