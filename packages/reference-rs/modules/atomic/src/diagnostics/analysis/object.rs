//! Shared style-object walker for independent diagnostics analysis.
//!
//! Walks object literals and recorded const objects, emitting exact expected
//! lookups and dynamic-shape facts. Dispatch mirrors neo `collectEntries` in
//! order — objects go responsive-or-recurse, holes vanish, leaves classify —
//! so expectations name the queries runtime will actually issue. Both the
//! `css()` and JSX surfaces share this walker; the surface modules only find
//! the blocks. Unknown keys, `r` objects, and dynamic spreads become
//! dynamic-shape facts, never guessed keys.

use oxc_ast::ast::{Expression, ObjectExpression, ObjectPropertyKind};
use rustc_hash::FxHashSet;
use oxc_span::{GetSpan, Span};

use super::block::walk_const_object;
use super::conditions::{is_style_value_position, static_key, KeyClass};
use super::is_shadowed;
use super::structured::responsive_object_value;
use super::values::{classify_value, unwrap_value, ValueClass, ValueScope};
use crate::atom::AtomValue;
use crate::diagnostics::{
    DiagnosticFact, DynamicShape, OwnedLookupKey, SourceId, SourceSite, StyleSurfaceKind,
};
use crate::extract::constants::LocalConstants;

/// The shared walk state for one style object: the fact sink plus the
/// identities (source, surface, system) and the name truth (style props,
/// const values, shadows) every entry consults.
pub struct WalkCtx<'a> {
    pub facts: &'a mut Vec<DiagnosticFact>,
    pub source: SourceId,
    pub surface: StyleSurfaceKind,
    pub system: &'a str,
    pub style_props: &'a FxHashSet<String>,
    pub constants: &'a LocalConstants,
    pub shadows: &'a [FxHashSet<String>],
}

/// One fact site: the span the prediction points at, the authored prop,
/// and the condition stack above it. Walks pass sites instead of loose
/// span/prop/when triples so arities stay small.
#[derive(Clone, Copy)]
pub struct Site<'a> {
    pub span: Span,
    pub prop: &'a str,
    pub when: &'a [Box<str>],
}

impl Site<'_> {
    /// A site for a shape with no prop of its own (spreads, blocks).
    pub fn bare(span: Span, when: &[Box<str>]) -> Site<'_> {
        Site {
            span,
            prop: "",
            when,
        }
    }
}

impl WalkCtx<'_> {
    /// The value scope this walk classifies through.
    fn scope(&self) -> ValueScope<'_> {
        ValueScope {
            constants: self.constants,
            shadows: self.shadows,
        }
    }

    /// Record one exact expected lookup at `site`.
    pub fn expect(&mut self, site: Site<'_>, value: serde_json::Value, important: bool) {
        let source = SourceSite {
            source: self.source,
            span: site.span,
            surface: self.surface,
            prop: site.prop.into(),
            when: site.when.to_vec(),
        };
        let key = OwnedLookupKey {
            system: self.system.into(),
            when: site.when.to_vec(),
            prop: site.prop.into(),
            value,
            important,
        };
        self.facts
            .push(DiagnosticFact::ExactLookupExpected { site: source, key });
    }

    /// Record one dynamic slot at `site`: runtime queries here, but the key
    /// is not statically known.
    pub fn dynamic(&mut self, site: Site<'_>, shape: DynamicShape) {
        let source = SourceSite {
            source: self.source,
            span: site.span,
            surface: self.surface,
            prop: site.prop.into(),
            when: site.when.to_vec(),
        };
        self.facts.push(DiagnosticFact::DynamicSlot {
            site: source,
            shape,
        });
    }
}

/// Walk one style-object literal, nesting conditions and classifying leaves.
/// Holes (`null`, `undefined`, `void`, literal `false`) emit no fact: runtime
/// skips them without querying.
pub fn walk_object(walk: &mut WalkCtx<'_>, obj: &ObjectExpression<'_>, when: &[Box<str>]) {
    for prop_kind in &obj.properties {
        match prop_kind {
            ObjectPropertyKind::SpreadProperty(spread) => {
                walk_object_spread(walk, &spread.argument, spread.span, when);
            }
            ObjectPropertyKind::ObjectProperty(prop) => walk_entry(walk, prop, when),
        }
    }
}

