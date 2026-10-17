//! Pins the extract policy's legacy sentences and help lines for each refusal family: generic and
//! identifier shapes, unary, binary and template expressions, element refusals, call arguments, and
//! mutated bindings. Fixtures build extract reports from typed details, so any wording drift fails a
//! pinned string.

use super::super::Policy;
use super::*;
use crate::diagnostics::{DiagnosticCode, DiagnosticLocation};
use oxc_span::Span;

fn report(detail: ExtractDetail) -> ExtractReport {
    report_with_code(DiagnosticCode::DynamicExpression, detail)
}

fn report_with_code(code: DiagnosticCode, detail: ExtractDetail) -> ExtractReport {
    ExtractReport {
        location: DiagnosticLocation {
            file: Some("a.ts".to_string()),
            line: Some(4),
            column: Some(11),
            span: None,
        },
        prop: "color".into(),
        when: Vec::new(),
        code,
        detail,
        sink_recorded: true,
    }
}

#[test]
fn generic_and_identifier_sentences_pin_legacy_strings() {
    let generic = Policy::render_extract(&report(ExtractDetail::Leaf(LeafDetail::Generic)));
    assert_eq!(
        generic.message,
        "Dynamic non-literal expression encountered for prop 'color'"
    );
    let ident = Policy::render_extract(&report(ExtractDetail::Leaf(LeafDetail::Identifier {
        name: "space".into(),
    })));
    assert_eq!(
        ident.message,
        "Dynamic non-literal identifier 'space' encountered for prop 'color'"
    );
    assert_eq!(ident.file.as_deref(), Some("a.ts"));
    assert_eq!(ident.line, Some(4));
    assert_eq!(ident.column, Some(11));
}

#[test]
fn unary_binary_and_template_sentences_pin_legacy_strings() {
    let unary = Policy::render_extract(&report(ExtractDetail::Fold(FoldDetail::Unary {
        detail: "operator 'typeof' is not foldable".into(),
    })));
    assert_eq!(
        unary.message,
        "Dynamic unary expression encountered for prop 'color' \
         (operator 'typeof' is not foldable)"
    );
    let binary = Policy::render_extract(&report(ExtractDetail::Fold(FoldDetail::Binary {
        detail: "operator '-' does not apply to a non-numeric value".into(),
    })));
    assert_eq!(
        binary.message,
        "Dynamic binary expression encountered for prop 'color' \
         (operator '-' does not apply to a non-numeric value)"
    );
    let part = Policy::render_extract(&report(ExtractDetail::Fold(FoldDetail::Template {
        part: Some(1),
        detail: "identifier 'n'".into(),
    })));
    assert_eq!(
        part.message,
        "Dynamic non-literal template part 1 (identifier 'n') encountered for prop 'color'"
    );
    let whole = Policy::render_extract(&report(ExtractDetail::Fold(FoldDetail::Template {
        part: None,
        detail: "over-cap fan-out".into(),
    })));
    assert_eq!(
        whole.message,
        "Dynamic non-literal template expression for prop 'color' (over-cap fan-out)"
    );
}

#[test]
fn element_sentences_pin_legacy_strings() {
    let span = Span::new(0, 3);
    let cases = [
        (
            ElementRefusal::DynamicIndex(span),
            "Dynamic non-literal element index 'k' encountered for prop 'color'",
        ),
        (
            ElementRefusal::DynamicBase(span),
            "Dynamic non-literal element base 'sizes' encountered for prop 'color'",
        ),
        (
            ElementRefusal::Missing { key: "red".into() },
            "Element access 'sizes[red]' has no static entry for prop 'color'",
        ),
        (
            ElementRefusal::NonScalar { key: "red".into() },
            "Element access 'sizes[red]' is not a static style value for prop 'color'",
        ),
        (
            ElementRefusal::MutatedBase {
                name: "sizes".into(),
                write: "reassigned below".into(),
            },
            "Dynamic mutated binding 'sizes' encountered for prop 'color' \
             (reassigned below; element read is stale)",
        ),
    ];
    for (refusal, expected) in cases {
        let rendered = Policy::render_extract(&report(ExtractDetail::Element {
            refusal,
            base: "sizes".into(),
            index: "k".into(),
        }));
        assert_eq!(rendered.message, expected);
    }
}

#[test]
fn call_argument_sentence_pins_legacy_string() {
    let rendered = Policy::render_extract(&report(ExtractDetail::Leaf(LeafDetail::CallArgument {
        detail: "identifier 'x'".into(),
    })));
    assert_eq!(
        rendered.message,
        "Dynamic non-literal identifier 'x' in call argument for prop 'color'"
    );
}

#[test]
fn mutated_binding_code_travels_with_its_sentence() {
    let rendered = Policy::render_extract(&report_with_code(
        DiagnosticCode::MutatedBinding,
        ExtractDetail::Leaf(LeafDetail::Generic),
    ));
    assert_eq!(rendered.code, DiagnosticCode::MutatedBinding);
}

#[test]
fn help_echoes_the_refused_shape_and_names() {
    let hoist = "hoist the expression for 'color' into a static literal or variant";
    let cases: Vec<(ExtractReport, &str)> = vec![
        (report(ExtractDetail::Leaf(LeafDetail::Generic)), hoist),
        (
            report(ExtractDetail::Leaf(LeafDetail::CallArgument {
                detail: "identifier 'x'".into(),
            })),
            hoist,
        ),
        (
            report(ExtractDetail::Leaf(LeafDetail::Identifier {
                name: "space".into(),
            })),
            "replace 'space' with a literal or token for 'color'",
        ),
        (
            report(ExtractDetail::Fold(FoldDetail::Unary {
                detail: "operator 'typeof' is not foldable".into(),
            })),
            "fold the unary expression to a literal for 'color' \
             (operator 'typeof' is not foldable)",
        ),
        (
            report(ExtractDetail::Fold(FoldDetail::Binary {
                detail: "operator '-' does not apply".into(),
            })),
            "fold the binary expression to a literal for 'color' \
             (operator '-' does not apply)",
        ),
        (
            report(ExtractDetail::Fold(FoldDetail::Template {
                part: Some(1),
                detail: "identifier 'n'".into(),
            })),
            "make template part 1 (identifier 'n') static for 'color'",
        ),
        (
            report(ExtractDetail::Fold(FoldDetail::Template {
                part: None,
                detail: "over-cap fan-out".into(),
            })),
            "make the template (over-cap fan-out) static for 'color'",
        ),
    ];
    for (report, expected) in cases {
        let rendered = Policy::render_extract(&report);
        assert_eq!(rendered.help, Some(vec![expected.to_string()]));
    }
}

#[test]
fn member_and_mutation_shapes_carry_their_own_help() {
    let member = Policy::render_extract(&report_with_code(
        DiagnosticCode::DynamicMember,
        ExtractDetail::Leaf(LeafDetail::Generic),
    ));
    assert_eq!(
        member.help,
        Some(vec![
            "replace the member lookup with a literal value for 'color'".to_string()
        ])
    );
    let mutated = Policy::render_extract(&report_with_code(
        DiagnosticCode::MutatedBinding,
        ExtractDetail::Element {
            refusal: ElementRefusal::MutatedBase {
                name: "sizes".into(),
                write: "reassigned below".into(),
            },
            base: "sizes".into(),
            index: "k".into(),
        },
    ));
    assert_eq!(
        mutated.help,
        Some(vec![
            "hoist 'sizes' above the style call and stop reassigning it \
             (reassigned below)"
                .to_string()
        ])
    );
}
