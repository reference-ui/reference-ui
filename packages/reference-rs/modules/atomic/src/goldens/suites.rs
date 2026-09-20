//! Golden case builders: curated inputs per function, outputs computed.
//!
//! Each suite below names one lexical function or procedure and the runner
//! key it pins. Shaping and composed suites run the plan builder against
//! the same system spec the case harness compiles with, so the runner's
//! tables and the writer's tables are identical by construction.

use serde_json::{json, Value};

use super::Suite;
use crate::atom::AtomValue;
use crate::diagnostics::DiagnosticLocation;
use crate::extract::expressions::literal::split_important_flag;
use crate::resolve::shorthands::{border, parser};
use crate::resolve::{lexical, normalize, unit, ResolveSession};
use base_system::BaseSystem;

pub(crate) fn whitespace_suite() -> Suite {
    let chars = [
        " ", "\t", "\n", "\r", "\u{85}", "\u{a0}", "\u{feff}", "\u{200b}", "\u{180e}", "a",
        "\u{2000}", "\u{3000}", "\u{2028}", "\u{1680}", "\u{202f}", "\u{205f}", "\u{200a}",
    ];
    Suite {
        file: "01-isStructuralWhitespace.json",
        function: "isStructuralWhitespace",
        cases: chars
            .iter()
            .map(|text| {
                let ch = text.chars().next().expect("one char");
                (json!(text), json!(lexical::is_structural_whitespace(ch)))
            })
            .collect(),
    }
}

pub(crate) fn trim_suite() -> Suite {
    let texts = [
        " 1e21 ",
        "\u{a0}x\u{a0}",
        "\u{feff}x\u{feff}",
        "\ta\n",
        "",
        "1",
        "   ",
        "x  y",
    ];
    Suite {
        file: "02-trimStructural.json",
        function: "trimStructural",
        cases: texts
            .iter()
            .map(|text| (json!(text), json!(lexical::trim_structural(text))))
            .collect(),
    }
}

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

pub(crate) fn fold_suite() -> Suite {
    let texts = ["SOLID", "İ", "ß", "Σς", "None", "AUTO", "Red", "solid"];
    Suite {
        file: "05-asciiLower.json",
        function: "asciiLower",
        cases: texts
            .iter()
            .map(|text| (json!(text), json!(lexical::ascii_lower(text))))
            .collect(),
    }
}

pub(crate) fn sanitize_suite() -> Suite {
    let texts = [
        "a b",
        "a\tb\nc",
        "a\rb",
        "a\u{a0}b",
        "a\u{85}b",
        "\"a\rb\"",
        "",
        "10px 20px",
    ];
    Suite {
        file: "06-sanitizeValue.json",
        function: "sanitizeValue",
        cases: texts
            .iter()
            .map(|text| (json!(text), json!(lexical::sanitize_value(text))))
            .collect(),
    }
}

pub(crate) fn collapse_suite() -> Suite {
    let texts = [
        "1px  solid   red",
        "a\tb\nc",
        "\"a  b\"",
        "'Fira  Code', monospace",
        "a\rb",
        "\"a\rb\"",
        "a\u{85}b",
        "a\u{feff}b",
        "",
        "red",
    ];
    Suite {
        file: "07-collapseWhitespace.json",
        function: "collapseWhitespace",
        cases: texts
            .iter()
            .map(|text| (json!(text), json!(normalize::collapse_whitespace(text))))
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

pub(crate) fn important_suite() -> Suite {
    let texts = [
        "2r!",
        "1r!important",
        "0 !important",
        "red!IMPORTANT",
        "!",
        "a",
        "2r",
        "x!y",
        "",
        "1r !IMPORTANT ",
    ];
    Suite {
        file: "09-splitImportant.json",
        function: "splitImportant",
        cases: texts
            .iter()
            .map(|text| {
                let (clean, important) = split_important_flag(text);
                (json!(text), json!({"clean": clean, "important": important}))
            })
            .collect(),
    }
}

pub(crate) fn tokens_suite() -> Suite {
    let texts = [
        "3px solid red",
        "calc(1px + 1px) solid",
        "1r  2r",
        "a\tb\nc",
        "",
        "calc(min(1px,2px)) x",
        "  padded  ",
    ];
    Suite {
        file: "10-splitTokens.json",
        function: "splitTokens",
        cases: texts
            .iter()
            .map(|text| (json!(text), json!(parser::split_tokens(text))))
            .collect(),
    }
}

pub(crate) fn classify_suite() -> Suite {
    let probes: &[(&[&str], bool)] = &[
        (&["3px", "solid", "red"], false),
        (&["3px", "4px", "solid"], false),
        (&["SOLID", "3PX", "RED"], false),
        (&["None"], false),
        (&["auto"], true),
        (&["auto"], false),
        (&["inf", "solid", "red"], false),
        (&["thin"], false),
        (&["calc(1r + 2px)"], false),
        (&["1/3r"], false),
        (&["0r"], false),
        (&["red", "blue"], false),
    ];
    Suite {
        file: "11-classifyBorder.json",
        function: "classifyBorder",
        cases: probes
            .iter()
            .map(|(tokens, outline)| {
                let owned: Vec<String> = tokens.iter().map(|token| (*token).to_string()).collect();
                let parsed = parser::parse_shorthand_tokens(&owned, *outline);
                (
                    json!({"tokens": tokens, "outline": outline}),
                    json!({
                        "width": parsed.width,
                        "style": parsed.style,
                        "color": parsed.color,
                    }),
                )
            })
            .collect(),
    }
}

pub(crate) fn expand_suite() -> Suite {
    let probes = [
        ("border", "0"),
        ("border", "0px"),
        ("border", "0rem"),
        ("border", "0%"),
        ("border", "0r"),
        ("border", "none"),
        ("border", "None"),
        ("outline", "none"),
        ("outline", "None"),
        ("border", "inherit"),
        ("border", "var(--bd)"),
        ("border", "Var(--bd)"),
        ("border", "borders.subtle"),
        ("border", "solid"),
        ("border", ""),
        ("flex", "1"),
    ];
    Suite {
        file: "12-expandBorder.json",
        function: "expandBorder",
        cases: probes
            .iter()
            .map(|(prop, value)| {
                (
                    json!({"prop": prop, "value": value}),
                    expand_output(prop, value),
                )
            })
            .collect(),
    }
}

/// Border expansion: lowered pairs, or null past the family gate.
fn expand_output(prop: &str, value: &str) -> Value {
    match border::expand_border_shorthand(prop, value) {
        Some(pairs) => {
            let rows: Vec<Value> = pairs
                .iter()
                .map(|(prop, val)| json!([prop, val.class_name_str()]))
                .collect();
            json!({"pairs": rows})
        }
        None => Value::Null,
    }
}
