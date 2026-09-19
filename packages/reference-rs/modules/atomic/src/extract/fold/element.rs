//! Element-access folding (`obj[key]`, `arr[i]`), shared by both walkers.
//!
//! `fold_element_access` resolves one computed read over a const object, a
//! const array, or an inline literal whose index folds to a string or number,
//! fanning out over multi-leaf indices the way ternaries scoop both arms. The
//! base is single-hop by design: chained reads need nested const objects
//! (SITE-29) and refuse here. Anything unresolvable becomes a refusal the
//! want walker warns on while the plan walker yields no leaf for it.

use oxc_ast::ast::{ArrayExpressionElement, Expression};
use oxc_span::{GetSpan, Span};

use super::array::flatten_value_slots;
use super::key::{canonical_numeric_key, fold_property_key};
use super::unary::fold_unary;
use crate::atom::AtomValue;
use crate::extract::constants::ConstArrayElement;
use crate::extract::expressions::walk::{block_value_kind, unwrap_wrapper_target};
use crate::extract::scope::Scoped;

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
}

/// Why one key or side of an element access did not fold.
pub enum ElementRefusal {
    /// The index expression does not fold; the span is the index.
    DynamicIndex(Span),
    /// The base is not a foldable table; the span is the base.
    DynamicBase(Span),
    /// The base folds but holds no entry for the key.
    Missing { key: String },
    /// The entry exists but is not a scalar style value.
    NonScalar { key: String },
    /// The base name was reassigned after its init; the site names the write.
    MutatedBase { name: String, site: String },
}

