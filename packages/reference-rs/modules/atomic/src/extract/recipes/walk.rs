//! Recipe object walker: base styles, variant matrices, defaults, and compounds.
//! Takes a recipe object literal, its site (class name, origin, optional slot) and the extract
//! context, and emits a `RecipeDraft` of style wants, or `None` once a field refused. A field is
//! read from an inline object literal, or from a const object literal the scope table resolves
//! (`source.rs`); any other value refuses the whole definition with `ATM-E-RECIPE-FIELD` at the
//! value, naming the field. With a slot, every style position reads only that slot's entry.

use indexmap::IndexMap;
use oxc_ast::ast::{Expression, ObjectExpression, ObjectProperty, ObjectPropertyKind, PropertyKey};
use oxc_span::{GetSpan, Span};
use smallvec::smallvec;

use super::compounds::handle_recipe_compounds;
use super::located_error;
use super::source::{const_object, lower_const_style};
use super::variants::handle_recipe_variants;
use crate::atom::backing::OWN;
use crate::atom::Want;
use crate::diagnostics::{Diagnostic, DiagnosticCode, Policy};
use crate::extract::expressions::object::lower::LowerSite;
use crate::extract::expressions::walk_style_object;
use crate::extract::ExtractContext;
use crate::recipes::RecipeCompound;
use crate::resolve::font::scope;

#[derive(Default)]
pub(crate) struct RecipeDraft {
    pub(crate) base: Vec<Want>,
    pub(crate) variants: IndexMap<String, IndexMap<String, Vec<Want>>>,
    pub(crate) default_variants: IndexMap<String, String>,
    pub(crate) compounds: Vec<RecipeCompound>,
}

/// Where one recipe walk runs: the class name its messages name, the origin its styles lower
/// under, and the slot whose entries it reads (`None` for a plain recipe).
#[derive(Clone, Copy)]
pub(crate) struct RecipeSite<'a> {
    pub(crate) class_name: &'a str,
    pub(crate) origin: &'a str,
    pub(crate) slot: Option<&'a str>,
}

/// Walk one recipe object into a draft, or `None` when any field refused. Every field is walked
/// even after a refusal, so one definition reports each field it cannot read.
pub(crate) fn walk_recipe_object(
    obj: &ObjectExpression<'_>,
    site: RecipeSite<'_>,
    ctx: &mut ExtractContext<'_>,
) -> Option<RecipeDraft> {
    let mut walk = RecipeWalk {
        site,
        ctx,
        draft: RecipeDraft::default(),
        refused: false,
    };
    for prop_kind in &obj.properties {
        if let ObjectPropertyKind::ObjectProperty(prop) = prop_kind {
            handle_recipe_property(&mut walk, prop);
        }
    }
    (!walk.refused).then_some(walk.draft)
}

/// One walk over a recipe object: its site, the extract context, the draft it fills, and whether
/// a field has refused the definition.
pub(super) struct RecipeWalk<'a, 'b> {
    pub(super) site: RecipeSite<'a>,
    pub(super) ctx: &'a mut ExtractContext<'b>,
    pub(super) draft: RecipeDraft,
    pub(super) refused: bool,
}

impl RecipeWalk<'_, '_> {
    /// Wants for one style position, read at `field`: the whole value for a plain recipe, or the
    /// slot's entry for a slotted one. `None` when that slot has no entry.
    pub(super) fn style_at(&mut self, field: &str, val: &Expression<'_>) -> Option<Vec<Want>> {
        let mut wants = Vec::new();
        match self.site.slot {
            None => self.style_into(field, val, &mut wants),
            Some(slot) => {
                let entry = slot_entry(val, slot)?;
                let entry_field = format!("{field}.{slot}");
                self.style_into(&entry_field, entry, &mut wants);
            }
        }
        Some(wants)
    }

