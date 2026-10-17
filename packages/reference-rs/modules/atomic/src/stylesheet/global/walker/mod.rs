//! Recursive AST walker for global CSS style nodes and nested rules.
//! Traverses structured GlobalStyleNode fragments, lowering custom properties, standard CSS properties,
//! dialect macros, condition wrappers, nested selectors, and at-rules.
//! Top-level at-rule keys brace their inner selectors; nested at-rules nest
//! through a wrap stack. Bare `@media` / `@supports` / `@container` keys
//! carry no query and are refused with a diagnostic, never printed braceless.

use base_system::{BaseSystem, GlobalDeclarationValue, GlobalStyleNode};
use canon::is_known_style_prop;
use indexmap::IndexMap;

use crate::diagnostics::{Diagnostic, DiagnosticCode, DiagnosticLocation, Policy};
use crate::resolve::conditions::{breakpoint_media_query, is_bare_query_rule};
use crate::resolve::font::scope;
use crate::resolve::suggest;

mod conditions;
mod declarations;
mod format;

pub use format::format_global_rules;

/// Collected rule blocks: declaration pairs keyed by `(at-rule wraps, selector)`.
pub type RuleBlocks = IndexMap<(Vec<String>, String), Vec<(String, String)>>;

/// Session context for walking global style nodes and collecting formatted CSS rules.
pub struct GlobalWalker<'a> {
    pub system: &'a BaseSystem,
    pub diagnostics: &'a mut Vec<Diagnostic>,
    pub rules: RuleBlocks,
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
                span: None,
            },
            None => DiagnosticLocation::default(),
        }
    }

    /// Warn with the current fragment's location and instance help attached.
    fn warn_help(&mut self, code: DiagnosticCode, message: impl Into<String>, help: Vec<String>) {
        let line = self.location().warning(code, message);
        self.diagnostics.push(Policy::attach_help(line, help));
    }

    /// The instance help for one unknown conditional key: the theme fix
    /// headed by the closest known condition when one sits near enough.
    fn condition_help(&self, name: &str) -> Vec<String> {
        suggest::suggestion_lines(
            suggest::suggest_condition(name, self.system).as_deref(),
            "use a condition from the theme".to_string(),
        )
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
            self.warn_help(
                DiagnosticCode::EmptyAtRule,
                format!("Empty at-rule query in global CSS: \"{at_key}\""),
                vec![format!("fill in the query on '{at_key}' or drop the key")],
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
        // One rule block, one family scope: bare scalar weights resolve
        // against the block's own font; nested and list values stay bare.
        let family = scope::block_family(node);
        for (key, val) in node {
            match val {
                GlobalDeclarationValue::Nested(children) => {
                    self.handle_nested(selector, key, children);
                }
                GlobalDeclarationValue::List(items) => {
                    self.handle_list(selector, key, items);
                }
                _ => {
                    self.handle_scalar(selector, key, val, family);
                }
            }
        }
    }

    /// Lower one scalar declaration, scoping a bare weight to the block font.
    fn handle_scalar(
        &mut self,
        selector: &str,
        key: &str,
        val: &GlobalDeclarationValue,
        family: Option<&str>,
    ) {
        if let Some(scoped) = scope::scope_weight_decl(key, val, family) {
            self.handle_declaration(selector, key, &scoped);
        } else {
            self.handle_declaration(selector, key, val);
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

}
