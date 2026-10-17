//! TS enum lowering for the scope table: each enum becomes the const object its initialized members
//! name. Literal, numeric, and boolean initializers record directly, while computed initializers
//! fold through the binary, template, and unary folders; uninitialized or dynamic members drop out,
//! so a read of them warns like any missing member. Takes a `TSEnumDeclaration` and emits the
//! `ConstObject` of its foldable members.

use oxc_ast::ast::{Expression, TSEnumDeclaration, TSEnumMemberName};

use super::super::lookup::{ImportLookup, ScopeChain, Scoped};
use super::super::table::{ScopeTable, ROOT_SCOPE};
use super::super::value::peel;
use crate::atom::AtomValue;
use crate::extract::constants::{ConstObject, LocalConstants, ObjectProp};
use crate::extract::fold::{fold_binary, fold_template, fold_unary};

/// Lower a TS enum to the object its initialized members name (SPEC-V2-45).
///
/// String, numeric, and boolean initializers record directly; computed
/// inits fold resolver-independently through the landed nodes — binaries,
/// templates, and `+`/`-`/`!`/`~` unaries — verbatim v2's
/// `expression_to_literal(init, None)`. Uninitialized, member-reference,
/// and still-dynamic members drop that path, so the use site warns exactly
/// like a missing member.
pub fn enum_object(decl: &TSEnumDeclaration<'_>) -> ConstObject {
    // enum Sizes { Small = '4px', Auto }
    let table = ScopeTable::new();
    let bag = LocalConstants::default();
    let scoped = ScopeChain::new(&table, ImportLookup::ProjectBag(&bag)).at(ROOT_SCOPE);
    let mut entries = ConstObject::new();
    for member in &decl.body.members {
        let Some(name) = enum_member_name(&member.id) else {
            continue;
        };
        let Some(init) = member.initializer.as_ref() else {
            continue;
        };
        if let Some(leaf) = enum_member_leaf(init, scoped) {
            entries.insert(
                name,
                ObjectProp {
                    leaves: vec![leaf],
                    nested: ConstObject::new(),
                    residue: false,
                    ident: None,
                },
            );
        }
    }
    entries
}

/// One enum member's name, or None for exotic member names.
fn enum_member_name(id: &TSEnumMemberName<'_>) -> Option<String> {
    match id {
        TSEnumMemberName::Identifier(ident) => Some(ident.name.to_string()),
        TSEnumMemberName::String(lit) => Some(lit.value.to_string()),
        _ => None,
    }
}

/// One enum member's leaf: literals and computed folds, wrappers peeled.
fn enum_member_leaf(init: &Expression<'_>, scoped: Scoped<'_>) -> Option<AtomValue> {
    // Wrap = ('4px')  — transparent wrappers peel before matching
    let peeled = peel(init);
    if let Some(leaf) = enum_literal_leaf(peeled) {
        return Some(leaf);
    }
    match peeled {
        Expression::BinaryExpression(bin) => enum_binary_leaf(bin, scoped),
        Expression::TemplateLiteral(lit) => enum_template_leaf(lit, scoped),
        Expression::UnaryExpression(unary) => enum_unary_leaf(unary, scoped),
        _ => None,
    }
}

/// One literal enum member, or None for computed initializers.
fn enum_literal_leaf(init: &Expression<'_>) -> Option<AtomValue> {
    match init {
        Expression::StringLiteral(s) => Some(AtomValue::String(s.value.as_str().into())),
        Expression::NumericLiteral(n) => Some(AtomValue::Number(n.value.to_string().into())),
        Expression::BooleanLiteral(b) => Some(AtomValue::Bool(b.value)),
        _ => None,
    }
}

/// One binary enum member (`AB = 'a' + 'b'`), or None unless exactly one
/// clean leaf — a member is one binding.
fn enum_binary_leaf(
    bin: &oxc_ast::ast::BinaryExpression<'_>,
    scoped: Scoped<'_>,
) -> Option<AtomValue> {
    let fold = fold_binary(bin.operator, &bin.left, &bin.right, scoped);
    if single_clean_binary(&fold) {
        return fold.values.into_iter().next();
    }
    None
}

/// One template enum member (`` Greet = `bl${'ue'}` ``), joined directly.
fn enum_template_leaf(
    lit: &oxc_ast::ast::TemplateLiteral<'_>,
    scoped: Scoped<'_>,
) -> Option<AtomValue> {
    let fold = fold_template(lit, scoped);
    if fold.values.len() == 1 && fold.refusals.is_empty() {
        return fold
            .values
            .into_iter()
            .next()
            .map(|joined| AtomValue::String(joined.into()));
    }
    None
}

/// One unary enum member (`Neg = -1`, `Flip = !0`, `Mask = ~1`), or None
/// unless exactly one clean leaf.
fn enum_unary_leaf(
    unary: &oxc_ast::ast::UnaryExpression<'_>,
    scoped: Scoped<'_>,
) -> Option<AtomValue> {
    let fold = fold_unary(unary.operator, &unary.argument, scoped);
    if single_clean_unary(&fold) {
        return fold.values.into_iter().next();
    }
    None
}

/// True for a binary fold carrying exactly one leaf and no residue.
fn single_clean_binary(fold: &crate::extract::fold::BinaryFold<'_, '_>) -> bool {
    fold.values.len() == 1
        && fold.refusals.is_empty()
        && fold.unary_refusals.is_empty()
        && fold.template_refusals.is_empty()
        && fold.dynamic.is_empty()
}

/// True for a unary fold carrying exactly one leaf and no residue.
fn single_clean_unary(fold: &crate::extract::fold::UnaryFold<'_, '_>) -> bool {
    fold.values.len() == 1
        && fold.refusals.is_empty()
        && fold.template_refusals.is_empty()
        && fold.dynamic.is_empty()
}
