//! Written-binding collection for mutation tracking (SPEC-V2-35).
//! Every `AssignmentExpression`, `UpdateExpression`, and for-in/of head yields
//! the names it writes with the span of each write. Identifier targets resolve
//! directly; member targets resolve by root object (a computed key is a read,
//! never a write). Destructuring patterns resolve in the `pattern` submodule
//! while defaults and computed keys stay reads. The collector marks these
//! names mutated so their declared inits stop resolving and uses diagnose
//! the write site.

mod pattern;

use oxc_ast::ast::{
    AssignmentTarget, Expression, ForStatementLeft, SimpleAssignmentTarget, VariableDeclaration,
};
use oxc_span::Span;

use pattern::{array_pattern_writes, object_pattern_writes};

/// One written name with the span of the write.
pub type Write<'a> = (&'a str, Span);

/// Names written by an assignment target (`color = …`, `theme.primary = …`).
pub fn target_writes<'a>(target: &AssignmentTarget<'a>, out: &mut Vec<Write<'a>>) {
    if let AssignmentTarget::AssignmentTargetIdentifier(ident) = target {
        // color = 'blue'
        out.push((ident.name.as_str(), ident.span));
        return;
    }
    if member_target_writes(target, out) {
        // theme.primary = 'blue'
        return;
    }
    if wrapper_target_writes(target, out) {
        // (color as string) = 'blue'
        return;
    }
    pattern_target_writes(target, out);
}

/// Root written by a member assignment target, or false when not a member.
fn member_target_writes<'a>(target: &AssignmentTarget<'a>, out: &mut Vec<Write<'a>>) -> bool {
    let object = match target {
        AssignmentTarget::ComputedMemberExpression(member) => &member.object,
        AssignmentTarget::StaticMemberExpression(member) => &member.object,
        AssignmentTarget::PrivateFieldExpression(member) => &member.object,
        _ => return false,
    };
    member_root_writes(object, out);
    true
}

/// Root written by a wrapped assignment target, or false when not wrapped.
fn wrapper_target_writes<'a>(target: &AssignmentTarget<'a>, out: &mut Vec<Write<'a>>) -> bool {
    let inner = match target {
        AssignmentTarget::TSAsExpression(expr) => &expr.expression,
        AssignmentTarget::TSSatisfiesExpression(expr) => &expr.expression,
        AssignmentTarget::TSNonNullExpression(expr) => &expr.expression,
        AssignmentTarget::TSTypeAssertion(expr) => &expr.expression,
        _ => return false,
    };
    expr_root_writes(inner, out);
    true
}

/// Names bound by a destructuring assignment target, if it is one.
fn pattern_target_writes<'a>(target: &AssignmentTarget<'a>, out: &mut Vec<Write<'a>>) {
    match target {
        AssignmentTarget::ArrayAssignmentTarget(target) => {
            // [a, b] = pair
            array_pattern_writes(target, out);
        }
        AssignmentTarget::ObjectAssignmentTarget(target) => {
            // ({ color } = theme)
            object_pattern_writes(target, out);
        }
        _ => {}
    }
}

/// Names written by an update target (`count++`, `--gap`).
pub fn simple_target_writes<'a>(target: &SimpleAssignmentTarget<'a>, out: &mut Vec<Write<'a>>) {
    if let SimpleAssignmentTarget::AssignmentTargetIdentifier(ident) = target {
        // count++
        out.push((ident.name.as_str(), ident.span));
        return;
    }
    if simple_member_writes(target, out) {
        return;
    }
    simple_wrapper_writes(target, out);
}

/// Root written by a member update target, or false when not a member.
fn simple_member_writes<'a>(target: &SimpleAssignmentTarget<'a>, out: &mut Vec<Write<'a>>) -> bool {
    let object = match target {
        SimpleAssignmentTarget::ComputedMemberExpression(member) => &member.object,
        SimpleAssignmentTarget::StaticMemberExpression(member) => &member.object,
        SimpleAssignmentTarget::PrivateFieldExpression(member) => &member.object,
        _ => return false,
    };
    member_root_writes(object, out);
    true
}

/// Root written by a wrapped update target, if it is one.
fn simple_wrapper_writes<'a>(target: &SimpleAssignmentTarget<'a>, out: &mut Vec<Write<'a>>) {
    let inner = match target {
        SimpleAssignmentTarget::TSAsExpression(expr) => &expr.expression,
        SimpleAssignmentTarget::TSSatisfiesExpression(expr) => &expr.expression,
        SimpleAssignmentTarget::TSNonNullExpression(expr) => &expr.expression,
        SimpleAssignmentTarget::TSTypeAssertion(expr) => &expr.expression,
        _ => return,
    };
    expr_root_writes(inner, out);
}

/// Names written by a for-in/of head (`for (picked of …)`, `for (let k in …)`).
pub fn for_head_writes<'a>(left: &ForStatementLeft<'a>, out: &mut Vec<Write<'a>>) {
    if let ForStatementLeft::VariableDeclaration(decl) = left {
        // for (var k = 0 in obj)  — the loop reassigns the declared name
        declaration_writes(decl, out);
        return;
    }
    if let ForStatementLeft::AssignmentTargetIdentifier(ident) = left {
        // for (picked of list)
        out.push((ident.name.as_str(), ident.span));
        return;
    }
    if for_member_writes(left, out) {
        return;
    }
    if for_wrapper_writes(left, out) {
        return;
    }
    for_pattern_writes(left, out);
}

