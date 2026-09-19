//! Recursive AST walker for global CSS style nodes and nested rules.
//! Traverses structured GlobalStyleNode fragments, lowering custom properties, standard CSS properties,
//! dialect macros, condition wrappers, nested selectors, and at-rules.
//! Top-level at-rule keys brace their inner selectors; nested at-rules nest
//! through a wrap stack. Bare `@media` / `@supports` / `@container` keys
//! carry no query and are refused with a diagnostic, never printed braceless.

use base_system::{BaseSystem, GlobalDeclarationValue, GlobalStyleNode};
use canon::is_known_style_prop;
use indexmap::IndexMap;

use super::value::{lower_declaration, ValueSession};
use crate::diagnostics::{Diagnostic, DiagnosticCode, DiagnosticLocation};
use crate::resolve::conditions::{breakpoint_media_query, is_bare_query_rule, pseudoselectors};

struct ListItemContext<'a> {
    selector: &'a str,
    key: &'a str,
}

/// Session context for walking global style nodes and collecting formatted CSS rules.
pub struct GlobalWalker<'a> {
    pub system: &'a BaseSystem,
    pub diagnostics: &'a mut Vec<Diagnostic>,
    pub rules: IndexMap<(Vec<String>, String), Vec<(String, String)>>,
    wraps: Vec<String>,
    source: Option<String>,
}

impl<'a> GlobalWalker<'a> {
    pub fn new(system: &'a BaseSystem, diagnostics: &'a mut Vec<Diagnostic>) -> Self {
        Self {
            system,
            diagnostics,
            rules: IndexMap::new(),
            wraps: Vec::new(),
            source: None,
        }
    }

    /// Location for system-surface diagnostics: the fragment's source file at
    /// 1:1. Fragments carry no spans (deserialized JSON), so the file origin
    /// is the honest position.
    fn location(&self) -> DiagnosticLocation {
        match &self.source {
            Some(source) => DiagnosticLocation {
                file: Some(source.clone()),
                line: Some(1),
                column: Some(1),
            },
            None => DiagnosticLocation::default(),
        }
    }

    /// Warn with the current fragment's location attached.
    fn warn(&mut self, code: DiagnosticCode, message: impl Into<String>) {
        let diagnostic = self.location().warning(code, message);
        self.diagnostics.push(diagnostic);
    }

    pub fn walk_rules(&mut self, source: &str, rules: &IndexMap<String, GlobalStyleNode>) {
        self.source = Some(source.to_string());
        for (selector, node) in rules {
            if selector.starts_with('@') {
                self.walk_top_at_rule(selector, node);
            } else {
                self.walk_node(selector, node);
            }
        }
    }

    /// Walk one top-level at-rule block: inner selector pairs brace beneath
    /// it, deeper at-rules recurse, scalar leaves keep selector-position text.
    fn walk_top_at_rule(&mut self, at_key: &str, node: &GlobalStyleNode) {
        // '@media (min-width: 640px)': { body: {...} }
        if is_bare_query_rule(at_key) {
            self.warn(
                DiagnosticCode::EmptyAtRule,
                format!("Empty at-rule query in global CSS: \"{at_key}\""),
            );
            return;
        }
        for (key, val) in node {
            match val {
                GlobalDeclarationValue::Nested(children) => {
                    self.walk_top_at_entry(at_key, key, children);
                }
                _ => {
                    self.handle_declaration(at_key, key, val);
                }
            }
        }
    }

    fn walk_top_at_entry(&mut self, at_key: &str, key: &str, children: &GlobalStyleNode) {
        self.wraps.push(at_key.to_string());
        if key.starts_with('@') {
            self.walk_top_at_rule(key, children);
        } else {
            self.walk_node(key, children);
        }
        self.wraps.pop();
    }

    pub fn walk_node(&mut self, selector: &str, node: &GlobalStyleNode) {
        for (key, val) in node {
            match val {
                GlobalDeclarationValue::Nested(children) => {
                    self.handle_nested(selector, key, children);
                }
                GlobalDeclarationValue::List(items) => {
                    self.handle_list(selector, key, items);
                }
                _ => {
                    self.handle_declaration(selector, key, val);
                }
            }
        }
    }

