//! The slot-key check of a slotted `recipe()`.
//! Every slot map is an inline object naming only listed slots, and every `variants` map and compound
//! entry is written inline. It takes the definition's listed slots and its fields and emits
//! `ATM-E-RECIPE-SLOT` for a slot map that breaks the rules, or `ATM-E-RECIPE-FIELD` for a map or
//! compound the walk cannot read, one refusal where each stands. `defaultVariants` and each compound
//! predicate are shared by every slot, so the check reads them once, with the walker's own reads, and
//! their refusals land once too. The walk never runs for a definition this check refuses, so no slot
//! repeats a refusal.

use oxc_ast::ast::{ArrayExpressionElement, Expression, ObjectProperty, ObjectPropertyKind};
use oxc_span::{GetSpan, Span};

use super::compounds::read_predicate;
use super::slots::push_refusal;
use super::walk::{
    field_refusal, handle_recipe_defaults, inline_hint, static_key, unwrap_expression,
    RecipeDraft, RecipeSite, RecipeWalk,
};
use crate::extract::ExtractContext;

/// The slot-key walk: which slots are listed, where refusals go, and whether any fired.
pub(super) struct SlotKeyCheck<'a, 'b> {
    pub(super) class_name: &'a str,
    pub(super) slots: &'a [String],
    pub(super) ctx: &'a mut ExtractContext<'b>,
    pub(super) clean: bool,
}

impl SlotKeyCheck<'_, '_> {
    /// Route one recipe-object field to the slot-keyed value it carries, if any.
    pub(super) fn field(&mut self, prop: &ObjectProperty<'_>) {
        match static_key(&prop.key).as_deref() {
            Some("base") => self.map(&prop.value),
            Some("variants") => self.variants(&prop.value),
            Some("defaultVariants") => {
                self.walked(|walk| handle_recipe_defaults(walk, &prop.value));
            }
            Some("compoundVariants") => self.compounds(&prop.value),
            _ => {}
        }
    }

    /// Run one walker read over this definition. The walker's own rules decide what refuses, its
    /// refusals land in this check's diagnostics, and the check is unclean when the read refused.
    fn walked(&mut self, read: impl FnOnce(&mut RecipeWalk<'_, '_>)) {
        let mut walk = RecipeWalk {
            // The reads here lower no style, so no origin or slot is ever consulted.
            site: RecipeSite {
                class_name: self.class_name,
                origin: "",
                slot: None,
            },
            ctx: &mut *self.ctx,
            draft: RecipeDraft::default(),
            refused: false,
        };
        read(&mut walk);
        if walk.refused {
            self.clean = false;
        }
    }

    /// `variants` is written inline: an object of axes, each an inline object of slot maps.
    fn variants(&mut self, value: &Expression<'_>) {
        let Expression::ObjectExpression(axes) = unwrap_expression(value) else {
            let message = self.slotted_message("variants");
            self.refuse_field(value.span(), message, inline_hint("variants"));
            return;
        };
        for kind in &axes.properties {
            match kind {
                ObjectPropertyKind::SpreadProperty(spread) => {
                    self.refuse_spread("variants", spread.argument.span());
                }
                ObjectPropertyKind::ObjectProperty(axis) => self.axis(axis),
            }
        }
    }

    /// One axis of `variants`: an inline object whose values are inline slot maps.
    fn axis(&mut self, axis: &ObjectProperty<'_>) {
        let Some(name) = static_key(&axis.key) else {
            self.refuse_computed("variants", axis.key.span());
            return;
        };
        let field = format!("variants.{name}");
        let Expression::ObjectExpression(options) = unwrap_expression(&axis.value) else {
            let message = self.slotted_message(&field);
            self.refuse_field(axis.value.span(), message, inline_hint(&field));
            return;
        };
        for kind in &options.properties {
            match kind {
                ObjectPropertyKind::SpreadProperty(spread) => {
                    self.refuse_spread(&field, spread.argument.span());
                }
                ObjectPropertyKind::ObjectProperty(option) => {
                    if static_key(&option.key).is_none() {
                        self.refuse_computed(&field, option.key.span());
                    }
                    self.map(&option.value);
                }
            }
        }
    }

    /// `compoundVariants` is an inline array of inline compound entries.
    fn compounds(&mut self, value: &Expression<'_>) {
        let Expression::ArrayExpression(list) = unwrap_expression(value) else {
            let message = format!(
                "recipe '{}': 'compoundVariants' must be an inline array literal in a slotted recipe",
                self.class_name
            );
            self.refuse_field(
                value.span(),
                message,
                "write compoundVariants inline as an array literal".to_string(),
            );
            return;
        };
        for (index, element) in list.elements.iter().enumerate() {
            self.compound(index, element);
        }
    }

