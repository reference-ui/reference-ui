//! Extract refusal wording: one sentence template per refusal shape.
//!
//! Templates are byte-identical to the legacy `warn_dynamic` call-site
//! strings they replace (moved from `walk/*`, `literal.rs`, and the fold
//! refusal builders). Facts carry referring expressions; this module owns
//! every sentence. The element arm keeps the `MutatedBinding` sentence for
//! stale bases; the sink hook (not wording) decides recording.

use super::super::adapters::extract::ExtractReport;
use super::super::{Diagnostic, ExtractDetail, FoldDetail, LeafDetail};
use crate::extract::fold::ElementRefusal;

/// Render one extract refusal to its final warning line.
pub fn render(report: &ExtractReport) -> Diagnostic {
    let message = sentence(&report.detail, &report.prop);
    report.location.warning(report.code, message)
}

/// The sentence for one refusal shape at one style prop.
fn sentence(detail: &ExtractDetail, prop: &str) -> String {
    match detail {
        ExtractDetail::Leaf(leaf) => leaf_sentence(leaf, prop),
        ExtractDetail::Fold(fold) => fold_sentence(fold, prop),
        ExtractDetail::Element {
            refusal,
            base,
            index,
        } => element_sentence(refusal, base, index, prop),
    }
}

/// The sentence for one leaf-shape refusal at one style prop.
fn leaf_sentence(leaf: &LeafDetail, prop: &str) -> String {
    match leaf {
        LeafDetail::Generic => {
            format!("Dynamic non-literal expression encountered for prop '{prop}'")
        }
        LeafDetail::Identifier { name } => {
            format!("Dynamic non-literal identifier '{name}' encountered for prop '{prop}'")
        }
        LeafDetail::CallArgument { detail } => {
            format!("Dynamic non-literal {detail} in call argument for prop '{prop}'")
        }
    }
}

/// The sentence for one fold-shape refusal at one style prop.
fn fold_sentence(fold: &FoldDetail, prop: &str) -> String {
    match fold {
        FoldDetail::Unary { detail } => {
            format!("Dynamic unary expression encountered for prop '{prop}' ({detail})")
        }
        FoldDetail::Binary { detail } => {
            format!("Dynamic binary expression encountered for prop '{prop}' ({detail})")
        }
        FoldDetail::Template { part, detail } => template_sentence(*part, detail, prop),
    }
}

/// The sentence for one template refusal: one hole, or the whole template.
fn template_sentence(part: Option<usize>, detail: &str, prop: &str) -> String {
    match part {
        Some(index) => format!(
            "Dynamic non-literal template part {index} ({detail}) encountered for prop '{prop}'"
        ),
        None => format!("Dynamic non-literal template expression for prop '{prop}' ({detail})"),
    }
}

/// The sentence for one element-access refusal over one base and index.
fn element_sentence(refusal: &ElementRefusal, base: &str, index: &str, prop: &str) -> String {
    match refusal {
        ElementRefusal::DynamicIndex(_) => {
            format!("Dynamic non-literal element index '{index}' encountered for prop '{prop}'")
        }
        ElementRefusal::DynamicBase(_) => {
            format!("Dynamic non-literal element base '{base}' encountered for prop '{prop}'")
        }
        ElementRefusal::Missing { key } => {
            format!("Element access '{base}[{key}]' has no static entry for prop '{prop}'")
        }
        ElementRefusal::NonScalar { key } => format!(
            "Element access '{base}[{key}]' is not a static style value for prop '{prop}'"
        ),
        ElementRefusal::MutatedBase { name, write } => format!(
            "Dynamic mutated binding '{name}' encountered for prop '{prop}' ({write}; element read is stale)"
        ),
    }
}

#[cfg(test)]
mod tests {
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
}
