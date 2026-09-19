//! Element-access folding (`obj[key]`, `arr[i]`), shared by both walkers.
//!
//! `fold_element_access` resolves one computed read over a const object, a
//! const array, or an inline literal whose index folds to a string or number,
//! fanning out over multi-leaf indices the way ternaries scoop both arms.
//! Chained reads resolve inside out through nested const entries
//! (`colors['red']['500']`), mirroring the static member path; anything
//! unresolvable becomes a refusal the want walker warns on while the plan
//! walker yields no leaf for it.

use oxc_ast::ast::{ArrayExpressionElement, Expression};
use oxc_span::{GetSpan, Span};

use super::array::flatten_value_slots;
use super::element_index::{fold_index, IndexFold};
use super::key::fold_property_key;
use super::member::{member_path_object, member_root_name};
use crate::atom::AtomValue;
use crate::extract::constants::{object_entries, ConstArrayElement, ConstObject};
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
    /// True when a read entry kept leaves beside a dropped dynamic arm
    /// (Ph4 residue channel); the want walker diagnoses it.
    pub residue: bool,
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
    /// The base name was written after its init; the phrase names the write.
    MutatedBase { name: String, write: String },
}

impl ElementRefusal {
    /// The diagnostic text for a refusal at one style prop.
    pub fn message(&self, prop: &str, base: &str, index: &str) -> String {
        match self {
            Self::DynamicIndex(_) => {
                format!("Dynamic non-literal element index '{index}' encountered for prop '{prop}'")
            }
            Self::DynamicBase(_) => {
                format!("Dynamic non-literal element base '{base}' encountered for prop '{prop}'")
            }
            Self::Missing { key } => {
                format!("Element access '{base}[{key}]' has no static entry for prop '{prop}'")
            }
            Self::NonScalar { key } => format!(
                "Element access '{base}[{key}]' is not a static style value for prop '{prop}'"
            ),
            Self::MutatedBase { name, write } => format!(
                "Dynamic mutated binding '{name}' encountered for prop '{prop}' ({write}; element read is stale)"
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

/// A chained base resolved to entries, a named write, or unresolvable.
enum Nested {
    /// The entries the chain names; the caller looks the key up in them.
    Entries(ConstObject),
    /// An identifier hop was written; the caller names the write.
    Mutated { name: String, write: String },
    /// Anything else; the caller refuses the base at its span.
    Dynamic,
}

/// Look one key up in a chained base (`colors['red']['500']`), or false.
///
/// Member and computed chains resolve inside out through [`nested_entries`];
/// the outer key then looks up exactly like a single-hop read, so misses
/// and non-scalars diagnose with the outer key. An unresolvable chain falls
/// through to the caller's base refusal, so only a named write returns handled.
fn lookup_nested_base(
    object: &Expression<'_>,
    key: &str,
    scoped: Scoped<'_>,
    fold: &mut ElementFold,
) -> bool {
    let mut probe = object;
    while let Some(inner) = unwrap_wrapper_target(probe) {
        probe = inner;
    }
    if !matches!(
        probe,
        Expression::ComputedMemberExpression(_) | Expression::StaticMemberExpression(_)
    ) {
        return false;
    }
    match nested_entries(probe, scoped) {
        Nested::Entries(entries) => {
            lookup_nested_entry(&entries, key, fold);
            true
        }
        Nested::Mutated { name, write } => {
            fold.refusals
                .push(ElementRefusal::MutatedBase { name, write });
            true
        }
        Nested::Dynamic => false,
    }
}

/// Look the outer key up in resolved nested entries.
fn lookup_nested_entry(entries: &ConstObject, key: &str, fold: &mut ElementFold) {
    match entries.get(key) {
        Some(prop) if !prop.leaves.is_empty() => {
            fold.values.extend(prop.leaves.iter().cloned());
            fold.residue |= prop.residue;
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
}

/// Resolve a chained base to its entries, peeling wrappers first.
fn nested_entries(expr: &Expression<'_>, scoped: Scoped<'_>) -> Nested {
    if let Some(inner) = unwrap_wrapper_target(expr) {
        return nested_entries(inner, scoped);
    }
    nested_entries_inner(expr, scoped)
}

/// Resolve an unwrapped chained base: identifier tables, static member
/// paths, inline objects, and computed reads over them, inside out.
fn nested_entries_inner(expr: &Expression<'_>, scoped: Scoped<'_>) -> Nested {
    match expr {
        Expression::Identifier(base) => nested_ident(base.name.as_str(), scoped),
        Expression::StaticMemberExpression(mem) => nested_static(mem, scoped),
        Expression::ComputedMemberExpression(mem) => nested_computed(mem, scoped),
        Expression::ObjectExpression(obj) => Nested::Entries(object_entries(obj)),
        _ => Nested::Dynamic,
    }
}

/// An identifier hop: its const table, or the write that poisoned it.
fn nested_ident(name: &str, scoped: Scoped<'_>) -> Nested {
    if let Some(write) = scoped.mutation(name) {
        return Nested::Mutated {
            name: name.to_string(),
            write: write.write_phrase(),
        };
    }
    match scoped.object(name) {
        Some(entries) => Nested::Entries(entries.clone()),
        None => Nested::Dynamic,
    }
}

/// A static-member hop (`o.red['500']`) through the member path node.
fn nested_static(mem: &oxc_ast::ast::StaticMemberExpression<'_>, scoped: Scoped<'_>) -> Nested {
    if let Some(root) = member_root_name(mem) {
        if let Some(write) = scoped.mutation(root) {
            return Nested::Mutated {
                name: root.to_string(),
                write: write.write_phrase(),
            };
        }
    }
    match member_path_object(mem, scoped) {
        Some(entries) => Nested::Entries(entries.clone()),
        None => Nested::Dynamic,
    }
}

/// A computed hop: its base's entries under its single intermediate key.
///
/// Multi-leaf intermediates refuse, verbatim v2 (Conditional keys drop in
/// `literal_to_property_key`); only the terminal index fans out.
fn nested_computed(mem: &oxc_ast::ast::ComputedMemberExpression<'_>, scoped: Scoped<'_>) -> Nested {
    let IndexFold::Keys(keys) = fold_index(&mem.expression, scoped) else {
        return Nested::Dynamic;
    };
    let [key] = keys.as_slice() else {
        return Nested::Dynamic;
    };
    match nested_entries(&mem.object, scoped) {
        Nested::Entries(entries) => nested_prop_object(&entries, key),
        Nested::Mutated { name, write } => Nested::Mutated { name, write },
        Nested::Dynamic => nested_array_object(&mem.object, key, scoped),
    }
}

/// The nested entries under one intermediate key, if it holds an object.
fn nested_prop_object(entries: &ConstObject, key: &str) -> Nested {
    match entries.get(key) {
        Some(prop) if !prop.nested.is_empty() => Nested::Entries(prop.nested.clone()),
        _ => Nested::Dynamic,
    }
}

/// A const-array hop (`matrix[0]['x']`): the indexed object entries.
fn nested_array_object(object: &Expression<'_>, key: &str, scoped: Scoped<'_>) -> Nested {
    let mut probe = object;
    while let Some(inner) = unwrap_wrapper_target(probe) {
        probe = inner;
    }
    let Expression::Identifier(base) = probe else {
        return Nested::Dynamic;
    };
    let name = base.name.as_str();
    if let Some(write) = scoped.mutation(name) {
        return Nested::Mutated {
            name: name.to_string(),
            write: write.write_phrase(),
        };
    }
    let Some(elements) = scoped.array(name) else {
        return Nested::Dynamic;
    };
    let Some(pos) = array_position(key) else {
        return Nested::Dynamic;
    };
    match elements.get(pos) {
        Some(ConstArrayElement::Object(leaves)) => {
            // Array objects record flat leaf maps; lift each leaf to an entry.
            let mut entries = ConstObject::new();
            for (name, leaf) in leaves {
                entries.insert(
                    name.clone(),
                    crate::extract::constants::ObjectProp {
                        leaves: vec![leaf.clone()],
                        nested: ConstObject::new(),
                        residue: false,
                    },
                );
            }
            Nested::Entries(entries)
        }
        _ => Nested::Dynamic,
    }
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
        match map.get(key) {
            Some(prop) if !prop.leaves.is_empty() => {
                fold.values.extend(prop.leaves.iter().cloned());
                fold.residue |= prop.residue;
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
            match slot_leaf(expr, scoped, fold) {
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
fn slot_leaf(
    expr: &Expression<'_>,
    scoped: Scoped<'_>,
    fold: &mut ElementFold,
) -> Option<Vec<AtomValue>> {
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
                fold.residue |=
                    scoped.object_prop_residue(obj.name.as_str(), mem.property.name.as_str());
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
