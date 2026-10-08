//! Style object property traversal and condition nesting.
//!
//! Handles recursive traversal of JavaScript object literals inside `css({...})` and JSX props.
//! Dispatches condition keys into nested scopes, asks `resolve/r` for `r` prop queries, and
//! creates dedicated `ExpressionWalk` contexts for each style property.

pub(crate) mod attrs;
pub(crate) mod block;
pub(crate) mod condition;
pub(crate) mod entries;
pub(crate) mod keys;
pub(crate) mod lower;
pub(crate) mod spread;

pub use block::{resolve_block_target, BlockLookup};
pub(crate) use condition::is_condition_key;
pub(crate) use keys::{resolve_property_key, resolve_r_key, warn_key_residue};
pub use lower::{lower_array_object, lower_const_object};
pub use spread::walk_spread_argument;

use oxc_ast::ast::{Expression, ObjectExpression, ObjectProperty, ObjectPropertyKind};
use oxc_span::{GetSpan, Span};
use smallvec::SmallVec;

use super::walk::{walk_expression, ExpressionWalk};
use crate::diagnostics::adapters::extract::{extract_note, extract_note_with_help};
use crate::diagnostics::{
    byte_span, line_col, Diagnostic, DiagnosticCode, DiagnosticLocation, DiagnosticSeverity,
    DiagnosticSink, DiagnosticsSession, LineIndex, Policy,
};
use crate::extract::harvest::Sink;
use crate::extract::scope::Scoped;
use crate::extract::suggest;
use base_system::BreakpointScale;
use canon::is_known_style_prop;

/// What a walked object's keys mean: style positions or JSX attributes.
///
/// A `css()` object names style positions, so an unknown key is nonsense CSS
/// and warns. A spread bag on a JSX host names attributes, so `css` and `r`
/// recurse like their attribute spellings, style and condition keys extract,
/// and every other key — `style`, `data-*`, handlers — is the host's
/// business and stays silent (§12).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BagSemantics {
    /// A style object: unknown keys warn `UnknownProperty`.
    StyleObject,
    /// A JSX spread bag: `css`/`r` recurse, the rest is silent.
    JsxAttributes,
}

/// Context for traversing a style object literal to extract property wants.
pub struct ObjectWalk<'a> {
    pub origin: Option<&'a str>,
    pub important: bool,
    pub file: &'a str,
    pub source: Option<&'a str>,
    pub line_index: Option<&'a LineIndex>,
    pub scopes: Scoped<'a>,
    pub breakpoints: &'a BreakpointScale,
    pub wants: &'a mut Vec<crate::atom::Want>,
    pub diagnostics: &'a mut Vec<Diagnostic>,
    pub authored: Option<&'a mut Vec<crate::runtime::AuthoredDeclaration>>,
    pub bag: BagSemantics,
    pub sinks: &'a mut Vec<Sink>,
    /// Lent to child expression walks for fact reporting; object-level
    /// warns stay direct until Slice 5 moves the compiler block as one.
    pub session: &'a mut DiagnosticsSession,
}

impl<'a> ObjectWalk<'a> {
    /// Create a child ExpressionWalk context for a specific property.
    pub fn expression_walk<'b>(&'b mut self, prop: &'b str) -> ExpressionWalk<'b> {
        ExpressionWalk {
            prop,
            origin: self.origin,
            important: self.important,
            file: self.file,
            source: self.source,
            line_index: self.line_index,
            scopes: self.scopes,
            breakpoints: self.breakpoints,
            wants: self.wants,
            diagnostics: self.diagnostics,
            sinks: self.sinks,
            session: self.session,
        }
    }

    /// Report a diagnostic warning at the offending node's span.
    pub fn warn(&mut self, span: Span, code: DiagnosticCode, message: impl Into<String>) {
        let message: String = message.into();
        let (line, column) = self.span_position(Some(span)).unzip();
        let location = DiagnosticLocation {
            file: Some(self.file.to_string()),
            line,
            column,
            span: Some(byte_span(span)),
        };
        self.diagnostics
            .push(location.warning(code, message.clone()));
        self.session
            .report(extract_note(location, DiagnosticSeverity::Warning, code, message));
    }

    /// Report a warning with instance help at the offending node's span.
    /// The help rides the pushed line and the session fact alike, so the
    /// compiler re-render re-attaches it.
    pub fn warn_help(
        &mut self,
        span: Span,
        code: DiagnosticCode,
        message: impl Into<String>,
        help: Vec<String>,
    ) {
        let message: String = message.into();
        let (line, column) = self.span_position(Some(span)).unzip();
        let location = DiagnosticLocation {
            file: Some(self.file.to_string()),
            line,
            column,
            span: Some(byte_span(span)),
        };
        self.diagnostics.push(Policy::attach_help(
            location.warning(code, message.clone()),
            help.clone(),
        ));
        self.session.report(extract_note_with_help(
            location,
            DiagnosticSeverity::Warning,
            code,
            message,
            Some(help),
        ));
    }