/// Root written by a member for-in/of head, or false when not a member.
fn for_member_writes<'a>(left: &ForStatementLeft<'a>, out: &mut Vec<Write<'a>>) -> bool {
    let object = match left {
        ForStatementLeft::ComputedMemberExpression(member) => &member.object,
        ForStatementLeft::StaticMemberExpression(member) => &member.object,
        ForStatementLeft::PrivateFieldExpression(member) => &member.object,
        _ => return false,
    };
    member_root_writes(object, out);
    true
}

/// Root written by a wrapped for-in/of head, or false when not wrapped.
fn for_wrapper_writes<'a>(left: &ForStatementLeft<'a>, out: &mut Vec<Write<'a>>) -> bool {
    let inner = match left {
        ForStatementLeft::TSAsExpression(expr) => &expr.expression,
        ForStatementLeft::TSSatisfiesExpression(expr) => &expr.expression,
        ForStatementLeft::TSNonNullExpression(expr) => &expr.expression,
        ForStatementLeft::TSTypeAssertion(expr) => &expr.expression,
        _ => return false,
    };
    expr_root_writes(inner, out);
    true
}

/// Names bound by a destructuring for-in/of head, if it is one.
fn for_pattern_writes<'a>(left: &ForStatementLeft<'a>, out: &mut Vec<Write<'a>>) {
    match left {
        ForStatementLeft::ArrayAssignmentTarget(target) => {
            array_pattern_writes(target, out);
        }
        ForStatementLeft::ObjectAssignmentTarget(target) => {
            object_pattern_writes(target, out);
        }
        _ => {}
    }
}

/// Root identifier of a member target's object (`theme` in `theme.primary`).
pub(super) fn member_root_writes<'a>(object: &Expression<'a>, out: &mut Vec<Write<'a>>) {
    // theme[key] = 'blue'  — the key is a read, only the root is written
    expr_root_writes(object, out);
}

/// Root identifier of a wrapped member object, unwrapping parens and assertions.
pub(super) fn expr_root_writes<'a>(expr: &Expression<'a>, out: &mut Vec<Write<'a>>) {
    if let Expression::Identifier(ident) = expr {
        out.push((ident.name.as_str(), ident.span));
        return;
    }
    if member_expr_writes(expr, out) {
        return;
    }
    if wrapper_expr_writes(expr, out) {
        return;
    }
    if let Expression::ChainExpression(chain) = expr {
        chain_root_writes(&chain.expression, out);
    }
}

/// Root written through a member expression, or false when not a member.
fn member_expr_writes<'a>(expr: &Expression<'a>, out: &mut Vec<Write<'a>>) -> bool {
    let object = match expr {
        Expression::ComputedMemberExpression(member) => &member.object,
        Expression::StaticMemberExpression(member) => &member.object,
        Expression::PrivateFieldExpression(member) => &member.object,
        _ => return false,
    };
    expr_root_writes(object, out);
    true
}

/// Root written through a wrapper expression, or false when not wrapped.
fn wrapper_expr_writes<'a>(expr: &Expression<'a>, out: &mut Vec<Write<'a>>) -> bool {
    if let Expression::ParenthesizedExpression(paren) = expr {
        expr_root_writes(&paren.expression, out);
        return true;
    }
    ts_wrapper_expr_writes(expr, out)
}

/// Root written through a TS assertion wrapper, or false when not wrapped.
fn ts_wrapper_expr_writes<'a>(expr: &Expression<'a>, out: &mut Vec<Write<'a>>) -> bool {
    let inner = match expr {
        Expression::TSAsExpression(expr) => &expr.expression,
        Expression::TSSatisfiesExpression(expr) => &expr.expression,
        Expression::TSNonNullExpression(expr) => &expr.expression,
        Expression::TSTypeAssertion(expr) => &expr.expression,
        _ => return false,
    };
    expr_root_writes(inner, out);
    true
}

/// Root identifier of an optional chain target (`a` in `a?.b = …`).
fn chain_root_writes<'a>(chain: &oxc_ast::ast::ChainElement<'a>, out: &mut Vec<Write<'a>>) {
    match chain {
        oxc_ast::ast::ChainElement::StaticMemberExpression(member) => {
            expr_root_writes(&member.object, out);
        }
        oxc_ast::ast::ChainElement::ComputedMemberExpression(member) => {
            expr_root_writes(&member.object, out);
        }
        oxc_ast::ast::ChainElement::PrivateFieldExpression(member) => {
            expr_root_writes(&member.object, out);
        }
        oxc_ast::ast::ChainElement::TSNonNullExpression(expr) => {
            expr_root_writes(&expr.expression, out);
        }
        _ => {}
    }
}

/// Names declared by a for-in/of head declaration.
fn declaration_writes<'a>(decl: &VariableDeclaration<'a>, out: &mut Vec<Write<'a>>) {
    for declarator in &decl.declarations {
        pattern::binding_pattern_writes(&declarator.id, out);
    }
}
