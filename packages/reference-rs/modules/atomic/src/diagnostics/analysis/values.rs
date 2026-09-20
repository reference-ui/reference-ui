//! Exact-value vs unknown-value classification for independent analysis.
//!
//! Answers what JSON value runtime will observe at one style slot: an exact
//! value plus its important flag, a hole runtime skips (no query at all), or
//! unknown. Literals classify here; const names resolve through the shared
//! const values and compound shapes build in the structured module. The
//! classifier never reads extraction wants or success, and anything not
//! provably static is unknown — never a guessed key.

use std::collections::HashSet;

use oxc_ast::ast::{Expression, UnaryOperator};
use serde_json::{json, Value};

use super::const_values::{atom_to_class, resolve_const_scalar, resolve_member_atom};
use super::structured::raw_array;

/// What runtime will observe at one classified value position.
#[derive(Debug, Clone, PartialEq)]
pub enum ValueClass {
    /// The value is statically known; `important` follows the `!` markers.
    Exact { value: Value, important: bool },
    /// Runtime skips this leaf (`null`, `undefined`, `void`): no query, no fact.
    Hole,
    /// The value needs evaluation: identifiers, members, calls, binaries,
    /// branching, templates with holes, spreads with unknown shape.
    Unknown,
}

/// The name truth one classification may consult: shared const values plus
/// the walk's shadow stack. Shadowed names never resolve through the map.
pub struct ValueScope<'a> {
    pub constants: &'a crate::extract::constants::LocalConstants,
    pub shadows: &'a [HashSet<String>],
}

impl ValueScope<'_> {
    /// True when any enclosing scope declares `name`.
    pub fn is_shadowed(&self, name: &str) -> bool {
        super::is_shadowed(self.shadows, name)
    }
}

/// Classify one leaf-position value: literals and provable const shapes go
/// exact, holes report `Hole`, everything else is unknown. Object literals
/// are unknown here by construction: the object walker intercepts them first
/// (responsive value vs nested condition) and never sends them down.
pub fn classify_value(expr: &Expression<'_>, scope: &ValueScope<'_>) -> ValueClass {
    let expr = unwrap_value(expr);
    if let Some(literal) = classify_literal(expr) {
        return literal;
    }
    classify_compound(expr, scope).unwrap_or(ValueClass::Unknown)
}

/// Classify one non-literal: names resolve through const values and nested
/// shapes build or fold, or the node is unknown.
fn classify_compound(expr: &Expression<'_>, scope: &ValueScope<'_>) -> Option<ValueClass> {
    classify_named(expr, scope).or_else(|| classify_nested(expr, scope))
}

/// Classify one name shape: identifiers and members resolve, templates
/// need hole-free cooked text.
fn classify_named(expr: &Expression<'_>, scope: &ValueScope<'_>) -> Option<ValueClass> {
    match expr {
        Expression::Identifier(ident) => Some(classify_identifier(ident.name.as_str(), scope)),
        Expression::TemplateLiteral(lit) => Some(classify_template(lit)),
        Expression::StaticMemberExpression(_) => Some(classify_member(expr, scope)),
        _ => None,
    }
}

/// Classify one member chain through its recorded leaf atom.
fn classify_member(expr: &Expression<'_>, scope: &ValueScope<'_>) -> ValueClass {
    match resolve_member_atom(expr, scope) {
        Some(atom) => const_class(&atom),
        None => ValueClass::Unknown,
    }
}

/// Classify one nested shape: arrays build raw and unary nodes fold in
/// leaf position.
fn classify_nested(expr: &Expression<'_>, scope: &ValueScope<'_>) -> Option<ValueClass> {
    match expr {
        Expression::ArrayExpression(arr) => Some(classify_array(arr, scope)),
        Expression::UnaryExpression(unary) => Some(leaf_unary(unary)),
        _ => None,
    }
}

/// Classify one array as its whole raw value, or unknown.
fn classify_array(arr: &oxc_ast::ast::ArrayExpression<'_>, scope: &ValueScope<'_>) -> ValueClass {
    match raw_array(arr, scope) {
        Some(value) => ValueClass::Exact {
            value,
            important: false,
        },
        None => ValueClass::Unknown,
    }
}

/// Classify one literal: strings split `!` and every other literal has
/// a fixed reading.
fn classify_literal(expr: &Expression<'_>) -> Option<ValueClass> {
    if let Expression::StringLiteral(lit) = expr {
        let (clean, important) = super::const_values::split_important(lit.value.as_str());
        return Some(ValueClass::Exact {
            value: Value::String(clean.to_string()),
            important,
        });
    }
    plain_literal(expr)
}