impl ElementRefusal {
    /// The diagnostic text for a refusal at one style prop.
    pub fn message(&self, prop: &str, base: &str, index: &str) -> String {
        match self {
            Self::DynamicIndex(_) => format!(
                "Dynamic non-literal element index '{index}' encountered for prop '{prop}'"
            ),
            Self::DynamicBase(_) => format!(
                "Dynamic non-literal element base '{base}' encountered for prop '{prop}'"
            ),
            Self::Missing { key } => format!(
                "Element access '{base}[{key}]' has no static entry for prop '{prop}'"
            ),
            Self::NonScalar { key } => format!(
                "Element access '{base}[{key}]' is not a static style value for prop '{prop}'"
            ),
            Self::MutatedBase { name, site } => format!(
                "Dynamic mutated binding '{name}' encountered for prop '{prop}' (reassigned at {site}; element read is stale)"
            ),
        }
    }

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

/// A folded index: one key per leaf, or a refusal to fold at all.
enum IndexFold {
    Keys(Vec<String>),
    Dynamic,
}

/// Fold an index expression to its key spellings, fanning out over leaves.
///
/// Literals, single- and multi-leaf const identifiers, one-hop members, and
/// nested element reads fold; calls, binaries, interpolated templates, and
/// unbound names refuse for the caller to diagnose.
fn fold_index(expr: &Expression<'_>, scoped: Scoped<'_>) -> IndexFold {
    if let Some(keys) = fold_index_literal(expr, scoped) {
        return keys;
    }
    if let Some(inner) = unwrap_wrapper_target(expr) {
        // colors[(k)]  /  sizes[i as const]
        return fold_index(inner, scoped);
    }
    IndexFold::Dynamic
}

/// Fold the literal and resolvable index forms, or None to try wrappers.
fn fold_index_literal(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<IndexFold> {
    match expr {
        Expression::StringLiteral(lit) => {
            // colors['red']
            Some(IndexFold::Keys(vec![lit.value.to_string()]))
        }
        Expression::NumericLiteral(lit) => {
            // sizes[1]
            Some(IndexFold::Keys(vec![canonical_numeric_key(lit.value)]))
        }
        Expression::BooleanLiteral(lit) => Some(IndexFold::Keys(vec![lit.value.to_string()])),
        Expression::NullLiteral(_) => Some(IndexFold::Keys(vec!["null".to_string()])),
        Expression::TemplateLiteral(lit) => {
            if lit.expressions.is_empty() {
                let raw = lit.quasis.first().map(|q| q.value.raw.to_string())?;
                Some(IndexFold::Keys(vec![raw]))
            } else {
                // m[`a${b}`]  — interpolated templates are SITE-51's node
                Some(IndexFold::Dynamic)
            }
        }
        Expression::Identifier(ident) => Some(fold_index_identifier(ident.name.as_str(), scoped)),
        Expression::StaticMemberExpression(mem) => Some(fold_index_member(mem, scoped)),
        Expression::ComputedMemberExpression(mem) => {
            // m[a[0]]  — nested reads fold inside out
            Some(fold_index_element(&mem.object, &mem.expression, scoped))
        }
        Expression::ChainExpression(chain) => Some(fold_index_chain(chain, scoped)),
        Expression::UnaryExpression(unary) => Some(fold_index_unary(unary, scoped)),
        _ => None,
    }
}

/// An identifier index: every const leaf becomes a key; unbound refuses.
fn fold_index_identifier(name: &str, scoped: Scoped<'_>) -> IndexFold {
    if name == "undefined" || name == "null" {
        return IndexFold::Keys(vec![name.to_string()]);
    }
    // colors[k]  after  const k = 'red'
    let keys: Vec<String> = scoped
        .scalar_leaves(name)
        .iter()
        .filter_map(leaf_key)
        .collect();
    if keys.is_empty() {
        IndexFold::Dynamic
    } else {
        IndexFold::Keys(keys)
    }
}

/// A one-hop member index (`m[o.p]`), or Dynamic when unresolvable.
fn fold_index_member(
    mem: &oxc_ast::ast::StaticMemberExpression<'_>,
    scoped: Scoped<'_>,
) -> IndexFold {
    if let Expression::Identifier(obj) = &mem.object {
        // m[o.p]  — every const leaf becomes a key
        let keys: Vec<String> = scoped
            .object_prop_leaves(obj.name.as_str(), mem.property.name.as_str())
            .iter()
            .filter_map(leaf_key)
            .collect();
        if !keys.is_empty() {
            return IndexFold::Keys(keys);
        }
    }
    IndexFold::Dynamic
}

/// A nested element index: each folded leaf becomes a key.
fn fold_index_element(
    object: &Expression<'_>,
    index: &Expression<'_>,
    scoped: Scoped<'_>,
) -> IndexFold {
    match fold_element_access(object, index, scoped) {
        ElementFold { values, .. } if !values.is_empty() => {
            let keys: Vec<String> = values.iter().filter_map(leaf_key).collect();
            if keys.is_empty() {
                IndexFold::Dynamic
            } else {
                IndexFold::Keys(keys)
            }
        }
        ElementFold { omitted, .. } if omitted => {
            // m[hole]  — a hole reads undefined, keyed 'undefined'
            IndexFold::Keys(vec!["undefined".to_string()])
        }
        _ => IndexFold::Dynamic,
    }
}

/// A chained index: computed chains fold, member chains refuse (SITE-34).
fn fold_index_chain(chain: &oxc_ast::ast::ChainExpression<'_>, scoped: Scoped<'_>) -> IndexFold {
    if let oxc_ast::ast::ChainElement::ComputedMemberExpression(mem) = &chain.expression {
        return fold_index_element(&mem.object, &mem.expression, scoped);
    }
    IndexFold::Dynamic
}

/// A unary index (`sizes[-n]`) with fully folded leaves, else Dynamic.
fn fold_index_unary(unary: &oxc_ast::ast::UnaryExpression<'_>, scoped: Scoped<'_>) -> IndexFold {
    let fold = fold_unary(unary.operator, &unary.argument, scoped);
    if fold.values.is_empty()
        || !fold.refusals.is_empty()
        || !fold.template_refusals.is_empty()
        || !fold.dynamic.is_empty()
    {
        return IndexFold::Dynamic;
    }
    let keys: Vec<String> = fold.values.iter().filter_map(leaf_key).collect();
    if keys.is_empty() {
        IndexFold::Dynamic
    } else {
        IndexFold::Keys(keys)
    }
}

/// The key spelling of one scalar leaf, or None for token references.
fn leaf_key(leaf: &AtomValue) -> Option<String> {
    match leaf {
        AtomValue::String(s) => Some(s.to_string()),
        AtomValue::Number(n) => Some(n.to_string()),
        AtomValue::Bool(b) => Some(b.to_string()),
        AtomValue::Null => Some("null".to_string()),
        AtomValue::Token { .. } => None,
    }
}

/// Look one key up in the base, pushing values or refusals onto the fold.
fn lookup_key(object: &Expression<'_>, key: &str, scoped: Scoped<'_>, fold: &mut ElementFold) {
    if lookup_const_base(object, key, scoped, fold) {
        return;
    }
    if lookup_inline_base(object, key, scoped, fold) {
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
            site: write.site(),
        });
        return true;
    }
    if let Some(map) = scoped.object(name) {
        // colors['red']  after  const colors = { red: '#f00' }
        match map.get(key) {
            Some(prop) if !prop.leaves.is_empty() => {
                fold.values.extend(prop.leaves.iter().cloned());
            }
            Some(_) => {
                fold.refusals.push(ElementRefusal::NonScalar {
                    key: key.to_string(),
                });
            }
            None => fold.refusals.push(ElementRefusal::Missing {
                key: key.to_string(),
            }),
        }
        return true;
    }
    if let Some(elements) = scoped.array(name) {
        // sizes[1]  after  const sizes = ['2px', '4px']
        lookup_const_element(elements, key, fold);
        return true;
    }
    false
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

/// Look one key up in an inline object or array literal, or false.
fn lookup_inline_base(
    object: &Expression<'_>,
    key: &str,
    scoped: Scoped<'_>,
    fold: &mut ElementFold,
) -> bool {
    match object {
        Expression::ObjectExpression(obj) => {
            // ({ a: 'red' })['a']
            lookup_inline_entry(obj, key, scoped, fold);
            true
        }
        Expression::ArrayExpression(arr) => {
            // ['red', 'blue'][0]
            lookup_inline_slot(&arr.elements, key, scoped, object.span(), fold);
            true
        }
        _ => false,
    }
}

/// Look one key up in an inline object's literal entries.
fn lookup_inline_entry(
    obj: &oxc_ast::ast::ObjectExpression<'_>,
    key: &str,
    scoped: Scoped<'_>,
    fold: &mut ElementFold,
) {
    use oxc_ast::ast::ObjectPropertyKind;
    for prop_kind in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop_kind else {
            continue;
        };
        if fold_property_key(&prop.key, scoped).as_deref() != Some(key) {
            continue;
        }
        if let Some(leaf) = inline_leaf(&prop.value, scoped) {
            fold.values.push(leaf);
        } else {
            fold.refusals.push(ElementRefusal::NonScalar {
                key: key.to_string(),
            });
        }
        return;
    }
    fold.refusals.push(ElementRefusal::Missing {
        key: key.to_string(),
    });
}