/// Walk one spread inside a style object: inline literals unfold, const
/// objects unfold from the recording, scalar consts vanish (spreading a
/// number, boolean, or hole adds no entries), and anything else is a dynamic
/// spread. Const strings stay dynamic: spreading a string adds index entries
/// analysis does not spell.
fn walk_object_spread(walk: &mut WalkCtx<'_>, arg: &Expression<'_>, span: Span, when: &[Box<str>]) {
    let arg = unwrap_value(arg);
    if let Expression::ObjectExpression(obj) = arg {
        walk_object(walk, obj, when);
        return;
    }
    if let Expression::Identifier(ident) = arg {
        if walk_const_spread(walk, ident.name.as_str(), span, when) {
            return;
        }
    }
    walk.dynamic(Site::bare(span, when), DynamicShape::Spread);
}

/// Walk one identifier spread from the const recording. True when the name
/// resolved (unfolded or soundly skipped); false stays a dynamic spread.
fn walk_const_spread(walk: &mut WalkCtx<'_>, name: &str, span: Span, when: &[Box<str>]) -> bool {
    if is_shadowed(walk.shadows, name) || walk.constants.mutation(name).is_some() {
        return false;
    }
    if let Some(obj) = walk.constants.get_object(name) {
        walk_const_object(walk, obj, when, span);
        return true;
    }
    if walk.constants.get_array(name).is_some() {
        return false;
    }
    is_spreadable_scalar(walk.constants.scalar_leaves(name))
}

/// True when spreading one recorded scalar adds no entries: every scalar
/// except strings (whose spread adds index entries analysis never spells).
fn is_spreadable_scalar(leaves: &[AtomValue]) -> bool {
    match leaves {
        [AtomValue::String(_)] => false,
        [_] => true,
        _ => false,
    }
}

/// Walk one object entry: unknown keys are dynamic props, `r` objects are
/// dynamic whens (the `r` lowering is unproven — S2 stays out), object
/// values go responsive-or-recurse, and leaves classify or vanish as holes.
fn walk_entry(walk: &mut WalkCtx<'_>, prop: &oxc_ast::ast::ObjectProperty<'_>, when: &[Box<str>]) {
    let KeyClass::Static(key) = static_key(&prop.key, prop.computed) else {
        walk.dynamic(Site::bare(prop.key.span(), when), DynamicShape::UnknownProp);
        return;
    };
    let key: &str = &key;
    let site = Site {
        span: prop.value.span(),
        prop: key,
        when,
    };
    if key == "r" {
        walk_r_entry(walk, site, &prop.value);
        return;
    }
    let value = unwrap_value(&prop.value);
    if let Expression::ObjectExpression(obj) = value {
        walk_nested_object(walk, obj, site);
        return;
    }
    walk_leaf(walk, site, value);
}

/// Classify one scalar-position value: holes vanish without querying,
/// exact values predict, unknown values stay dynamic. Shared by object
/// entries and JSX attribute values.
pub fn walk_leaf(walk: &mut WalkCtx<'_>, site: Site<'_>, value: &Expression<'_>) {
    let value = unwrap_value(value);
    if is_hole(value) {
        return;
    }
    match classify_value(value, &walk.scope()) {
        ValueClass::Exact { value, important } => {
            walk.expect(site, value, important);
        }
        ValueClass::Hole => {}
        ValueClass::Unknown => {
            walk.dynamic(site, DynamicShape::UnknownValue);
        }
    }
}

/// Walk one `r` value: object values are dynamic whens until the `r`
/// parity story is proven; scalar leaves classify like any other prop.
/// Shared by object entries and the JSX `r` attribute.
pub fn walk_r_entry(walk: &mut WalkCtx<'_>, site: Site<'_>, value: &Expression<'_>) {
    let value = unwrap_value(value);
    if matches!(value, Expression::ObjectExpression(_)) {
        walk.dynamic(site, DynamicShape::UnknownWhen);
        return;
    }
    if is_hole(value) {
        return;
    }
    match classify_value(value, &walk.scope()) {
        ValueClass::Exact { value, important } => {
            walk.expect(site, value, important);
        }
        ValueClass::Hole => {}
        ValueClass::Unknown => {
            walk.dynamic(site, DynamicShape::UnknownWhen);
        }
    }
}