    fn handle_nested(&mut self, selector: &str, key: &str, children: &GlobalStyleNode) {
        if key.starts_with('@') {
            self.handle_at_rule(selector, key, children);
        } else if key.starts_with('_') {
            self.handle_condition(selector, key, children);
        } else if key == "base" {
            self.walk_node(selector, children);
        } else if let Some(query) = self.breakpoint_query(key) {
            self.handle_breakpoint_query(selector, query, children);
        } else if is_known_style_prop(key) {
            self.handle_cond_value(selector, key, children);
        } else {
            self.handle_child_selector(selector, key, children);
        }
    }

    /// Lower a breakpoint key block beneath the scale's `@media` query.
    fn handle_breakpoint_query(
        &mut self,
        selector: &str,
        query: String,
        children: &GlobalStyleNode,
    ) {
        self.wraps.push(query);
        self.walk_node(selector, children);
        self.wraps.pop();
    }

    /// `@media` query for a breakpoint scale name or `*Down` / `*Only` /
    /// `*To*` range, sharing bounds with the utility `@container` twins.
    fn breakpoint_query(&self, bp: &str) -> Option<String> {
        breakpoint_media_query(bp, self.system)
    }

    /// Lower a conditional value object: `base` prints bare, breakpoint keys
    /// print under the scale query, `_` conditions scope the selector.
    fn handle_cond_value(&mut self, selector: &str, prop: &str, children: &GlobalStyleNode) {
        for (sub, val) in children {
            self.handle_cond_member(selector, prop, sub, val);
        }
    }

    fn handle_cond_member(
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
            self.warn(
                DiagnosticCode::UnsupportedGlobalValue,
                format!("Unsupported conditional value for \"{prop}.{sub}\" in global CSS"),
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
        self.warn(
            DiagnosticCode::UnknownCondition,
            format!("Unknown conditional key \"{sub}\" for \"{prop}\" in global CSS"),
        );
    }

    /// Scope one conditional member through `_` condition lowering.
    fn handle_cond_condition(
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

    fn handle_at_rule(&mut self, selector: &str, at_key: &str, children: &GlobalStyleNode) {
        if is_bare_query_rule(at_key) {
            self.warn(
                DiagnosticCode::EmptyAtRule,
                format!("Empty at-rule query in global CSS: \"{at_key}\""),
            );
            return;
        }
        self.wraps.push(at_key.to_string());
        self.walk_node(selector, children);
        self.wraps.pop();
    }

    fn handle_condition(&mut self, selector: &str, cond: &str, children: &GlobalStyleNode) {
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
            self.warn(
                DiagnosticCode::UnknownCondition,
                format!("Unknown condition in global CSS: \"{cond}\""),
            );
        }
    }

    fn handle_child_selector(&mut self, selector: &str, key: &str, children: &GlobalStyleNode) {
        let child_sel = if key.contains('&') {
            pseudoselectors::apply_distributed(key, selector)
        } else {
            format!("{selector} {key}")
        };
        self.walk_node(&child_sel, children);
    }

    fn handle_list(&mut self, selector: &str, key: &str, items: &[GlobalDeclarationValue]) {
        let ctx = ListItemContext { selector, key };
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
            self.handle_declaration(ctx.selector, ctx.key, item);
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
        self.wraps.push(media_query);
        self.handle_declaration(ctx.selector, ctx.key, item);
        self.wraps.pop();
    }

    fn handle_declaration(&mut self, selector: &str, key: &str, val: &GlobalDeclarationValue) {
        let location = self.location();
        let mut session = ValueSession {
            system: self.system,
            diagnostics: self.diagnostics,
            location,
        };
        let decls = lower_declaration(key, val, &mut session);
        if decls.is_empty() {
            return;
        }
        let entry = self
            .rules
            .entry((self.wraps.clone(), selector.to_string()))
            .or_default();
        entry.extend(decls);
    }
}

/// Format collected global rules into indented CSS blocks.
pub fn format_global_rules(
    rules: &IndexMap<(Vec<String>, String), Vec<(String, String)>>,
    out: &mut String,
) {
    for ((wraps, selector), decls) in rules {
        if decls.is_empty() {
            continue;
        }
        for (depth, query) in wraps.iter().enumerate() {
            push_indent(out, depth + 1);
            out.push_str(query);
            out.push_str(" {\n");
        }
        push_indent(out, wraps.len() + 1);
        out.push_str(selector);
        out.push_str(" { ");
        write_decls(out, decls);
        out.push_str(" }\n");
        for depth in (0..wraps.len()).rev() {
            push_indent(out, depth + 1);
            out.push_str("}\n");
        }
    }
}

fn push_indent(out: &mut String, depth: usize) {
    for _ in 0..depth {
        out.push_str("  ");
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