/// Look one key up in an inline array's flattened slots.
fn lookup_inline_slot(
    elements: &[ArrayExpressionElement<'_>],
    key: &str,
    scoped: Scoped<'_>,
    base_span: Span,
    fold: &mut ElementFold,
) {
    let Some(slots) = flatten_value_slots(elements, scoped) else {
        fold.refusals.push(ElementRefusal::DynamicBase(base_span));
        return;
    };
    let Some(pos) = array_position(key) else {
        fold.refusals.push(ElementRefusal::Missing {
            key: key.to_string(),
        });
        return;
    };
    match slots.get(pos) {
        Some(super::array::ValueSlot::Leaf(leaf)) => fold.values.push(leaf.clone()),
        Some(super::array::ValueSlot::Hole) => {
            fold.omitted = true;
        }
        Some(super::array::ValueSlot::Walk(elem)) => lookup_slot_element(elem, key, scoped, fold),
        None => {
            fold.refusals.push(ElementRefusal::Missing {
                key: key.to_string(),
            });
        }
    }
}

/// Lower one inline slot element to its leaves: literals, const names, holes.
fn lookup_slot_element(
    elem: &ArrayExpressionElement<'_>,
    key: &str,
    scoped: Scoped<'_>,
    fold: &mut ElementFold,
) {
    match elem {
        ArrayExpressionElement::Elision(_) => {
            fold.omitted = true;
        }
        _ => {
            let Some(expr) = elem.as_expression() else {
                return;
            };
            match slot_leaf(expr, scoped) {
                Some(leaves) => fold.values.extend(leaves),
                None => {
                    fold.refusals.push(ElementRefusal::NonScalar {
                        key: key.to_string(),
                    });
                }
            }
        }
    }
}

/// The leaves of one inline slot expression, or None when not static.
fn slot_leaf(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<Vec<AtomValue>> {
    if let Some(leaf) = inline_leaf(expr, scoped) {
        return Some(vec![leaf]);
    }
    if let Expression::Identifier(ident) = expr {
        // ([w])[0]  after  const w = 'red'
        let leaves = scoped.scalar_leaves(ident.name.as_str());
        if !leaves.is_empty() {
            return Some(leaves.to_vec());
        }
    }
    if let Expression::StaticMemberExpression(mem) = expr {
        if let Expression::Identifier(obj) = &mem.object {
            let leaves = scoped.object_prop_leaves(obj.name.as_str(), mem.property.name.as_str());
            if !leaves.is_empty() {
                return Some(leaves.to_vec());
            }
        }
    }
    None
}

/// One literal leaf of an inline entry, through transparent wrappers.
fn inline_leaf(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<AtomValue> {
    if let Some(inner) = unwrap_wrapper_target(expr) {
        return inline_leaf(inner, scoped);
    }
    match expr {
        Expression::StringLiteral(lit) => Some(AtomValue::String(lit.value.as_str().into())),
        Expression::NumericLiteral(lit) => {
            Some(AtomValue::Number(lit.value.to_string().into_boxed_str()))
        }
        Expression::BooleanLiteral(lit) => Some(AtomValue::Bool(lit.value)),
        _ => None,
    }
}

/// An array position for a key: canonical indices only (`1`, never `01`).
fn array_position(key: &str) -> Option<usize> {
    let pos: usize = key.parse().ok()?;
    if pos.to_string() != key {
        return None;
    }
    Some(pos)
}

/// The base as the author wrote it, for miss diagnostics: a name, a literal kind, or a kind.
pub fn describe_base(object: &Expression<'_>) -> String {
    match object {
        Expression::Identifier(base) => base.name.to_string(),
        Expression::ArrayExpression(_) => "array literal".to_string(),
        Expression::ObjectExpression(_) => "object literal".to_string(),
        _ => {
            if let Some(inner) = unwrap_wrapper_target(object) {
                return describe_base(inner);
            }
            block_value_kind(object)
        }
    }
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