    /// Lower one style value into `wants`: an inline object walks its leaves, a const object
    /// literal lowers as `css(name)` would, and any other value refuses at `field`.
    fn style_into(&mut self, field: &str, val: &Expression<'_>, wants: &mut Vec<Want>) {
        let target = unwrap_expression(val);
        if let Expression::ObjectExpression(obj) = target {
            walk_style_into(obj, self.site.origin, self.ctx, wants);
            return;
        }
        match const_object(self, target) {
            Some((name, obj)) => {
                let site = LowerSite {
                    name: &name,
                    when: &smallvec![],
                    span: target.span(),
                };
                lower_const_style(self, obj, site, wants);
            }
            None => self.refuse_unreadable(field, val.span()),
        }
    }

    /// Refuse the definition: a field that is neither an inline object nor a const object literal.
    pub(super) fn refuse_unreadable(&mut self, field: &str, span: Span) {
        let message = format!(
            "recipe '{}': '{field}' is not an object literal or a const object literal",
            self.site.class_name
        );
        self.refuse(span, message, inline_hint(field));
    }

    /// Refuse the definition: a map entry whose key is not a static name.
    pub(super) fn refuse_computed(&mut self, field: &str, span: Span) {
        let message = format!(
            "recipe '{}': '{field}' has a computed key; name each entry with a plain key",
            self.site.class_name
        );
        self.refuse(
            span,
            message,
            format!("name each entry of {field} with a plain key"),
        );
    }

    /// Refuse the definition: a spread that brings in no const object literal.
    pub(super) fn refuse_spread(&mut self, field: &str, span: Span) {
        let message = format!(
            "recipe '{}': '{field}' spreads a value that is not an object literal or a const object literal",
            self.site.class_name
        );
        self.refuse(span, message, inline_hint(field));
    }

    /// Push one refusal and mark the definition refused.
    pub(super) fn refuse(&mut self, span: Span, message: String, help: String) {
        let diagnostic = field_refusal(self.ctx, span, message, help);
        self.ctx.diagnostics.push(diagnostic);
        self.refused = true;
    }
}

/// The `ATM-E-RECIPE-FIELD` refusal at a span, carrying its one fix hint.
pub(super) fn field_refusal(
    ctx: &ExtractContext<'_>,
    span: Span,
    message: String,
    help: String,
) -> Diagnostic {
    let diagnostic = located_error(ctx, DiagnosticCode::RecipeField, &message, span);
    Policy::attach_help(diagnostic, vec![help])
}

/// The fix hint for a field the walker cannot read: write it inline.
pub(super) fn inline_hint(field: &str) -> String {
    format!("write {field} inline as an object literal")
}

fn handle_recipe_property(walk: &mut RecipeWalk<'_, '_>, prop: &ObjectProperty<'_>) {
    let Some(key) = static_key(&prop.key) else {
        return;
    };
    match key.as_str() {
        "base" => handle_recipe_base(walk, &prop.value),
        "variants" => handle_recipe_variants(walk, &prop.value),
        "defaultVariants" => handle_recipe_defaults(&prop.value, &mut walk.draft),
        "compoundVariants" => handle_recipe_compounds(walk, &prop.value),
        _ => {}
    }
}

/// Wants for the base block: the whole object, or the slot's entry when slotted.
fn handle_recipe_base(walk: &mut RecipeWalk<'_, '_>, val: &Expression<'_>) {
    if let Some(wants) = walk.style_at("base", val) {
        walk.draft.base.extend(wants);
    }
}

fn handle_recipe_defaults(val: &Expression<'_>, draft: &mut RecipeDraft) {
    let Expression::ObjectExpression(obj) = unwrap_expression(val) else {
        return;
    };
    for prop_kind in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop_kind else {
            continue;
        };
        let Some(key) = static_key(&prop.key) else {
            continue;
        };
        if let Some(str_val) = normalized_value(&prop.value) {
            draft.default_variants.insert(key, str_val);
        }
    }
}

