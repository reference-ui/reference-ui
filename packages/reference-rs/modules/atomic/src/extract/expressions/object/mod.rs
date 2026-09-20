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
use crate::diagnostics::{line_col, Diagnostic, DiagnosticCode, DiagnosticsSession};
use crate::extract::harvest::Sink;
use crate::extract::scope::Scoped;
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
        let (line, column) = self.span_position(Some(span)).unzip();
        self.diagnostics
            .push(Diagnostic::warning(code, message.into()).with_location(self.file, line, column));
    }

    /// Report an info diagnostic at the offending node's span.
    pub fn info(&mut self, span: Span, code: DiagnosticCode, message: impl Into<String>) {
        let (line, column) = self.span_position(Some(span)).unzip();
        self.diagnostics
            .push(Diagnostic::info(code, message.into()).with_location(self.file, line, column));
    }

    /// 1-based line/column for a span, or None without source text.
    fn span_position(&self, span: Option<Span>) -> Option<(u32, u32)> {
        let source = self.source?;
        line_col(source, span?.start)
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
        nested_when.push(key.into());
        condition::handle_condition_value(ctx, &prop.value, &nested_when);
    } else if is_known_style_prop(&key) {
        // color: 'red'  /  mt: '2r'
        handle_known_style_prop(ctx, &key, &prop.value, when);
    } else if !jsx_attrs {
        // fooBar: 'x' — warn and drop (N12), like the globalCss path.
        ctx.warn(
            prop.key.span(),
            DiagnosticCode::UnknownProperty,
            format!("Unknown style property \"{key}\""),
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
        let when_strings: Vec<String> = when.iter().map(|w| w.to_string()).collect();
        for (val, imp) in super::ast_value::ast_to_json_values(val_expr, ctx.scopes) {
            authored.push(crate::runtime::AuthoredDeclaration {
                when: when_strings.clone(),
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
