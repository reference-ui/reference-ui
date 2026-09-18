//! Destructuring-pattern writes for mutation tracking.
//! Array and object assignment patterns bind one name per element while their
//! defaults, inits, and computed keys stay reads; declaration patterns do the
//! same for for-in/of head declarations. Each bound name resolves through the
//! parent module, so a pattern over members still poisons only the root.

use oxc_ast::ast::{
    ArrayAssignmentTarget, AssignmentTargetMaybeDefault, BindingPattern, ObjectAssignmentTarget,
};

use super::{expr_root_writes, member_root_writes, target_writes, Write};

/// Names bound by an array destructuring target; defaults are reads.
pub(super) fn array_pattern_writes<'a>(
    target: &ArrayAssignmentTarget<'a>,
    out: &mut Vec<Write<'a>>,
) {
    for element in target.elements.iter().flatten() {
        maybe_default_writes(element, out);
    }
    if let Some(rest) = &target.rest {
        target_writes(&rest.target, out);
    }
}

/// Names bound by an object destructuring target; inits are reads.
pub(super) fn object_pattern_writes<'a>(
    target: &ObjectAssignmentTarget<'a>,
    out: &mut Vec<Write<'a>>,
) {
    use oxc_ast::ast::AssignmentTargetProperty;
    for property in &target.properties {
        match property {
            AssignmentTargetProperty::AssignmentTargetPropertyIdentifier(prop) => {
                // ({ color } = theme)  — `: init` stays a read
                out.push((prop.binding.name.as_str(), prop.binding.span));
            }
            AssignmentTargetProperty::AssignmentTargetPropertyProperty(prop) => {
                // ({ primary: color } = theme)
                maybe_default_writes(&prop.binding, out);
            }
        }
    }
    if let Some(rest) = &target.rest {
        target_writes(&rest.target, out);
    }
}

/// Names bound by a pattern element with an optional default value.
fn maybe_default_writes<'a>(element: &AssignmentTargetMaybeDefault<'a>, out: &mut Vec<Write<'a>>) {
    if let AssignmentTargetMaybeDefault::AssignmentTargetWithDefault(with_default) = element {
        // [gap = '4px'] = sizes  — the default is a read
        target_writes(&with_default.binding, out);
        return;
    }
    if let AssignmentTargetMaybeDefault::AssignmentTargetIdentifier(ident) = element {
        out.push((ident.name.as_str(), ident.span));
        return;
    }
    if maybe_default_member_writes(element, out) {
        return;
    }
    if maybe_default_wrapper_writes(element, out) {
        return;
    }
    maybe_default_pattern_writes(element, out);
}

/// Root written by a member pattern element, or false when not a member.
fn maybe_default_member_writes<'a>(
    element: &AssignmentTargetMaybeDefault<'a>,
    out: &mut Vec<Write<'a>>,
) -> bool {
    let object = match element {
        AssignmentTargetMaybeDefault::ComputedMemberExpression(member) => &member.object,
        AssignmentTargetMaybeDefault::StaticMemberExpression(member) => &member.object,
        AssignmentTargetMaybeDefault::PrivateFieldExpression(member) => &member.object,
        _ => return false,
    };
    member_root_writes(object, out);
    true
}

/// Root written by a wrapped pattern element, or false when not wrapped.
fn maybe_default_wrapper_writes<'a>(
    element: &AssignmentTargetMaybeDefault<'a>,
    out: &mut Vec<Write<'a>>,
) -> bool {
    let inner = match element {
        AssignmentTargetMaybeDefault::TSAsExpression(expr) => &expr.expression,
        AssignmentTargetMaybeDefault::TSSatisfiesExpression(expr) => &expr.expression,
        AssignmentTargetMaybeDefault::TSNonNullExpression(expr) => &expr.expression,
        AssignmentTargetMaybeDefault::TSTypeAssertion(expr) => &expr.expression,
        _ => return false,
    };
    expr_root_writes(inner, out);
    true
}

/// Names bound by a nested pattern element, if it is one.
fn maybe_default_pattern_writes<'a>(
    element: &AssignmentTargetMaybeDefault<'a>,
    out: &mut Vec<Write<'a>>,
) {
    match element {
        AssignmentTargetMaybeDefault::ArrayAssignmentTarget(target) => {
            array_pattern_writes(target, out);
        }
        AssignmentTargetMaybeDefault::ObjectAssignmentTarget(target) => {
            object_pattern_writes(target, out);
        }
        _ => {}
    }
}

/// Names bound by a declaration pattern (`k` in `for (var k = 0 in …)`).
pub(super) fn binding_pattern_writes<'a>(pattern: &BindingPattern<'a>, out: &mut Vec<Write<'a>>) {
    match pattern {
        BindingPattern::BindingIdentifier(ident) => {
            out.push((ident.name.as_str(), ident.span));
        }
        BindingPattern::ObjectPattern(pattern) => {
            object_binding_writes(pattern, out);
        }
        BindingPattern::ArrayPattern(pattern) => {
            array_binding_writes(pattern, out);
        }
        BindingPattern::AssignmentPattern(pattern) => {
            binding_pattern_writes(&pattern.left, out);
        }
    }
}

/// Names bound by an object declaration pattern.
fn object_binding_writes<'a>(
    pattern: &oxc_ast::ast::ObjectPattern<'a>,
    out: &mut Vec<Write<'a>>,
) {
    for property in &pattern.properties {
        binding_pattern_writes(&property.value, out);
    }
    if let Some(rest) = &pattern.rest {
        binding_pattern_writes(&rest.argument, out);
    }
}

/// Names bound by an array declaration pattern.
fn array_binding_writes<'a>(pattern: &oxc_ast::ast::ArrayPattern<'a>, out: &mut Vec<Write<'a>>) {
    for element in pattern.elements.iter().flatten() {
        binding_pattern_writes(element, out);
    }
    if let Some(rest) = &pattern.rest {
        binding_pattern_writes(&rest.argument, out);
    }
}