/// Classify one non-string literal: numbers and booleans go exact, nulls
/// are holes, and bigints stay unknown: a BigInt value is not JSON-shaped,
/// so no exact runtime lookup key is knowable for it.
fn plain_literal(expr: &Expression<'_>) -> Option<ValueClass> {
    match expr {
        Expression::NumericLiteral(lit) => Some(ValueClass::Exact {
            value: number_to_json(lit.value),
            important: false,
        }),
        Expression::BooleanLiteral(lit) => Some(ValueClass::Exact {
            value: Value::Bool(lit.value),
            important: false,
        }),
        Expression::NullLiteral(_) => Some(ValueClass::Hole),
        Expression::BigIntLiteral(_) => Some(ValueClass::Unknown),
        _ => None,
    }
}

/// Classify one identifier: holes for `undefined`, exact for single-leaf
/// unmutated const scalars, unknown for everything else (params, shadowed
/// names, mutated bindings, multi-leaf branching initializers).
fn classify_identifier(name: &str, scope: &ValueScope<'_>) -> ValueClass {
    match name {
        "undefined" | "null" => ValueClass::Hole,
        _ => match resolve_const_scalar(name, scope) {
            Some(atom) => const_class(&atom),
            None => ValueClass::Unknown,
        },
    }
}

/// One resolved const atom as its class through the shared hole mapping:
/// strings split `!` like literals, `false`/`null` are holes.
fn const_class(atom: &crate::atom::AtomValue) -> ValueClass {
    atom_to_class(atom)
}

/// A hole-free template is its cooked string (splitting `!`); any hole,
/// any missing cooked text, is unknown.
fn classify_template(lit: &oxc_ast::ast::TemplateLiteral<'_>) -> ValueClass {
    if lit.expressions.is_empty() && lit.quasis.len() == 1 {
        let cooked = lit.quasis.first().and_then(|quasi| quasi.value.cooked);
        if let Some(cooked) = cooked {
            let (clean, important) = super::const_values::split_important(cooked.as_str());
            return ValueClass::Exact {
                value: Value::String(clean.to_string()),
                important,
            };
        }
    }
    ValueClass::Unknown
}

/// Fold one unary node: `void` is a hole, `!` folds booleans, `-`/`+` fold
/// numeric literals, and anything else needs evaluation.
pub fn classify_unary(unary: &oxc_ast::ast::UnaryExpression<'_>) -> ValueClass {
    match unary.operator {
        UnaryOperator::Void => ValueClass::Hole,
        UnaryOperator::LogicalNot => unary_not(&unary.argument),
        UnaryOperator::UnaryNegation | UnaryOperator::UnaryPlus => unary_sign(
            unary.operator == UnaryOperator::UnaryNegation,
            &unary.argument,
        ),
        _ => ValueClass::Unknown,
    }
}

/// Fold one unary node in leaf position: a folded `false` (`!true`) is a
/// hole runtime never queries, so it emits no fact. The hole mapping lives
/// here, not in `classify_unary`: compound positions bake through that
/// folder directly, where folded `false` stays raw like runtime keeps it.
fn leaf_unary(unary: &oxc_ast::ast::UnaryExpression<'_>) -> ValueClass {
    match classify_unary(unary) {
        ValueClass::Exact {
            value: Value::Bool(false),
            ..
        } => ValueClass::Hole,
        folded => folded,
    }
}

/// Fold `!` over a boolean literal; anything else stays unknown.
fn unary_not(argument: &Expression<'_>) -> ValueClass {
    match unwrap_value(argument) {
        Expression::BooleanLiteral(lit) => ValueClass::Exact {
            value: Value::Bool(!lit.value),
            important: false,
        },
        _ => ValueClass::Unknown,
    }
}

/// Fold a sign over a numeric literal; anything else stays unknown.
fn unary_sign(negate: bool, argument: &Expression<'_>) -> ValueClass {
    match unwrap_value(argument) {
        Expression::NumericLiteral(lit) => {
            let value = if negate { -lit.value } else { lit.value };
            ValueClass::Exact {
                value: number_to_json(value),
                important: false,
            }
        }
        _ => ValueClass::Unknown,
    }
}

/// Unwrap transparent wrappers (`as`, parens, `!`, `<T>`) to the bare value.
pub fn unwrap_value<'a>(mut expr: &'a Expression<'a>) -> &'a Expression<'a> {
    while let Some(inner) = unwrap_one(expr) {
        expr = inner;
    }
    expr
}

/// Unwrap one transparent layer, or None when the node is already bare.
fn unwrap_one<'a>(expr: &'a Expression<'a>) -> Option<&'a Expression<'a>> {
    if let Expression::ParenthesizedExpression(inner) = expr {
        return Some(&inner.expression);
    }
    ts_unwrap_one(expr)
}

