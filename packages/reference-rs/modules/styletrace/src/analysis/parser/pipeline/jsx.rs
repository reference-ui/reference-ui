//! Walks pipeline JSX elements, fragments and children for style signals and class-name uses.
//! It takes one JSX node at a time, visits attributes before children, and recurses into nested elements.
//! It records on `PipelineContext` when a `className` binding or a style-signal expression reaches a pipeline.
use super::{expr, util, PipelineContext};
use oxc_ast::ast::{
    JSXAttribute, JSXAttributeItem, JSXAttributeName, JSXAttributeValue, JSXChild,
    JSXExpressionContainer,
};

pub fn walk_pipeline_jsx_element(
    element: &oxc_allocator::Box<'_, oxc_ast::ast::JSXElement<'_>>,
    ctx: &mut PipelineContext,
) {
    for attribute in &element.opening_element.attributes {
        walk_jsx_attribute(attribute, ctx);
    }
    for child in &element.children {
        walk_pipeline_jsx_child(child, ctx);
    }
}

fn walk_jsx_attribute(attribute: &JSXAttributeItem<'_>, ctx: &mut PipelineContext) {
    match attribute {
        JSXAttributeItem::Attribute(attr) => walk_named_attribute(attr, ctx),
        JSXAttributeItem::SpreadAttribute(spread) => {
            expr::walk_pipeline_expression(&spread.argument, ctx);
        }
    }
}

fn walk_named_attribute(attr: &JSXAttribute<'_>, ctx: &mut PipelineContext) {
    if is_class_name_attribute(attr) {
        note_class_name_use(attr, ctx);
    }
    if let Some(value) = &attr.value {
        walk_attribute_value(value, ctx);
    }
}

fn is_class_name_attribute(attr: &JSXAttribute<'_>) -> bool {
    matches!(
        &attr.name,
        JSXAttributeName::Identifier(identifier) if identifier.name.as_str() == "className"
    )
}

/// `className={x}` marks the pipeline when `x` reads a class-name binding.
fn note_class_name_use(attr: &JSXAttribute<'_>, ctx: &mut PipelineContext) {
    let Some(JSXAttributeValue::ExpressionContainer(container)) = &attr.value else {
        return;
    };
    if container_has_expression(container)
        && util::expression_uses_class_name_binding(container.expression.to_expression(), ctx.state)
    {
        ctx.state.uses_style_pipeline = true;
    }
}

fn walk_attribute_value(value: &JSXAttributeValue<'_>, ctx: &mut PipelineContext) {
    match value {
        JSXAttributeValue::ExpressionContainer(container) => {
            walk_container_expression(container, ctx)
        }
        JSXAttributeValue::Element(el) => walk_pipeline_jsx_element(el, ctx),
        JSXAttributeValue::Fragment(frag) => walk_pipeline_jsx_fragment(frag, ctx),
        JSXAttributeValue::StringLiteral(_) => {}
    }
}

/// Walks a container's expression unless the container is empty (`{}`).
fn walk_container_expression(container: &JSXExpressionContainer<'_>, ctx: &mut PipelineContext) {
    if container_has_expression(container) {
        expr::walk_pipeline_expression(container.expression.to_expression(), ctx);
    }
}

/// Whether a JSX expression container holds an expression, rather than being empty (`{}`).
fn container_has_expression(container: &JSXExpressionContainer<'_>) -> bool {
    !matches!(
        &container.expression,
        oxc_ast::ast::JSXExpression::EmptyExpression(_)
    )
}

pub fn walk_pipeline_jsx_fragment(
    fragment: &oxc_allocator::Box<'_, oxc_ast::ast::JSXFragment<'_>>,
    ctx: &mut PipelineContext,
) {
    for child in &fragment.children {
        walk_pipeline_jsx_child(child, ctx);
    }
}

pub fn walk_pipeline_jsx_child(child: &JSXChild<'_>, ctx: &mut PipelineContext) {
    match child {
        // Text carries no expression, so there is nothing for the pipeline to read.
        JSXChild::Text(_) => {}
        JSXChild::Element(element) => walk_pipeline_jsx_element(element, ctx),
        JSXChild::Fragment(fragment) => walk_pipeline_jsx_fragment(fragment, ctx),
        JSXChild::ExpressionContainer(container) => walk_container_expression(container, ctx),
        JSXChild::Spread(spread) => expr::walk_pipeline_expression(&spread.expression, ctx),
    }
}