    /// Report an info diagnostic at the offending node's span.
    pub fn info(&mut self, span: Span, code: DiagnosticCode, message: impl Into<String>) {
        let message: String = message.into();
        let (line, column) = self.span_position(Some(span)).unzip();
        let location = DiagnosticLocation {
            file: Some(self.file.to_string()),
            line,
            column,
            span: Some(byte_span(span)),
        };
        self.diagnostics.push(location.info(code, message.clone()));
        self.session
            .report(extract_note(location, DiagnosticSeverity::Info, code, message));
    }

    /// 1-based line/column for a span, or None without source text.
    fn span_position(&self, span: Option<Span>) -> Option<(u32, u32)> {
        let source = self.source?;
        let start = span?.start;
        match self.line_index {
            Some(index) => index.line_col(source, start),
            None => line_col(source, start),
        }
    }
}

/// Traverse a style object literal, nesting conditions and extracting property leaves.
pub fn walk_style_object(
    ctx: &mut ObjectWalk<'_>,
    obj: &ObjectExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // css({ color: 'red', _hover: { bg: 'n200' }, r: { md: { p: '1r' } } })
    for prop_kind in &obj.properties {
        match prop_kind {
            ObjectPropertyKind::ObjectProperty(prop) => {
                // color: 'red'
                handle_object_property(ctx, prop, when);
            }
            ObjectPropertyKind::SpreadProperty(spread) => {
                // ...{ margin: '10px' }
                spread::handle_spread_property(ctx, spread, when);
            }
        }
    }
}

pub(crate) fn handle_object_property(
    ctx: &mut ObjectWalk<'_>,
    prop: &ObjectProperty<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    let Some(key) = resolve_property_key(&prop.key, ctx.scopes) else {
        // { [dynamicKey]: '10px' }
        ctx.warn(
            prop.key.span(),
            DiagnosticCode::UnfoldableKey,
            "Dynamic computed property key encountered in style object",
        );
        return;
    };
    warn_key_residue(ctx, &prop.key);

    if handle_bag_attr_key(ctx, &key, &prop.value, when) {
        return;
    }
    let jsx_attrs = matches!(ctx.bag, BagSemantics::JsxAttributes);

    if key == "r" {
        if let Expression::ObjectExpression(r_obj) = &prop.value {
            // r: { 300: { p: '1r' }, md: { mt: '2r' } }
            keys::walk_r_object(ctx, r_obj, when);
            return;
        }
    }

    if is_condition_key(&key, ctx.breakpoints) {
        // _hover: { bg: 'n200' }
        let mut nested_when = when.clone();
        nested_when.push(key.clone().into());
        condition::handle_condition_value(ctx, &prop.value, &nested_when, &key);
    } else if is_known_style_prop(&key) {
        // color: 'red'  /  mt: '2r'
        handle_known_style_prop(ctx, &key, &prop.value, when);
    } else if !jsx_attrs {
        // fooBar: 'x' — warn and drop (N12), like the globalCss path.
        let help = suggest::suggestion_lines(
            suggest::suggest_property(&key),
            format!("remove '{key}' or check its spelling"),
        );
        ctx.warn_help(
            prop.key.span(),
            DiagnosticCode::UnknownProperty,
            format!("Unknown style property \"{key}\""),
            help,
        );
    }
    // JsxAttributes: `style`, `data-*`, `aria-*`, handlers, and every other
    // non-style key are the host's business — silent (SITE-07/08 stands).
}

/// A JSX-bag attribute key: `css` and `r` recurse like their attribute
/// spellings. True when handled; style-object bags never handle here.
fn handle_bag_attr_key(
    ctx: &mut ObjectWalk<'_>,
    key: &str,
    value: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) -> bool {
    if !matches!(ctx.bag, BagSemantics::JsxAttributes) {
        return false;
    }
    if key == "css" {
        // css: {...} in a JSX bag — recursed as the css prop (§12)
        attrs::walk_css_value(ctx, value, when);
        return true;
    }
    if key == "r" {
        // r: {...} in a JSX bag — recursed as the r prop (§12)
        attrs::walk_r_value(ctx, value, when);
        return true;
    }
    false
}

fn handle_known_style_prop(
    ctx: &mut ObjectWalk<'_>,
    key: &str,
    val_expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    if let Some(authored) = ctx.authored.as_mut() {
        let values = super::ast_value::ast_to_json_values(val_expr, ctx.scopes);
        let mut when_strings: Vec<String> = when.iter().map(|w| w.to_string()).collect();
        let last = values.len().saturating_sub(1);
        for (i, (val, imp)) in values.into_iter().enumerate() {
            // Last value moves the condition stack; earlier ones clone it.
            let when = if i == last {
                std::mem::take(&mut when_strings)
            } else {
                when_strings.clone()
            };
            authored.push(crate::runtime::AuthoredDeclaration {
                when,
                prop: key.to_string(),
                value: val,
                important: ctx.important || imp,
            });
        }
    }
    let mut expr_ctx = ctx.expression_walk(key);
    walk_expression(&mut expr_ctx, val_expr, when);
}

