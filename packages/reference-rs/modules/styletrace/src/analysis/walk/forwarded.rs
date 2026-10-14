//! Finds the destructured props a component passes on to JSX under their own name. A prop is
//! passed on when an attribute called `name` has a value that reads the prop's local
//! (`size={size}`), or when a spread's object literal carries `name` the same way
//! (`{...{ size }}`). Reflecting it under another name (`data-size={size}`, `w={size}`), in a
//! child or in a condition leaves it the component's own. Takes one attribute and the
//! destructured-local map in `PropBindings`; emits prop names into the walk's `forwarded_props`
//! sink. A value is followed through parentheses, TS wrappers, logical and binary expressions
//! and the branches of a conditional, never a conditional's test.

use oxc_ast::ast::{
    Expression, JSXAttribute, JSXAttributeItem, JSXAttributeName, JSXAttributeValue, JSXExpression,
    ObjectExpression, ObjectProperty, ObjectPropertyKind,
};

use super::WalkContext;

/// A value on its way to an element under one name: the attribute that carries it, or the key a
/// spread's object literal carries it under.
struct Delivery<'a, 'b> {
    name: &'a str,
    ctx: &'a mut WalkContext<'b>,
}

impl Delivery<'_, '_> {
    /// Follows the positions whose value reaches the element: a bare read, both sides of a
    /// logical or binary expression, and the branches of a conditional, through parentheses and
    /// TS wrappers.
    fn read(&mut self, expression: &Expression<'_>) {
        match expression.get_inner_expression() {
            Expression::Identifier(identifier) => self.note_local(identifier.name.as_str()),
            Expression::LogicalExpression(logical) => {
                self.read(&logical.left);
                self.read(&logical.right);
            }
            Expression::BinaryExpression(binary) => {
                self.read(&binary.left);
                self.read(&binary.right);
            }
            Expression::ConditionalExpression(conditional) => {
                self.read(&conditional.consequent);
                self.read(&conditional.alternate);
            }
            _ => {}
        }
    }

    /// Reading a destructured local passes its prop on only under the prop's own name.
    fn note_local(&mut self, local: &str) {
        let Some(prop_name) = self.ctx.bindings.destructured_locals.get(local) else {
            return;
        };
        if prop_name == self.name {
            self.ctx.forwarded_props.insert(prop_name.clone());
        }
    }
}

/// Records the destructured props one attribute passes on under their own name.
pub(super) fn note_forwarded_props(attribute: &JSXAttributeItem<'_>, ctx: &mut WalkContext<'_>) {
    // Most components destructure nothing, so no read can forward anything.
    if ctx.bindings.destructured_locals.is_empty() {
        return;
    }
    match attribute {
        JSXAttributeItem::Attribute(attr) => note_attribute(attr, ctx),
        JSXAttributeItem::SpreadAttribute(spread) => note_spread(&spread.argument, ctx),
    }
}

/// `name={value}`: the value reaches the element under the attribute's name.
fn note_attribute(attribute: &JSXAttribute<'_>, ctx: &mut WalkContext<'_>) {
    let JSXAttributeName::Identifier(name) = &attribute.name else {
        return;
    };
    let Some(JSXAttributeValue::ExpressionContainer(container)) = &attribute.value else {
        return;
    };
    if matches!(container.expression, JSXExpression::EmptyExpression(_)) {
        return;
    }
    let name = name.name.as_str();
    Delivery { name, ctx }.read(container.expression.to_expression());
}

/// A spread names a prop only through an object literal, which may sit behind parentheses, TS
/// wrappers, `&&` or a conditional: `{...{ size }}`, `{...(wide && { wide })}`. A spread of
/// anything else carries keys the walk cannot see.
fn note_spread(argument: &Expression<'_>, ctx: &mut WalkContext<'_>) {
    match argument.get_inner_expression() {
        Expression::ObjectExpression(object) => note_object(object, ctx),
        Expression::LogicalExpression(logical) => {
            note_spread(&logical.left, ctx);
            note_spread(&logical.right, ctx);
        }
        Expression::ConditionalExpression(conditional) => {
            note_spread(&conditional.consequent, ctx);
            note_spread(&conditional.alternate, ctx);
        }
        _ => {}
    }
}

fn note_object(object: &ObjectExpression<'_>, ctx: &mut WalkContext<'_>) {
    for property in &object.properties {
        match property {
            ObjectPropertyKind::ObjectProperty(property) => note_property(property, ctx),
            ObjectPropertyKind::SpreadProperty(spread) => note_spread(&spread.argument, ctx),
        }
    }
}

/// `{ name: value }` and the shorthand `{ name }`: the value reaches the element under the key.
fn note_property(property: &ObjectProperty<'_>, ctx: &mut WalkContext<'_>) {
    let Some(name) = property.key.static_name() else {
        return;
    };
    Delivery { name: &name, ctx }.read(&property.value);
}
