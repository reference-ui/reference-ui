//! Collects compound-member aliases (`Tabs.Panel = TabPanel`) from top-level statements.
//! Takes expression statements plus declarator inits, and unwraps transparent
//! TS/paren layers to find the plain identifier targets underneath.
//! Emits member aliases for the analyzer's dotted-host walk and identifier
//! chains (`const Alias = Target`) that the walk resolves transitively.
//! Only plain `=` assignments to `Ns.Prop` count; computed keys, deep chains,
//! and non-identifier targets stay out.

use oxc_ast::ast::{AssignmentTarget, Expression, ExpressionStatement};
use oxc_syntax::operator::AssignmentOperator;
use rustc_hash::FxHashMap;

use super::types::unwrap_transparent_expression;
use crate::analysis::model::MemberAlias;

/// Record one top-level `Ns.Prop = Target` assignment when it matches.
/// Anything else (calls, deep members, compound operators) is ignored.
pub(super) fn collect_member_alias(
    statement: &ExpressionStatement<'_>,
    aliases: &mut Vec<MemberAlias>,
) {
    let Some(alias) = member_alias_from_statement(statement) else {
        return;
    };
    aliases.push(alias);
}

/// Record one `const Name = Target` identifier link when the init is a bare
/// identifier. Component and factory inits never reach here; the caller
/// tries those first.
pub(super) fn collect_identifier_alias(
    name: &str,
    init: &Expression<'_>,
    aliases: &mut FxHashMap<String, String>,
) {
    let Expression::Identifier(target) = unwrap_transparent_expression(init) else {
        return;
    };
    if target.name.as_str() != name {
        aliases.insert(name.to_string(), target.name.to_string());
    }
}

fn member_alias_from_statement(statement: &ExpressionStatement<'_>) -> Option<MemberAlias> {
    let Expression::AssignmentExpression(assignment) = &statement.expression else {
        return None;
    };
    if !matches!(assignment.operator, AssignmentOperator::Assign) {
        return None;
    }
    let (namespace, prop) = member_target(assignment)?;
    let target = identifier_target(&assignment.right)?;
    Some(MemberAlias {
        namespace: namespace.to_string(),
        prop: prop.to_string(),
        target: target.to_string(),
    })
}

/// The `Ns` and `Prop` of a `Ns.Prop = ...` left side, else `None`.
fn member_target<'a>(
    assignment: &'a oxc_ast::ast::AssignmentExpression<'a>,
) -> Option<(&'a str, &'a str)> {
    let AssignmentTarget::StaticMemberExpression(member) = &assignment.left else {
        return None;
    };
    let Expression::Identifier(object) = &member.object else {
        return None;
    };
    Some((object.name.as_str(), member.property.name.as_str()))
}

/// The identifier a right-hand side names through transparent wrappers.
fn identifier_target<'a>(expression: &'a Expression<'a>) -> Option<&'a str> {
    let Expression::Identifier(target) = unwrap_transparent_expression(expression) else {
        return None;
    };
    Some(target.name.as_str())
}