/// Re-exported beside `walk_style_object`: the `r` prop object walker.
/// Lives in `keys` with the key-folding helpers it shares.
pub use keys::walk_r_object;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{compile, CompileRequest, VirtualSource};
    use oxc_allocator::Allocator;
    use oxc_parser::Parser;

    fn compile_code(code: &str) -> crate::CompileResult {
        let req = CompileRequest {
            files: Some(vec![VirtualSource { path: "test.tsx".into(), content: code.into() }]),
            base_system: crate::BaseSystem::lib_fixture().clone(),
            logs: Some(vec!["proof".to_string()]),
            ..Default::default()
        };
        compile(&req).expect("compile succeeds")
    }

    /// `warn_help` carries the instance help on the pushed line and the
    /// session fact alike, so the compiler re-render re-attaches it.
    #[test]
    fn warn_help_carries_help_on_the_line_and_the_fact() {
        let code = "export const cls = {};\n";
        let allocator = Allocator::default();
        let source_type =
            oxc_span::SourceType::from_path(std::path::Path::new("t.ts")).unwrap_or_default();
        let parsed = Parser::new(&allocator, code, source_type).parse();
        assert!(!parsed.panicked);
        let bag = crate::extract::constants::collect_local_constants(&parsed.program, "t.ts", None);
        let table = crate::extract::scope::collect(&parsed.program, &bag);
        let stub = crate::extract::scope::ImportLookup::ProjectBag(&bag);
        let chain = crate::extract::scope::ScopeChain::new(&table, stub);
        let breakpoints = BreakpointScale::default();
        let mut wants = Vec::new();
        let mut diagnostics = Vec::new();
        let mut sinks = Vec::new();
        let mut session = DiagnosticsSession::new();
        {
            let mut ctx = ObjectWalk {
                origin: None,
                important: false,
                file: "t.ts",
                source: Some(code),
                line_index: None,
                scopes: chain.at(crate::extract::scope::ROOT_SCOPE),
                breakpoints: &breakpoints,
                wants: &mut wants,
                diagnostics: &mut diagnostics,
                authored: None,
                bag: BagSemantics::StyleObject,
                sinks: &mut sinks,
                session: &mut session,
            };
            ctx.warn_help(
                Span::new(0, 5),
                DiagnosticCode::UnfoldableSpread,
                "spread keeps siblings",
                vec!["define 'mix' as a static style object or inline it".to_string()],
            );
        }
        assert_eq!(diagnostics.len(), 1);
        assert_eq!(
            diagnostics[0].help,
            Some(vec!["define 'mix' as a static style object or inline it".to_string()])
        );
        let facts = session.take_facts();
        assert_eq!(facts.len(), 1);
        let crate::diagnostics::DiagnosticFact::ExtractNote { help, .. } = &facts[0] else {
            panic!("warn_help reports an extract note");
        };
        assert_eq!(
            help,
            &Some(vec!["define 'mix' as a static style object or inline it".to_string()])
        );
    }

    /// An unknown inline prop suggests the closest canon name, then the fix.
    /// Unknown-prop notes stay userspace, so the help asserts on default.
    #[test]
    fn unknown_property_help_suggests_closest_canon_name() {
        let res = compile_code(
            "import { css } from '@reference-ui/react';\
             export const cls = css({ colr: 'red' });",
        );
        let hits: Vec<_> = res
            .diagnostics
            .iter()
            .filter(|d| d.code == DiagnosticCode::UnknownProperty)
            .collect();
        assert_eq!(hits.len(), 1);
        assert_eq!(
            hits[0].help,
            Some(vec![
                "did you mean `color`?".to_string(),
                "remove 'colr' or check its spelling".to_string(),
            ])
        );
    }

    /// A far-off prop name carries the fix line alone, never a wild guess.
    #[test]
    fn unknown_property_without_candidate_keeps_fix_only() {
        let res = compile_code(
            "import { css } from '@reference-ui/react';\
             export const cls = css({ zzzqqq: 'red' });",
        );
        let hits: Vec<_> = res
            .diagnostics
            .iter()
            .filter(|d| d.code == DiagnosticCode::UnknownProperty)
            .collect();
        assert_eq!(hits.len(), 1);
        assert_eq!(
            hits[0].help,
            Some(vec!["remove 'zzzqqq' or check its spelling".to_string()])
        );
    }
}