/// Walk one nested object value: style positions query the whole responsive
/// object, every other key recurses into the `when` stack. Shared by object
/// entries and JSX style attributes.
pub fn walk_nested_object(walk: &mut WalkCtx<'_>, obj: &ObjectExpression<'_>, site: Site<'_>) {
    if is_style_value_position(site.prop, walk.style_props) {
        match responsive_object_value(obj, &walk.scope()) {
            Some(value) => walk.expect(site, value, false),
            None => walk.dynamic(site, DynamicShape::UnknownValue),
        }
        return;
    }
    let mut nested = site.when.to_vec();
    nested.push(site.prop.into());
    walk_object(walk, obj, &nested);
}

/// True for leaves runtime skips without querying: `null`, `undefined`,
/// `void`, and literal `false`. `0` and `''` are falsy but queried.
fn is_hole(expr: &Expression<'_>) -> bool {
    match expr {
        Expression::NullLiteral(_) => true,
        Expression::BooleanLiteral(lit) => !lit.value,
        Expression::Identifier(ident) => is_hole_name(ident.name.as_str()),
        Expression::UnaryExpression(unary) => unary.operator == oxc_ast::ast::UnaryOperator::Void,
        _ => false,
    }
}

/// True for the identifier spellings of holes.
fn is_hole_name(name: &str) -> bool {
    name == "undefined" || name == "null"
}

#[cfg(test)]
mod tests {
    use super::super::support::{dynamic_count, exact_keys, walk_first_object};
    use super::*;
    use crate::diagnostics::StyleSurfaceKind;

    fn walk_source(source: &str) -> Vec<DiagnosticFact> {
        walk_first_object(
            source,
            StyleSurfaceKind::Css,
            &["color", "mt", "width", "padding"],
        )
    }

    #[test]
    fn flat_objects_emit_exact_keys() {
        let facts = walk_source("css({ color: 'red', mt: '2r' })");
        assert_eq!(
            exact_keys(&facts),
            vec![
                r#"["test",[],"color","red",false]"#.to_string(),
                r#"["test",[],"mt","2r",false]"#.to_string(),
            ]
        );
        assert_eq!(dynamic_count(&facts), 0);
    }

    #[test]
    fn nested_conditions_push_raw_whens() {
        let facts = walk_source("css({ _hover: { _focus: { color: 'red' } } })");
        assert_eq!(
            exact_keys(&facts),
            vec![r#"["test",["_hover","_focus"],"color","red",false]"#.to_string()]
        );
    }

    #[test]
    fn unlowerable_conditions_stay_exact() {
        let facts = walk_source("css({ _hovr: { color: 'red.500' } })");
        assert_eq!(
            exact_keys(&facts),
            vec![r#"["test",["_hovr"],"color","red.500",false]"#.to_string()]
        );
    }

    #[test]
    fn holes_emit_no_fact() {
        let facts = walk_source("css({ a: null, b: undefined, c: void 0, d: false, e: 0 })");
        assert_eq!(
            exact_keys(&facts),
            vec![r#"["test",[],"e",0,false]"#.to_string()]
        );
        assert_eq!(dynamic_count(&facts), 0);
    }

    #[test]
    fn spreads_and_computed_keys_stay_dynamic() {
        let facts = walk_source("css({ ...base, [k]: 'red', color: 'red' })");
        assert_eq!(
            exact_keys(&facts),
            vec![r#"["test",[],"color","red",false]"#.to_string()]
        );
        assert_eq!(dynamic_count(&facts), 2);
    }

    #[test]
    fn r_objects_stay_dynamic() {
        let facts = walk_source("css({ r: { 300: { p: '1r' } } })");
        assert!(exact_keys(&facts).is_empty());
        assert_eq!(dynamic_count(&facts), 1);
    }

    #[test]
    fn custom_prop_objects_predict_one_whole_object_exact() {
        // `--x` is absent from the style set on purpose: the `--` prefix
        // rule alone must route the object to one whole-object exact.
        let facts = walk_source("css({ '--x': { base: '1', md: '2' } })");
        assert_eq!(
            exact_keys(&facts),
            vec![r#"["test",[],"--x",{"base":"1","md":"2"},false]"#.to_string()]
        );
        assert_eq!(dynamic_count(&facts), 0);
    }
}
