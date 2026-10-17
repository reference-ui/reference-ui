//! Element-access folding (`obj[key]`, `arr[i]`), shared by both walkers.
//!
//! `fold_element_access` resolves one computed read over a const object, a
//! const array, or an inline literal whose index folds to a string or number,
//! fanning out over multi-leaf indices the way ternaries scoop both arms.
//! Chained reads resolve inside out through nested const entries
//! (`colors['red']['500']`), mirroring the static member path; anything
//! unresolvable becomes a refusal the want walker warns on while the plan
//! walker yields no leaf for it.

use oxc_ast::ast::Expression;
use oxc_span::{GetSpan, Span};

use super::element_index::{fold_index, IndexFold};
use crate::atom::AtomValue;
use crate::extract::constants::{ConstArrayElement, ConstObject};
use crate::extract::expressions::walk::{block_value_kind, unwrap_wrapper_target};
use crate::extract::scope::Scoped;

mod inline;
mod nested;

use inline::{array_position, lookup_inline_base};
use nested::lookup_nested_base;

/// One folded element access: its leaves plus whatever it could not resolve.
///
/// Values and refusals coexist: a multi-leaf index emits every hit and warns
/// every miss, mirroring the open-ternary rule. `omitted` marks hole reads,
/// which yield nothing and warn nothing.
pub struct ElementFold {
    /// One value per resolving key (multi-leaf indices fan out here).
    pub values: Vec<AtomValue>,
    /// True when a key read an elision hole — omit silently, like null.
    pub omitted: bool,
    /// One refusal per key or side the node could not fold.
    pub refusals: Vec<ElementRefusal>,
    /// True when a read entry kept leaves beside a dropped dynamic arm
    /// (Ph4 residue channel); the want walker diagnoses it.
    pub residue: bool,
}

/// Why one key or side of an element access did not fold.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ElementRefusal {
    /// The index expression does not fold; the span is the index.
    DynamicIndex(Span),
    /// The base is not a foldable table; the span is the base.
    DynamicBase(Span),
    /// The base folds but holds no entry for the key.
    Missing { key: String },
    /// The entry exists but is not a scalar style value.
    NonScalar { key: String },
    /// The base name was written after its init; the phrase names the write.
    MutatedBase { name: String, write: String },
}

impl ElementRefusal {
    /// The diagnostic code: mutation names the write, everything else is a member refusal.
    pub fn code(&self) -> crate::diagnostics::DiagnosticCode {
        match self {
            Self::MutatedBase { .. } => crate::diagnostics::DiagnosticCode::MutatedBinding,
            _ => crate::diagnostics::DiagnosticCode::DynamicMember,
        }
    }

    /// The diagnostic span: the failing side, or the whole access for entry refusals.
    pub fn span(&self, access: Span) -> Span {
        match self {
            Self::DynamicIndex(span) | Self::DynamicBase(span) => *span,
            _ => access,
        }
    }
}

/// Fold one element access over its base's static entries.
pub fn fold_element_access(
    object: &Expression<'_>,
    index: &Expression<'_>,
    scoped: Scoped<'_>,
) -> ElementFold {
    let mut fold = ElementFold {
        values: Vec::new(),
        omitted: false,
        refusals: Vec::new(),
        residue: false,
    };
    let IndexFold::Keys(keys) = fold_index(index, scoped) else {
        fold.refusals
            .push(ElementRefusal::DynamicIndex(index.span()));
        return fold;
    };
    for key in keys {
        lookup_key(object, &key, scoped, &mut fold);
    }
    fold
}

/// Look one key up in the base, pushing values or refusals onto the fold.
fn lookup_key(object: &Expression<'_>, key: &str, scoped: Scoped<'_>, fold: &mut ElementFold) {
    if lookup_const_base(object, key, scoped, fold) {
        return;
    }
    if lookup_inline_base(object, key, scoped, fold) {
        return;
    }
    if lookup_nested_base(object, key, scoped, fold) {
        return;
    }
    if let Some(inner) = unwrap_wrapper_target(object) {
        // (colors)['red']  /  (sizes as const)[1]
        lookup_key(inner, key, scoped, fold);
        return;
    }
    fold.refusals
        .push(ElementRefusal::DynamicBase(object.span()));
}