    /// One compound entry: an inline object whose members are predicates and one `css` slot map.
    fn compound(&mut self, index: usize, element: &ArrayExpressionElement<'_>) {
        let field = format!("compoundVariants[{index}]");
        let Some(Expression::ObjectExpression(entry)) =
            element.as_expression().map(unwrap_expression)
        else {
            let message = format!(
                "recipe '{}': '{field}' must be an inline object literal",
                self.class_name
            );
            self.refuse_field(element.span(), message, inline_hint(&field));
            return;
        };
        for kind in &entry.properties {
            self.compound_member(&field, kind);
        }
    }

    /// One member of a compound entry: a spread refuses the entry, a computed key refuses the
    /// member, and `css` is a slot map.
    fn compound_member(&mut self, field: &str, kind: &ObjectPropertyKind<'_>) {
        let prop = match kind {
            ObjectPropertyKind::SpreadProperty(spread) => {
                let message = format!(
                    "recipe '{}': '{field}' spreads a value; write its predicates and css inline",
                    self.class_name
                );
                self.refuse_field(spread.span, message, inline_hint(field));
                return;
            }
            ObjectPropertyKind::ObjectProperty(prop) => prop,
        };
        let Some(key) = static_key(&prop.key) else {
            self.refuse_computed(field, prop.key.span());
            return;
        };
        if key == "css" {
            self.map(&prop.value);
        } else {
            self.walked(|walk| {
                read_predicate(walk, field, &key, &prop.value);
            });
        }
    }

    /// One slot map: an inline object whose keys are all listed slots. Any other value is refused
    /// here, so a slot's CSS never disappears without a diagnostic.
    fn map(&mut self, value: &Expression<'_>) {
        let target = unwrap_expression(value);
        let Expression::ObjectExpression(map) = target else {
            self.refuse_not_object(target.span());
            return;
        };
        for kind in &map.properties {
            match kind {
                ObjectPropertyKind::SpreadProperty(spread) => self.refuse_shape(spread.span),
                ObjectPropertyKind::ObjectProperty(prop) => self.key(prop),
            }
        }
    }

    fn key(&mut self, prop: &ObjectProperty<'_>) {
        let Some(slot) = static_key(&prop.key) else {
            self.refuse_shape(prop.key.span());
            return;
        };
        if self.slots.contains(&slot) {
            return;
        }
        let message = format!(
            "recipe '{}' styles unknown slot '{}'; its slots are: {}",
            self.class_name,
            slot,
            self.slots.join(", ")
        );
        self.refuse(&message, prop.key.span());
    }

    fn refuse_not_object(&mut self, span: Span) {
        let message = format!(
            "recipe '{}': a slot map must be an inline object keyed by slot name",
            self.class_name
        );
        self.refuse(&message, span);
    }

    fn refuse_shape(&mut self, span: Span) {
        let message = format!(
            "recipe '{}': a slot map takes slot names as plain keys, not spreads or computed keys",
            self.class_name
        );
        self.refuse(&message, span);
    }

    /// A variant map that a slotted recipe must write inline.
    fn slotted_message(&self, field: &str) -> String {
        format!(
            "recipe '{}': '{field}' must be an inline object literal in a slotted recipe",
            self.class_name
        )
    }

    fn refuse_spread(&mut self, field: &str, span: Span) {
        let message = format!(
            "recipe '{}': '{field}' spreads a value; a slotted recipe writes each variant inline",
            self.class_name
        );
        self.refuse_field(span, message, inline_hint(field));
    }

    fn refuse_computed(&mut self, field: &str, span: Span) {
        let message = format!(
            "recipe '{}': '{field}' has a computed key; name each entry with a plain key",
            self.class_name
        );
        self.refuse_field(
            span,
            message,
            format!("name each entry of {field} with a plain key"),
        );
    }

    /// Push one `ATM-E-RECIPE-FIELD` refusal, carrying its fix hint.
    fn refuse_field(&mut self, span: Span, message: String, help: String) {
        let diagnostic = field_refusal(self.ctx, span, message, help);
        self.ctx.diagnostics.push(diagnostic);
        self.clean = false;
    }

    fn refuse(&mut self, message: &str, span: Span) {
        push_refusal(self.ctx, message, span);
        self.clean = false;
    }
}
