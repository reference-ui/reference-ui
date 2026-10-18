//! Extract refusal wording: one sentence template per refusal shape.
//!
//! Templates are byte-identical to the legacy `warn_dynamic` call-site
//! strings they replace (moved from `walk/*`, `literal.rs`, and the fold
//! refusal builders). Facts carry referring expressions; this module owns
//! every sentence. The element arm keeps the `MutatedBinding` sentence for
//! stale bases; the sink hook (not wording) decides recording.

use super::super::adapters::extract::ExtractReport;
use super::super::{Diagnostic, DiagnosticCode, ExtractDetail, FoldDetail, LeafDetail};
use crate::extract::fold::ElementRefusal;

/// Render one extract refusal to its final warning line.
pub fn render(report: &ExtractReport) -> Diagnostic {
    let message = sentence(&report.detail, &report.prop);
    let line = report.location.warning(report.code, message);
    super::Policy::attach_help(line, help_lines(report.code, &report.detail, &report.prop))
}

/// The instance help for one refusal shape at one style prop: the static
/// remedy echoed with the refused names, so Core prints this over the table.
fn help_lines(code: DiagnosticCode, detail: &ExtractDetail, prop: &str) -> Vec<String> {
    match detail {
        ExtractDetail::Leaf(leaf) => leaf_help(code, leaf, prop),
        ExtractDetail::Fold(fold) => fold_help(fold, prop),
        ExtractDetail::Element { refusal, .. } => element_help(code, refusal, prop),
    }
}

/// The help for one leaf-shape refusal: identifiers echo the name, member
/// lookups echo the shape, everything else hoists the expression.
fn leaf_help(code: DiagnosticCode, leaf: &LeafDetail, prop: &str) -> Vec<String> {
    match leaf {
        LeafDetail::Identifier { name } => {
            vec![format!(
                "replace '{name}' with a literal or token for '{prop}'"
            )]
        }
        LeafDetail::Generic if code == DiagnosticCode::DynamicMember => {
            vec![member_help(prop)]
        }
        LeafDetail::Generic | LeafDetail::CallArgument { .. } => {
            vec![expression_help(prop)]
        }
    }
}

/// The help for one fold-shape refusal: the fold echoed with its reason.
fn fold_help(fold: &FoldDetail, prop: &str) -> Vec<String> {
    match fold {
        FoldDetail::Unary { detail } => vec![format!(
            "fold the unary expression to a literal for '{prop}' ({detail})"
        )],
        FoldDetail::Binary { detail } => vec![format!(
            "fold the binary expression to a literal for '{prop}' ({detail})"
        )],
        FoldDetail::Template { part, detail } => vec![template_help(*part, detail, prop)],
    }
}

/// The help for one template refusal: one hole, or the whole template.
fn template_help(part: Option<usize>, detail: &str, prop: &str) -> String {
    match part {
        Some(index) => format!("make template part {index} ({detail}) static for '{prop}'"),
        None => format!("make the template ({detail}) static for '{prop}'"),
    }
}

/// The help for one element-access refusal: a mutated base names its write,
/// every other side echoes the lookup shape keyed by the refusal code.
fn element_help(code: DiagnosticCode, refusal: &ElementRefusal, prop: &str) -> Vec<String> {
    if let ElementRefusal::MutatedBase { name, write } = refusal {
        return vec![format!(
            "hoist '{name}' above the style call and stop reassigning it ({write})"
        )];
    }
    vec![lookup_help(code, prop)]
}

/// The help for one non-mutated element side, keyed by the refusal code.
fn lookup_help(code: DiagnosticCode, prop: &str) -> String {
    if code == DiagnosticCode::DynamicMember {
        member_help(prop)
    } else {
        expression_help(prop)
    }
}

/// The help for one dynamic expression refused at one style prop.
fn expression_help(prop: &str) -> String {
    format!("hoist the expression for '{prop}' into a static literal or variant")
}

/// The help for one member lookup refused at one style prop.
fn member_help(prop: &str) -> String {
    format!("replace the member lookup with a literal value for '{prop}'")
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
mod tests;
