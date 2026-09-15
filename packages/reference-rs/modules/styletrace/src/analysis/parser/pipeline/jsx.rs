//! Walk pipeline jsx.
use super::{expr, util, PipelineContext};

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

fn walk_jsx_attribute(attribute: &oxc_ast::ast::JSXAttributeItem<'_>, ctx: &mut PipelineContext) {
    match attribute {
        oxc_ast::ast::JSXAttributeItem::Attribute(attr) => {
            let is_class_name = matches!(
                &attr.name,
                oxc_ast::ast::JSXAttributeName::Identifier(identifier) if identifier.name.as_str() == "className"
            );

            if is_class_name {
                if let Some(oxc_ast::ast::JSXAttributeValue::ExpressionContainer(container)) =
                    &attr.value
                {
                    if !matches!(
                        &container.expression,
                        oxc_ast::ast::JSXExpression::EmptyExpression(_)
                    ) && util::expression_uses_class_name_binding(
                        container.expression.to_expression(),
                        ctx.state,
                    ) {
                        ctx.state.uses_style_pipeline = true;
                    }
                }
            }

            if let Some(value) = &attr.value {
                match value {
                    oxc_ast::ast::JSXAttributeValue::ExpressionContainer(container) => {
                        if !matches!(
                            &container.expression,
                            oxc_ast::ast::JSXExpression::EmptyExpression(_)
                        ) {
                            expr::walk_pipeline_expression(
                                container.expression.to_expression(),
                                ctx,
                            );
                        }
                    }
                    oxc_ast::ast::JSXAttributeValue::Element(el) => {
                        walk_pipeline_jsx_element(el, ctx)
                    }
                    oxc_ast::ast::JSXAttributeValue::Fragment(frag) => {
                        walk_pipeline_jsx_fragment(frag, ctx)
                    }
                    oxc_ast::ast::JSXAttributeValue::StringLiteral(_) => {}
                }
            }
        }
        oxc_ast::ast::JSXAttributeItem::SpreadAttribute(spread) => {
            expr::walk_pipeline_expression(&spread.argument, ctx);
        }
    }
}

pub fn walk_pipeline_jsx_fragment(
    fragment: &oxc_allocator::Box<'_, oxc_ast::ast::JSXFragment<'_>>,
    ctx: &mut PipelineContext,
) {
    for child in &fragment.children {
        walk_pipeline_jsx_child(child, ctx);
    }
}

pub fn walk_pipeline_jsx_child(child: &oxc_ast::ast::JSXChild<'_>, ctx: &mut PipelineContext) {
    match child {
        oxc_ast::ast::JSXChild::Element(element) => walk_pipeline_jsx_element(element, ctx),
        oxc_ast::ast::JSXChild::Fragment(fragment) => walk_pipeline_jsx_fragment(fragment, ctx),
        oxc_ast::ast::JSXChild::ExpressionContainer(container) => {
            if !matches!(
                &container.expression,
                oxc_ast::ast::JSXExpression::EmptyExpression(_)
            ) {
                expr::walk_pipeline_expression(container.expression.to_expression(), ctx);
            }
        }
        oxc_ast::ast::JSXChild::Spread(spread) => {
            expr::walk_pipeline_expression(&spread.expression, ctx)
        }
        oxc_ast::ast::JSXChild::Text(_) => {}
    }
}