/// Lower an inline style object into `wants` under the origin, in its own family scope.
fn walk_style_into(
    obj: &ObjectExpression<'_>,
    origin: &str,
    ctx: &mut ExtractContext<'_>,
    wants: &mut Vec<Want>,
) {
    // One style block, one family scope: bare weights in this block resolve
    // against the block's own font, never the call site's.
    let wants_at = wants.len();
    let mut obj_ctx = ctx.object_walk_into(Some(origin), &mut *wants, &OWN);
    walk_style_object(&mut obj_ctx, obj, &smallvec![]);
    scope::apply_to_wants(&mut wants[wants_at..]);
}

fn unwrap_paren<'a, 'b>(expr: &'b Expression<'a>) -> Option<&'b Expression<'a>> {
    match expr {
        Expression::ParenthesizedExpression(p) => Some(&p.expression),
        _ => None,
    }
}

fn unwrap_ts<'a, 'b>(expr: &'b Expression<'a>) -> Option<&'b Expression<'a>> {
    match expr {
        Expression::TSAsExpression(e) => Some(&e.expression),
        Expression::TSTypeAssertion(e) => Some(&e.expression),
        Expression::TSSatisfiesExpression(e) => Some(&e.expression),
        Expression::TSNonNullExpression(e) => Some(&e.expression),
        _ => None,
    }
}

fn unwrap_expression_once<'a, 'b>(expr: &'b Expression<'a>) -> Option<&'b Expression<'a>> {
    unwrap_paren(expr).or_else(|| unwrap_ts(expr))
}

pub(crate) fn unwrap_expression<'a, 'b>(mut expr: &'b Expression<'a>) -> &'b Expression<'a> {
    while let Some(inner) = unwrap_expression_once(expr) {
        expr = inner;
    }
    expr
}

/// The value a slot map gives `slot`; the last entry wins, as in an object literal.
pub(super) fn slot_entry<'a, 'b>(
    val: &'b Expression<'a>,
    slot: &str,
) -> Option<&'b Expression<'a>> {
    let Expression::ObjectExpression(map) = unwrap_expression(val) else {
        return None;
    };
    map.properties.iter().rev().find_map(|kind| match kind {
        ObjectPropertyKind::ObjectProperty(prop) if static_key_is(&prop.key, slot) => {
            Some(&prop.value)
        }
        _ => None,
    })
}

pub(crate) fn static_key(key: &PropertyKey<'_>) -> Option<String> {
    match key {
        PropertyKey::StaticIdentifier(ident) => Some(ident.name.to_string()),
        PropertyKey::StringLiteral(lit) => Some(lit.value.to_string()),
        PropertyKey::NumericLiteral(lit) => Some(numeric_key(lit.value)),
        _ => None,
    }
}

/// True when a property key spells `name`: the same answer as `static_key(key) == Some(name)`,
/// checked without building the key string.
pub(crate) fn static_key_is(key: &PropertyKey<'_>, name: &str) -> bool {
    match key {
        PropertyKey::StaticIdentifier(ident) => ident.name.as_str() == name,
        PropertyKey::StringLiteral(lit) => lit.value.as_str() == name,
        PropertyKey::NumericLiteral(lit) => numeric_key(lit.value) == name,
        _ => false,
    }
}

fn boolean_str(val: bool) -> String {
    if val {
        "true".to_string()
    } else {
        "false".to_string()
    }
}

fn static_template_str(lit: &oxc_ast::ast::TemplateLiteral<'_>) -> Option<String> {
    if !lit.expressions.is_empty() {
        return None;
    }
    lit.quasis.first().map(|q| q.value.raw.to_string())
}

pub(super) fn normalized_value(expr: &Expression<'_>) -> Option<String> {
    let unwrapped = unwrap_expression(expr);
    match unwrapped {
        Expression::StringLiteral(lit) => Some(lit.value.to_string()),
        Expression::BooleanLiteral(lit) => Some(boolean_str(lit.value)),
        Expression::NumericLiteral(lit) => Some(numeric_key(lit.value)),
        Expression::TemplateLiteral(lit) => static_template_str(lit),
        _ => None,
    }
}

fn numeric_key(n: f64) -> String {
    if n.fract() == 0.0 {
        format!("{}", n as i64)
    } else {
        n.to_string()
    }
}
