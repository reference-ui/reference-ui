//! Residue reads over recorded const-object entries (Ph4 residue channel).
//!
//! Entries that kept static leaves beside a dropped dynamic arm carry the
//! residue flag; these scanners find the reads that consume such entries so
//! each use site can diagnose the loss. Helper bodies and defaults scan at
//! attach time into the descriptor flag, computed keys scan at fold time,
//! and member paths answer directly. Reads inside call arguments and fold
//! operands stay unscanned: they consume leaves mid-fold, which needs
//! leaf-level provenance (follow-up), not an entry flag.

use oxc_ast::ast::{Expression, PropertyKey};

use super::element::fold_element_access;
use super::member::{member_path_residue, member_path_text};
use crate::extract::constants::ConstObject;
use crate::extract::scope::Scoped;

/// The first partially static entry read one expression consumes, if any.
///
/// Scans the fenced grammar (identifiers, members, elements, templates,
/// operators, ternaries, objects, arrays, and helper bodies), plus the
/// wrapper forms every fold peels. Anything else holds no entry read.
/// Bare identifiers check their whole captured object: the fence bakes
/// captures whole, so a dirty sibling entry taints the descriptor.
/// Returns the entry path for the diagnostic.
pub fn expr_entry_residue(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<Box<str>> {
    scan_expr(expr, scoped, true)
}

/// True when a function declaration's defaults or body read residue.
/// The attach pass flags the descriptor from this; the fence refused
/// anything this scan cannot see, so no flag ever lands on dead code.
pub fn fn_decl_residue(func: &oxc_ast::ast::Function<'_>, scoped: Scoped<'_>) -> bool {
    function_helper_residue(func, scoped, true).is_some()
}

/// A computed key's partially static entry read, if the key folds from one.
///
/// Member and element keys probe their terminal entry; operators and
/// wrappers recurse to the read; calls answer their bound descriptor
/// (arguments stay unscanned, exactly like value-position calls).
/// Bare identifiers never flag: keys read single leaves, never whole
/// objects, so a dirty sibling entry cannot taint the key. IIFE bodies
/// still bake whole and scan that way. Returns the path.
pub fn key_entry_residue(key: &PropertyKey<'_>, scoped: Scoped<'_>) -> Option<Box<str>> {
    key_direct_residue(key, scoped)
        .or_else(|| key_operand_residue(key, scoped))
        .or_else(|| key_wrapped_residue(key, scoped))
}

/// One expression scan: whole-bake for helper bodies, leaf reads for keys.
fn scan_expr(expr: &Expression<'_>, scoped: Scoped<'_>, bake: bool) -> Option<Box<str>> {
    direct_entry_residue(expr, scoped, bake)
        .or_else(|| composite_entry_residue(expr, scoped, bake))
        .or_else(|| helper_entry_residue(expr, scoped, bake))
        .or_else(|| wrapped_entry_residue(expr, scoped, bake))
}

/// Direct entry reads: identifiers, members, and elements.
fn direct_entry_residue(expr: &Expression<'_>, scoped: Scoped<'_>, bake: bool) -> Option<Box<str>> {
    match expr {
        Expression::Identifier(ident) => {
            if bake {
                ident_entry_residue(ident.name.as_str(), scoped)
            } else {
                None
            }
        }
        Expression::StaticMemberExpression(mem) => {
            member_entry_residue(mem, scoped).or_else(|| scan_expr(&mem.object, scoped, bake))
        }
        Expression::ComputedMemberExpression(mem) => element_entry_residue(mem, scoped)
            .or_else(|| scan_expr(&mem.object, scoped, bake))
            .or_else(|| scan_expr(&mem.expression, scoped, bake)),
        _ => None,
    }
}

/// Composite reads: templates, operators, ternaries, objects, and arrays.
fn composite_entry_residue(
    expr: &Expression<'_>,
    scoped: Scoped<'_>,
    bake: bool,
) -> Option<Box<str>> {
    match expr {
        Expression::TemplateLiteral(lit) => lit
            .expressions
            .iter()
            .find_map(|part| scan_expr(part, scoped, bake)),
        Expression::BinaryExpression(bin) => pair_residue(&bin.left, &bin.right, scoped, bake),
        Expression::UnaryExpression(unary) => scan_expr(&unary.argument, scoped, bake),
        Expression::LogicalExpression(log) => pair_residue(&log.left, &log.right, scoped, bake),
        Expression::ConditionalExpression(cond) => {
            pair_residue(&cond.test, &cond.consequent, scoped, bake)
                .or_else(|| scan_expr(&cond.alternate, scoped, bake))
        }
        Expression::ObjectExpression(obj) => obj.properties.iter().find_map(|prop| {
            let oxc_ast::ast::ObjectPropertyKind::ObjectProperty(prop) = prop else {
                return None;
            };
            scan_expr(&prop.value, scoped, bake).or_else(|| key_entry_residue(&prop.key, scoped))
        }),
        Expression::ArrayExpression(arr) => arr.elements.iter().find_map(|elem| {
            elem.as_expression()
                .and_then(|inner| scan_expr(inner, scoped, bake))
        }),
        _ => None,
    }
}

/// Helper bodies: arrows and function expressions, defaults plus body.
/// Key scans never reach here (a bare helper in key position refuses).
fn helper_entry_residue(expr: &Expression<'_>, scoped: Scoped<'_>, bake: bool) -> Option<Box<str>> {
    if !bake {
        return None;
    }
    match expr {
        Expression::ArrowFunctionExpression(arrow) => arrow_helper_residue(arrow, scoped, bake),
        Expression::FunctionExpression(func) => function_helper_residue(func, scoped, bake),
        _ => None,
    }
}

/// Wrapper reads: parens and the transparent TS casts, or nothing.
fn wrapped_entry_residue(
    expr: &Expression<'_>,
    scoped: Scoped<'_>,
    bake: bool,
) -> Option<Box<str>> {
    match expr {
        Expression::ParenthesizedExpression(paren) => scan_expr(&paren.expression, scoped, bake),
        Expression::TSAsExpression(cast) => scan_expr(&cast.expression, scoped, bake),
        Expression::TSSatisfiesExpression(sat) => scan_expr(&sat.expression, scoped, bake),
        Expression::TSNonNullExpression(non_null) => scan_expr(&non_null.expression, scoped, bake),
        _ => None,
    }
}

/// Direct key reads: members, elements, and calls.
fn key_direct_residue(key: &PropertyKey<'_>, scoped: Scoped<'_>) -> Option<Box<str>> {
    match key {
        PropertyKey::StaticMemberExpression(mem) => {
            member_entry_residue(mem, scoped).or_else(|| scan_expr(&mem.object, scoped, false))
        }
        PropertyKey::ComputedMemberExpression(mem) => element_entry_residue(mem, scoped)
            .or_else(|| scan_expr(&mem.object, scoped, false))
            .or_else(|| scan_expr(&mem.expression, scoped, false)),
        PropertyKey::CallExpression(call) => call_key_residue(call, scoped),
        _ => None,
    }
}

/// Key operand reads: unary and binary key expressions.
fn key_operand_residue(key: &PropertyKey<'_>, scoped: Scoped<'_>) -> Option<Box<str>> {
    match key {
        PropertyKey::UnaryExpression(unary) => scan_expr(&unary.argument, scoped, false),
        PropertyKey::BinaryExpression(bin) => pair_residue(&bin.left, &bin.right, scoped, false),
        _ => None,
    }
}

/// Key wrapper reads: parens and the transparent TS casts, or nothing.
fn key_wrapped_residue(key: &PropertyKey<'_>, scoped: Scoped<'_>) -> Option<Box<str>> {
    match key {
        PropertyKey::ParenthesizedExpression(paren) => scan_expr(&paren.expression, scoped, false),
        PropertyKey::TSAsExpression(cast) => scan_expr(&cast.expression, scoped, false),
        PropertyKey::TSSatisfiesExpression(sat) => scan_expr(&sat.expression, scoped, false),
        PropertyKey::TSNonNullExpression(non_null) => {
            scan_expr(&non_null.expression, scoped, false)
        }
        PropertyKey::TSTypeAssertion(assertion) => scan_expr(&assertion.expression, scoped, false),
        PropertyKey::TSInstantiationExpression(instantiation) => {
            scan_expr(&instantiation.expression, scoped, false)
        }
        _ => None,
    }
}

/// The first residue read across two operand expressions.
fn pair_residue(
    first: &Expression<'_>,
    second: &Expression<'_>,
    scoped: Scoped<'_>,
    bake: bool,
) -> Option<Box<str>> {
    scan_expr(first, scoped, bake).or_else(|| scan_expr(second, scoped, bake))
}

/// A bare identifier's captured object, when it holds dropped arms.
/// Scalars and params carry no entry residue; only whole-object captures do.
fn ident_entry_residue(name: &str, scoped: Scoped<'_>) -> Option<Box<str>> {
    let obj = scoped.object(name)?;
    if object_has_residue(obj) {
        Some(name.into())
    } else {
        None
    }
}

/// A static member read's dotted path, when its terminal entry has residue.
/// Reads through shadowed or unbound roots answer nothing, like the fold.
fn member_entry_residue(
    mem: &oxc_ast::ast::StaticMemberExpression<'_>,
    scoped: Scoped<'_>,
) -> Option<Box<str>> {
    if member_path_residue(mem, scoped) {
        Some(member_path_text(mem).into_boxed_str())
    } else {
        None
    }
}

/// An element read's base path, when a read entry kept leaves past a drop.
fn element_entry_residue(
    mem: &oxc_ast::ast::ComputedMemberExpression<'_>,
    scoped: Scoped<'_>,
) -> Option<Box<str>> {
    let fold = fold_element_access(&mem.object, &mem.expression, scoped);
    if fold.residue {
        Some(super::element::describe_base(&mem.object).into_boxed_str())
    } else {
        None
    }
}

/// A call key's residue: its bound descriptor's flag, or its IIFE body.
/// Arguments stay unscanned, exactly like value-position calls. The IIFE
/// body bakes whole, so it scans that way whatever the outer context.
fn call_key_residue(
    call: &oxc_ast::ast::CallExpression<'_>,
    scoped: Scoped<'_>,
) -> Option<Box<str>> {
    let mut callee = &call.callee;
    while let Some(inner) = crate::extract::expressions::walk::unwrap_wrapper_target(callee) {
        callee = inner;
    }
    match callee {
        Expression::Identifier(ident) => {
            let name = ident.name.as_str();
            if scoped.pure_fn(name).is_some_and(|func| func.residue) {
                Some(format!("{name}(...)").into_boxed_str())
            } else {
                None
            }
        }
        Expression::ArrowFunctionExpression(_) | Expression::FunctionExpression(_) => {
            scan_expr(callee, scoped, true)
        }
        _ => None,
    }
}

/// An arrow helper's defaults plus its single-expression body.
fn arrow_helper_residue(
    arrow: &oxc_ast::ast::ArrowFunctionExpression<'_>,
    scoped: Scoped<'_>,
    bake: bool,
) -> Option<Box<str>> {
    param_defaults_residue(&arrow.params, scoped, bake).or_else(|| {
        let expr = super::fence::body_expression(&arrow.body, arrow.expression)?;
        scan_expr(expr, scoped, bake)
    })
}

/// A function helper's defaults plus its single-expression body.
fn function_helper_residue(
    func: &oxc_ast::ast::Function<'_>,
    scoped: Scoped<'_>,
    bake: bool,
) -> Option<Box<str>> {
    let body = func.body.as_ref()?;
    param_defaults_residue(&func.params, scoped, bake).or_else(|| {
        let expr = super::fence::body_expression(body, false)?;
        scan_expr(expr, scoped, bake)
    })
}

/// The first residue read across one helper's param defaults.
fn param_defaults_residue(
    params: &oxc_ast::ast::FormalParameters<'_>,
    scoped: Scoped<'_>,
    bake: bool,
) -> Option<Box<str>> {
    params.items.iter().find_map(|item| {
        item.initializer
            .as_ref()
            .and_then(|init| scan_expr(init, scoped, bake))
    })
}

/// True when any entry at any depth kept leaves past a drop.
pub(crate) fn object_has_residue(obj: &ConstObject) -> bool {
    obj.values()
        .any(|prop| prop.residue || object_has_residue(&prop.nested))
}