/// Look one key up in a const-object or const-array binding, or false.
fn lookup_const_base(
    object: &Expression<'_>,
    key: &str,
    scoped: Scoped<'_>,
    fold: &mut ElementFold,
) -> bool {
    let Expression::Identifier(base) = object else {
        return false;
    };
    let name = base.name.as_str();
    if let Some(write) = scoped.mutation(name) {
        // sizes[1]  after  sizes = [...]  — the init is stale
        fold.refusals.push(ElementRefusal::MutatedBase {
            name: name.to_string(),
            write: write.write_phrase(),
        });
        return true;
    }
    if let Some(map) = scoped.object(name) {
        // colors['red']  after  const colors = { red: '#f00' }
        lookup_const_entry(map, key, fold);
        return true;
    }
    if let Some(elements) = scoped.array(name) {
        // sizes[1]  after  const sizes = ['2px', '4px']
        lookup_const_element(elements, key, fold);
        return true;
    }
    false
}

/// One key of a recorded const object: its leaves, or a refusal for a non-scalar or missing entry.
fn lookup_const_entry(map: &ConstObject, key: &str, fold: &mut ElementFold) {
    match map.get(key) {
        Some(prop) if !prop.leaves.is_empty() => {
            fold.values.extend(prop.leaves.iter().cloned());
            fold.residue |= prop.residue;
        }
        Some(_) => fold.refusals.push(ElementRefusal::NonScalar {
            key: key.to_string(),
        }),
        None => fold.refusals.push(ElementRefusal::Missing {
            key: key.to_string(),
        }),
    }
}

/// Look one key up in a const array's recorded elements.
fn lookup_const_element(elements: &[ConstArrayElement], key: &str, fold: &mut ElementFold) {
    let Some(pos) = array_position(key) else {
        fold.refusals.push(ElementRefusal::Missing {
            key: key.to_string(),
        });
        return;
    };
    match elements.get(pos) {
        Some(ConstArrayElement::Leaf(leaf)) => fold.values.push(leaf.clone()),
        Some(ConstArrayElement::Hole) => {
            fold.omitted = true;
        }
        Some(ConstArrayElement::Object(_)) => {
            fold.refusals.push(ElementRefusal::NonScalar {
                key: key.to_string(),
            });
        }
        None => {
            fold.refusals.push(ElementRefusal::Missing {
                key: key.to_string(),
            });
        }
    }
}

/// The base as the author wrote it, for miss diagnostics: a name, a literal kind, or a kind.
pub fn describe_base(object: &Expression<'_>) -> String {
    match object {
        Expression::Identifier(base) => base.name.to_string(),
        Expression::ArrayExpression(_) => "array literal".to_string(),
        Expression::ObjectExpression(_) => "object literal".to_string(),
        _ => describe_wrapped_base(object),
    }
}

/// A wrapped base describes as its inner expression; anything else as its block-value kind.
fn describe_wrapped_base(object: &Expression<'_>) -> String {
    if let Some(inner) = unwrap_wrapper_target(object) {
        return describe_base(inner);
    }
    block_value_kind(object)
}

/// An offending sub-expression as the author wrote it (truncated), or its kind.
pub fn describe_snippet(expr: &Expression<'_>, source: Option<&str>) -> String {
    if let Some(source) = source {
        let span = expr.span();
        if let Some(slice) = source.get(span.start as usize..span.end as usize) {
            let trimmed = slice.trim();
            if !trimmed.is_empty() {
                return truncate_snippet(trimmed);
            }
        }
    }
    block_value_kind(expr)
}

/// A source slice capped at one short line for diagnostics.
fn truncate_snippet(slice: &str) -> String {
    const LIMIT: usize = 40;
    let flat: String = slice
        .chars()
        .filter(|c| !c.is_whitespace() || *c == ' ')
        .collect();
    if flat.len() <= LIMIT {
        return flat;
    }
    format!("{}…", flat.chars().take(LIMIT).collect::<String>())
}
