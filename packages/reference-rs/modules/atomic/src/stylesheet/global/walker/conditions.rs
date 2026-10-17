//! Condition lowering for the global walker: conditional values, condition members, at-rule keys, and child selectors.
//! Each handler rewrites the selector or the wrap stack and hands the children back to `walk_node`.
//! Bare at-rule queries are refused here with a diagnostic instead of printing braceless.

use base_system::{GlobalDeclarationValue, GlobalStyleNode};

use super::GlobalWalker;
use crate::diagnostics::DiagnosticCode;
use crate::resolve::conditions::{is_bare_query_rule, pseudoselectors};

impl<'a> GlobalWalker<'a> {
    /// Lower a conditional value object: `base` prints bare, breakpoint keys
    /// print under the scale query, `_` conditions scope the selector.
    pub(super) fn handle_cond_value(&mut self, selector: &str, prop: &str, children: &GlobalStyleNode) {
        for (sub, val) in children {
            self.handle_cond_member(selector, prop, sub, val);
        }
    }

    pub(super) fn handle_cond_member(
        &mut self,
        selector: &str,
        prop: &str,
        sub: &str,
        val: &GlobalDeclarationValue,
    ) {
        if matches!(val, GlobalDeclarationValue::Null) {
            return;
        }
        if matches!(
            val,
            GlobalDeclarationValue::List(_) | GlobalDeclarationValue::Nested(_)
        ) {
            self.warn_help(
                DiagnosticCode::UnsupportedGlobalValue,
                format!("Unsupported conditional value for \"{prop}.{sub}\" in global CSS"),
                vec![format!("use a single value for '{prop}.{sub}'")],
            );
            return;
        }
        if sub == "base" {
            self.handle_declaration(selector, prop, val);
            return;
        }
        if let Some(query) = self.breakpoint_query(sub) {
            self.wraps.push(query);
            self.handle_declaration(selector, prop, val);
            self.wraps.pop();
            return;
        }
        if sub.starts_with('_') {
            self.handle_cond_condition(selector, prop, sub, val);
            return;
        }
        let help = self.condition_help(sub);
        self.warn_help(
            DiagnosticCode::UnknownCondition,
            format!("Unknown conditional key \"{sub}\" for \"{prop}\" in global CSS"),
            help,
        );
    }

    /// Scope one conditional member through `_` condition lowering.
    pub(super) fn handle_cond_condition(
        &mut self,
        selector: &str,
        prop: &str,
        cond: &str,
        val: &GlobalDeclarationValue,
    ) {
        let mut node = GlobalStyleNode::new();
        node.insert(prop.to_string(), val.clone());
        self.handle_condition(selector, cond, &node);
    }

    pub(super) fn handle_at_rule(&mut self, selector: &str, at_key: &str, children: &GlobalStyleNode) {
        if is_bare_query_rule(at_key) {
            self.warn_help(
                DiagnosticCode::EmptyAtRule,
                format!("Empty at-rule query in global CSS: \"{at_key}\""),
                vec![format!("fill in the query on '{at_key}' or drop the key")],
            );
            return;
        }
        self.wraps.push(at_key.to_string());
        self.walk_node(selector, children);
        self.wraps.pop();
    }

    pub(super) fn handle_condition(&mut self, selector: &str, cond: &str, children: &GlobalStyleNode) {
        if cond == "_dark" {
            let dark_sel = pseudoselectors::apply_distributed("[data-color-mode=dark] &", selector);
            self.walk_node(&dark_sel, children);
            return;
        }
        if cond == "_light" {
            let light_sel =
                pseudoselectors::apply_distributed("[data-color-mode=light] &", selector);
            self.walk_node(&light_sel, children);
            return;
        }
        if let Some(template) = self.system.get_condition(cond) {
            if template.starts_with('@') {
                self.handle_at_rule(selector, template, children);
            } else {
                let scoped = pseudoselectors::apply_distributed(template, selector);
                self.walk_node(&scoped, children);
            }
        } else {
            let help = self.condition_help(cond);
            self.warn_help(
                DiagnosticCode::UnknownCondition,
                format!("Unknown condition in global CSS: \"{cond}\""),
                help,
            );
        }
    }

    pub(super) fn handle_child_selector(&mut self, selector: &str, key: &str, children: &GlobalStyleNode) {
        let child_sel = if key.contains('&') {
            pseudoselectors::apply_distributed(key, selector)
        } else {
            format!("{selector} {key}")
        };
        self.walk_node(&child_sel, children);
    }
}
