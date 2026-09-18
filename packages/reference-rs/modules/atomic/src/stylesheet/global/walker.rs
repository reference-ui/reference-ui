//! Recursive AST walker for global CSS style nodes and nested rules.
//! Traverses structured GlobalStyleNode fragments, lowering custom properties, standard CSS properties,
//! dialect macros, condition wrappers, nested selectors, and at-rules.
//! Preserves author selector nesting, responsive array breakpoints, and deterministic emission order.

use base_system::{BaseSystem, GlobalDeclarationValue, GlobalStyleNode};
use indexmap::IndexMap;

use super::value::{lower_declaration, ValueSession};
use crate::diagnostics::Diagnostic;
use crate::resolve::conditions::pseudoselectors;

struct ListItemContext<'a> {
    selector: &'a str,
    key: &'a str,
    at_rule: Option<&'a str>,
}

/// Session context for walking global style nodes and collecting formatted CSS rules.
pub struct GlobalWalker<'a> {
    pub system: &'a BaseSystem,
    pub diagnostics: &'a mut Vec<Diagnostic>,
    pub rules: IndexMap<(Option<String>, String), Vec<(String, String)>>,
}

impl<'a> GlobalWalker<'a> {
    pub fn new(system: &'a BaseSystem, diagnostics: &'a mut Vec<Diagnostic>) -> Self {
        Self {
            system,
            diagnostics,
            rules: IndexMap::new(),
        }
    }

    pub fn walk_rules(&mut self, rules: &IndexMap<String, GlobalStyleNode>) {
        for (selector, node) in rules {
            self.walk_node(selector, node, None);
        }
    }

    pub fn walk_node(&mut self, selector: &str, node: &GlobalStyleNode, at_rule: Option<&str>) {
        for (key, val) in node {
            match val {
                GlobalDeclarationValue::Nested(children) => {
                    self.handle_nested(selector, key, children, at_rule);
                }
                GlobalDeclarationValue::List(items) => {
                    self.handle_list(selector, key, items, at_rule);
                }
                _ => {
                    self.handle_declaration(selector, key, val, at_rule);
                }
            }
        }
    }

    fn handle_nested(
        &mut self,
        selector: &str,
        key: &str,
        children: &GlobalStyleNode,
        at_rule: Option<&str>,
    ) {
        if key.starts_with('@') {
            self.handle_at_rule(selector, key, children, at_rule);
        } else if key.starts_with('_') {
            self.handle_condition(selector, key, children, at_rule);
        } else {
            self.handle_child_selector(selector, key, children, at_rule);
        }
    }

    fn handle_at_rule(
        &mut self,
        selector: &str,
        at_key: &str,
        children: &GlobalStyleNode,
        parent_at_rule: Option<&str>,
    ) {
        let combined = match parent_at_rule {
            Some(parent) => format!("{parent} and {at_key}"),
            None => at_key.to_string(),
        };
        self.walk_node(selector, children, Some(&combined));
    }

    fn handle_condition(
        &mut self,
        selector: &str,
        cond: &str,
        children: &GlobalStyleNode,
        at_rule: Option<&str>,
    ) {
        if cond == "_dark" {
            let dark_sel = pseudoselectors::apply("[data-color-mode=dark] &", selector);
            self.walk_node(&dark_sel, children, at_rule);
            return;
        }
        if cond == "_light" {
            let light_sel = pseudoselectors::apply("[data-color-mode=light] &", selector);
            self.walk_node(&light_sel, children, at_rule);
            return;
        }
        if let Some(template) = self.system.get_condition(cond) {
            if template.starts_with('@') {
                self.handle_at_rule(selector, template, children, at_rule);
            } else {
                let scoped = pseudoselectors::apply(template, selector);
                self.walk_node(&scoped, children, at_rule);
            }
        } else {
            self.diagnostics.push(Diagnostic::warning(format!(
                "Unknown condition in global CSS: \"{cond}\""
            )));
        }
    }

    fn handle_child_selector(
        &mut self,
        selector: &str,
        key: &str,
        children: &GlobalStyleNode,
        at_rule: Option<&str>,
    ) {
        let child_sel = if key.contains('&') {
            pseudoselectors::apply(key, selector)
        } else {
            format!("{selector} {key}")
        };
        self.walk_node(&child_sel, children, at_rule);
    }

    fn handle_list(
        &mut self,
        selector: &str,
        key: &str,
        items: &[GlobalDeclarationValue],
        at_rule: Option<&str>,
    ) {
        let ctx = ListItemContext {
            selector,
            key,
            at_rule,
        };
        for (idx, item) in items.iter().enumerate() {
            self.handle_list_item(&ctx, idx, item);
        }
    }

    fn handle_list_item(
        &mut self,
        ctx: &ListItemContext<'_>,
        idx: usize,
        item: &GlobalDeclarationValue,
    ) {
        if matches!(item, GlobalDeclarationValue::Null) {
            return;
        }
        if idx == 0 {
            self.handle_declaration(ctx.selector, ctx.key, item, ctx.at_rule);
            return;
        }
        let scale = self.system.breakpoints();
        let Some(bp_name) = scale.breakpoint_for_index(idx) else {
            return;
        };
        let Some(width) = scale.width_px(bp_name) else {
            return;
        };
        let media_query = format!("@media (min-width: {width}px)");
        self.handle_declaration(ctx.selector, ctx.key, item, Some(&media_query));
    }

    fn handle_declaration(
        &mut self,
        selector: &str,
        key: &str,
        val: &GlobalDeclarationValue,
        at_rule: Option<&str>,
    ) {
        let mut session = ValueSession {
            system: self.system,
            diagnostics: self.diagnostics,
        };
        let decls = lower_declaration(key, val, &mut session);
        if decls.is_empty() {
            return;
        }
        let entry = self
            .rules
            .entry((at_rule.map(str::to_string), selector.to_string()))
            .or_default();
        entry.extend(decls);
    }
}

/// Format collected global rules into indented CSS blocks.
pub fn format_global_rules(
    rules: &IndexMap<(Option<String>, String), Vec<(String, String)>>,
    out: &mut String,
) {
    for ((at_rule, selector), decls) in rules {
        if decls.is_empty() {
            continue;
        }
        if let Some(query) = at_rule {
            out.push_str("  ");
            out.push_str(query);
            out.push_str(" {\n    ");
            out.push_str(selector);
            out.push_str(" { ");
            write_decls(out, decls);
            out.push_str(" }\n  }\n");
        } else {
            out.push_str("  ");
            out.push_str(selector);
            out.push_str(" { ");
            write_decls(out, decls);
            out.push_str(" }\n");
        }
    }
}

fn write_decls(out: &mut String, decls: &[(String, String)]) {
    for (i, (prop, val)) in decls.iter().enumerate() {
        if i > 0 {
            out.push_str("; ");
        }
        out.push_str(prop);
        out.push_str(": ");
        out.push_str(val);
    }
}
