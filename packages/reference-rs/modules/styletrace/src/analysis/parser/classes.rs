//! Spots React class components so the trace can warn that their style props are not traced.
//! A class counts when it extends `Component` or `PureComponent` from react and its first type argument exposes StyleProps.
//! Classes are never traced or named in v1: this file only records the class name, and the analyzer turns each recorded name into a warning.

use oxc_ast::ast::{Class, Expression};
use rustc_hash::FxHashMap;

use super::context::ParserContext;
use super::types::wrapper_props_from_type_arguments;
use crate::analysis::model::TraceImport;
use crate::resolver::StyleTraceError;

const REACT_COMPONENT_BASES: [&str; 2] = ["Component", "PureComponent"];

/// Record a declared class under its own name, or `default` when it is anonymous.
pub(super) fn note_class(
    class: &Class<'_>,
    ctx: &ParserContext,
    classes: &mut Vec<String>,
) -> Result<(), StyleTraceError> {
    let name = class.id.as_ref().map_or("default", |id| id.name.as_str());
    note_named_class(name, class, ctx, classes)
}

/// Record a class under `name` when it is a React class component whose props expose StyleProps.
pub(super) fn note_named_class(
    name: &str,
    class: &Class<'_>,
    ctx: &ParserContext,
    classes: &mut Vec<String>,
) -> Result<(), StyleTraceError> {
    if class_exposes_style_props(class, ctx)? {
        classes.push(name.to_string());
    }
    Ok(())
}

/// The class extends react's `Component` or `PureComponent`, and its first type argument (the props)
/// resolves to at least one StyleProps name.
fn class_exposes_style_props(class: &Class<'_>, ctx: &ParserContext) -> Result<bool, StyleTraceError> {
    let Some(base) = class.super_class.as_ref() else {
        return Ok(false);
    };
    if !is_react_component_base(base, ctx.imports) {
        return Ok(false);
    }
    let props = class
        .super_type_arguments
        .as_ref()
        .and_then(|arguments| arguments.params.iter().next());
    let wrapper = wrapper_props_from_type_arguments(ctx, props)?;
    Ok(!wrapper.style_props.is_empty())
}

/// `Component` or `PureComponent` imported from react, or the same name on a react namespace import.
fn is_react_component_base(base: &Expression<'_>, imports: &FxHashMap<String, TraceImport>) -> bool {
    match base {
        Expression::Identifier(identifier) => imports
            .get(identifier.name.as_str())
            .is_some_and(|import| {
                import.source == "react" && is_component_base(&import.imported_name)
            }),
        Expression::StaticMemberExpression(member) => {
            let Expression::Identifier(namespace) = &member.object else {
                return false;
            };
            is_component_base(member.property.name.as_str())
                && imports
                    .get(namespace.name.as_str())
                    .is_some_and(|import| import.source == "react" && import.is_namespace)
        }
        _ => false,
    }
}

fn is_component_base(name: &str) -> bool {
    REACT_COMPONENT_BASES.contains(&name)
}