/// Unwrap one TypeScript erasure layer, or None when the node has none.
fn ts_unwrap_one<'a>(expr: &'a Expression<'a>) -> Option<&'a Expression<'a>> {
    ts_cast_unwrap(expr).or_else(|| ts_mark_unwrap(expr))
}

/// Unwrap one cast layer (`as`, `satisfies`, `<T>`), if present.
fn ts_cast_unwrap<'a>(expr: &'a Expression<'a>) -> Option<&'a Expression<'a>> {
    match expr {
        Expression::TSAsExpression(inner) => Some(&inner.expression),
        Expression::TSSatisfiesExpression(inner) => Some(&inner.expression),
        Expression::TSTypeAssertion(inner) => Some(&inner.expression),
        _ => None,
    }
}

/// Unwrap one mark layer (`!`, `<T>` instantiation), if present.
fn ts_mark_unwrap<'a>(expr: &'a Expression<'a>) -> Option<&'a Expression<'a>> {
    match expr {
        Expression::TSNonNullExpression(inner) => Some(&inner.expression),
        Expression::TSInstantiationExpression(inner) => Some(&inner.expression),
        _ => None,
    }
}

/// One numeric literal as JSON: integral values print without decimals.
/// Mirrors the engine's authored-value spelling exactly.
pub fn number_to_json(value: f64) -> Value {
    if (value - value.round()).abs() < 1e-9 {
        json!(value as i64)
    } else {
        json!(value)
    }
}

#[cfg(test)]
mod tests {
    use super::super::support::{first_prop_value, parse_for_test};
    use super::*;

    fn classify(source: &str) -> ValueClass {
        classify_with_consts("css({ v: __EXPR__ })".replace("__EXPR__", source).as_str())
    }

    fn classify_with_consts(source: &str) -> ValueClass {
        let allocator = oxc_allocator::Allocator::default();
        let program = parse_for_test(&allocator, source);
        let constants =
            crate::extract::constants::collect_local_constants(&program, "test.ts", Some(source));
        let shadows: Vec<HashSet<String>> = Vec::new();
        let scope = ValueScope {
            constants: &constants,
            shadows: &shadows,
        };
        let value = first_prop_value(&program);
        classify_value(value, &scope)
    }

    fn exact(value: Value, important: bool) -> ValueClass {
        ValueClass::Exact { value, important }
    }

    #[test]
    fn literals_classify_exact() {
        assert_eq!(classify("'red'"), exact(json!("red"), false));
        assert_eq!(classify("2"), exact(json!(2), false));
        assert_eq!(classify("2.5"), exact(json!(2.5), false));
        assert_eq!(classify("true"), exact(json!(true), false));
        assert_eq!(classify("`red`"), exact(json!("red"), false));
        assert_eq!(classify("('red')"), exact(json!("red"), false));
        assert_eq!(classify("'red' as const"), exact(json!("red"), false));
    }

    #[test]
    fn important_markers_split_like_the_engine() {
        assert_eq!(classify("'red!'"), exact(json!("red"), true));
        assert_eq!(classify("'red !important'"), exact(json!("red"), true));
        assert_eq!(classify("'!'"), exact(json!("!"), false));
    }

    #[test]
    fn holes_and_dynamics_classify() {
        assert_eq!(classify("null"), ValueClass::Hole);
        assert_eq!(classify("undefined"), ValueClass::Hole);
        assert_eq!(classify("void 0"), ValueClass::Hole);
        assert_eq!(classify("n"), ValueClass::Unknown);
        assert_eq!(classify("`${n}px`"), ValueClass::Unknown);
        assert_eq!(classify("maybe()"), ValueClass::Unknown);
        assert_eq!(classify("a + b"), ValueClass::Unknown);
        assert_eq!(classify("ok ? 'a' : 'b'"), ValueClass::Unknown);
    }

    #[test]
    fn bigint_leaves_stay_unknown() {
        assert_eq!(classify("10n"), ValueClass::Unknown);
    }

    #[test]
    fn unary_folds_literals_only() {
        assert_eq!(classify("-2"), exact(json!(-2), false));
        assert_eq!(classify("!true"), ValueClass::Hole);
        assert_eq!(classify("!false"), exact(json!(true), false));
        assert_eq!(classify("-n"), ValueClass::Unknown);
    }

    #[test]
    fn arrays_keep_raw_elements_with_null_holes() {
        assert_eq!(
            classify("['1', null, '4']"),
            exact(json!(["1", null, "4"]), false)
        );
        assert_eq!(
            classify("['1', ...['2'], '4']"),
            exact(json!(["1", "2", "4"]), false)
        );
        assert_eq!(classify("['1', ...rest]"), ValueClass::Unknown);
    }
}
