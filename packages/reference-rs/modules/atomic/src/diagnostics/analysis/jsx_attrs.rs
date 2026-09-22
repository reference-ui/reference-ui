//! JSX attribute values for independent diagnostics analysis.
//!
//! Lowers one attribute (or spread-bag entry) on a traced host to the shared
//! object and block walkers: `css` blocks walk with an empty `when` stack,
//! condition blocks nest one level, style props classify as leaves, and the
//! host's own props, native `style`, runtime-owned `variant`/`colorMode`,
//! and unknown DOM attributes emit nothing. Element values are never styles.

use canon::is_condition_prop;
use oxc_ast::ast::{Expression, ObjectExpression, ObjectPropertyKind};
use oxc_span::{GetSpan, Span};

use super::block::{const_leaf_value, walk_block, walk_const_object, walk_leaf_class};
use super::conditions::static_key;
use super::conditions::KeyClass;
use super::const_values::split_important;
use super::gate::{is_style_attr, AttrGate};
use super::object::{walk_leaf, walk_nested_object, walk_object, walk_r_entry, Site, WalkCtx};
use super::values::unwrap_value;
use crate::diagnostics::DynamicShape;
use crate::extract::constants::ConstObject;

/// One attribute value shape: bare (`<Div truncate />`), string
/// (`<Div mt="2r" />`), or expression (`<Div mt={x} />`).
pub enum AttrInput<'a> {
    Bare,
    Text(&'a str),
    Expr(&'a Expression<'a>),
}

/// Lower one gated attribute value: bare names assert `true`, strings
/// split important, and expressions walk by attribute kind.
pub fn walk_attr_input(walk: &mut WalkCtx<'_>, name: &str, input: AttrInput<'_>, span: Span) {
    match input {
        AttrInput::Bare => walk_bare_attr(walk, name, span),
        AttrInput::Text(text) => walk_text_attr(walk, name, text, span),
        AttrInput::Expr(expr) => walk_expr_attr(walk, name, expr, span),
    }
}

/// Lower one bare attribute: style props, condition props, and `r` assert
/// `true` (runtime queries the scalar); bare `css` queries nothing.
fn walk_bare_attr(walk: &mut WalkCtx<'_>, name: &str, span: Span) {
    if name == "css" {
        return;
    }
    let site = Site {
        span,
        prop: name,
        when: &[],
    };
    walk.expect(site, serde_json::Value::Bool(true), false);
}

/// Lower one string attribute: every gated name splits important except
/// `css`, whose scalar values never query.
fn walk_text_attr(walk: &mut WalkCtx<'_>, name: &str, text: &str, span: Span) {
    if name == "css" {
        return;
    }
    let (clean, important) = split_important(text);
    let site = Site {
        span,
        prop: name,
        when: &[],
    };
    walk.expect(
        site,
        serde_json::Value::String(clean.to_string()),
        important,
    );
}

/// Lower one expression attribute: `css` walks as a block, `r` follows the
/// `r` rule, conditions recurse objects and classify the rest, and style
/// props go responsive-or-leaf.
fn walk_expr_attr(walk: &mut WalkCtx<'_>, name: &str, expr: &Expression<'_>, span: Span) {
    if name == "css" {
        walk_block(walk, expr, &[]);
        return;
    }
    let site = Site {
        span,
        prop: name,
        when: &[],
    };
    if name == "r" {
        walk_r_entry(walk, site, expr);
        return;
    }
    let value = unwrap_value(expr);
    if is_condition_prop(name) {
        walk_condition_attr(walk, value, site);
    } else {
        walk_style_attr(walk, value, site);
    }
}

/// Lower one condition-prop value: objects recurse under the condition,
/// every other shape classifies as a scalar leaf with an empty `when`.
fn walk_condition_attr(walk: &mut WalkCtx<'_>, value: &Expression<'_>, site: Site<'_>) {
    if let Expression::ObjectExpression(obj) = value {
        walk_object(walk, obj, &[site.prop.into()]);
    } else {
        walk_leaf(walk, site, value);
    }
}

/// Lower one style-prop value: objects go responsive-or-recurse, every
/// other shape classifies as a scalar leaf.
fn walk_style_attr(walk: &mut WalkCtx<'_>, value: &Expression<'_>, site: Site<'_>) {
    if let Expression::ObjectExpression(obj) = value {
        walk_nested_object(walk, obj, site);
    } else {
        walk_leaf(walk, site, value);
    }
}

/// Walk one inline spread bag (`<Div {...{ mt: '2r' }} />`): entries lower
/// as attributes, inline spreads recurse, const spreads unfold or vanish,
/// and unknown shapes stay dynamic spreads.
pub fn walk_bag_object(walk: &mut WalkCtx<'_>, gate: &AttrGate<'_>, obj: &ObjectExpression<'_>) {
    for prop_kind in &obj.properties {
        match prop_kind {
            ObjectPropertyKind::SpreadProperty(spread) => {
                walk_bag_spread(walk, gate, &spread.argument, spread.span);
            }
            ObjectPropertyKind::ObjectProperty(prop) => {
                let KeyClass::Static(key) = static_key(&prop.key, prop.computed) else {
                    walk.dynamic(Site::bare(prop.key.span(), &[]), DynamicShape::UnknownProp);
                    continue;
                };
                let key: &str = &key;
                if is_style_attr(gate, key) {
                    walk_attr_input(walk, key, AttrInput::Expr(&prop.value), prop.value.span());
                }
            }
        }
    }
}

/// Walk one spread inside a bag: inline literals recurse, const objects
/// unfold in attribute mode, const scalars and arrays vanish (their spread
/// adds no style entries), and anything else stays a dynamic spread.
fn walk_bag_spread(walk: &mut WalkCtx<'_>, gate: &AttrGate<'_>, arg: &Expression<'_>, span: Span) {
    let arg = unwrap_value(arg);
    if let Expression::ObjectExpression(obj) = arg {
        walk_bag_object(walk, gate, obj);
        return;
    }
    if let Expression::Identifier(ident) = arg {
        if walk_bag_const_spread(walk, gate, ident.name.as_str(), span) {
            return;
        }
    }
    walk.dynamic(Site::bare(span, &[]), DynamicShape::Spread);
}

/// Walk one identifier bag spread from the const recording. True when the
/// name resolved (unfolded or soundly skipped); false stays dynamic.
fn walk_bag_const_spread(
    walk: &mut WalkCtx<'_>,
    gate: &AttrGate<'_>,
    name: &str,
    span: Span,
) -> bool {
    if super::is_shadowed(walk.shadows, name) || walk.constants.mutation(name).is_some() {
        return false;
    }
    if let Some(obj) = walk.constants.get_object(name) {
        walk_const_attrs(walk, gate, obj, Site::bare(span, &[]));
        return true;
    }
    if walk.constants.get_array(name).is_some() {
        return true;
    }
    !walk.constants.scalar_leaves(name).is_empty()
}

/// Walk one recorded const bag in attribute mode: `css` blocks unfold,
/// conditions nest, style props take single leaves exact, and unknown keys
/// stay silent (a bag names attributes, not style positions).
pub fn walk_const_attrs(
    walk: &mut WalkCtx<'_>,
    gate: &AttrGate<'_>,
    obj: &ConstObject,
    site: Site<'_>,
) {
    for (key, prop) in obj.iter() {
        if is_style_attr(gate, key) {
            let entry = Site { prop: key, ..site };
            walk_const_attr_entry(walk, prop, entry);
        }
    }
}

/// Walk one recorded bag entry: unusable entries stay dynamic and the rest
/// dispatch by attribute kind. Ungated names never reach here.
fn walk_const_attr_entry(
    walk: &mut WalkCtx<'_>,
    prop: &crate::extract::constants::ObjectProp,
    site: Site<'_>,
) {
    if prop.residue || prop.is_empty() {
        walk.dynamic(site, DynamicShape::UnknownValue);
        return;
    }
    if site.prop == "css" {
        walk_const_css_entry(walk, prop, site);
    } else if site.prop == "r" {
        walk_const_r_entry(walk, prop, site);
    } else if is_condition_prop(site.prop) {
        walk_const_condition_entry(walk, prop, site);
    } else {
        walk_const_style_entry(walk, prop, site);
    }
}

/// Walk one recorded `css` bag entry: nested maps unfold as style blocks
/// and scalar leaves vanish (a scalar `css` never queries).
fn walk_const_css_entry(
    walk: &mut WalkCtx<'_>,
    prop: &crate::extract::constants::ObjectProp,
    site: Site<'_>,
) {
    if !prop.nested.is_empty() {
        walk_const_object(walk, &prop.nested, site.when, site.span);
    }
}

/// Walk one recorded `r` bag entry: nested maps stay dynamic whens and
/// single scalar leaves go exact like any other scalar.
fn walk_const_r_entry(
    walk: &mut WalkCtx<'_>,
    prop: &crate::extract::constants::ObjectProp,
    site: Site<'_>,
) {
    if !prop.nested.is_empty() {
        walk.dynamic(site, DynamicShape::UnknownWhen);
    } else {
        walk_leaf_class(walk, const_leaf_value(prop), site, DynamicShape::UnknownWhen);
    }
}

/// Walk one recorded condition bag entry: nested maps recurse with the key
/// pushed and single scalar leaves go exact.
fn walk_const_condition_entry(
    walk: &mut WalkCtx<'_>,
    prop: &crate::extract::constants::ObjectProp,
    site: Site<'_>,
) {
    if !prop.nested.is_empty() && prop.leaves.is_empty() {
        let mut nested = site.when.to_vec();
        nested.push(site.prop.into());
        walk_const_object(walk, &prop.nested, &nested, site.span);
    } else if prop.nested.is_empty() {
        walk_leaf_class(walk, const_leaf_value(prop), site, DynamicShape::UnknownValue);
    } else {
        walk.dynamic(site, DynamicShape::UnknownValue);
    }
}

/// Walk one recorded style bag entry: single leaves go exact and anything
/// richer stays dynamic (recorded responsive objects never build values).
fn walk_const_style_entry(
    walk: &mut WalkCtx<'_>,
    prop: &crate::extract::constants::ObjectProp,
    site: Site<'_>,
) {
    if prop.nested.is_empty() {
        walk_leaf_class(walk, const_leaf_value(prop), site, DynamicShape::UnknownValue);
    } else {
        walk.dynamic(site, DynamicShape::UnknownValue);
    }
}

/// Render a JSX tag name: identifiers verbatim, member chains dotted. This
/// duplicates the extraction formatter (a private module): analysis names
/// tags independently so host-matching drift surfaces as missed sites,
/// never phantoms. Drift watch: `extract::jsx::names`.
pub fn format_element_name(name: &oxc_ast::ast::JSXElementName<'_>) -> String {
    use oxc_ast::ast::JSXElementName;
    match name {
        JSXElementName::Identifier(ident) => ident.name.to_string(),
        JSXElementName::IdentifierReference(ident) => ident.name.to_string(),
        JSXElementName::NamespacedName(ns) => {
            format!("{}:{}", ns.namespace.name, ns.name.name)
        }
        JSXElementName::MemberExpression(member) => format_member_expr(member),
        JSXElementName::ThisExpression(_) => "this".to_string(),
    }
}

/// Render one JSX member chain (`<Foo.Bar.Baz />`) dotted.
fn format_member_expr(member: &oxc_ast::ast::JSXMemberExpression<'_>) -> String {
    format!(
        "{}.{}",
        format_member_object(&member.object),
        member.property.name
    )
}

/// Render the object half of one JSX member chain.
fn format_member_object(object: &oxc_ast::ast::JSXMemberExpressionObject<'_>) -> String {
    use oxc_ast::ast::JSXMemberExpressionObject;
    match object {
        JSXMemberExpressionObject::IdentifierReference(ident) => ident.name.to_string(),
        JSXMemberExpressionObject::MemberExpression(inner) => format_member_expr(inner),
        JSXMemberExpressionObject::ThisExpression(_) => "this".to_string(),
    }
}

/// Render a JSX attribute name, preserving XML namespaces.
pub fn format_attribute_name(name: &oxc_ast::ast::JSXAttributeName<'_>) -> String {
    use oxc_ast::ast::JSXAttributeName;
    match name {
        JSXAttributeName::Identifier(ident) => ident.name.to_string(),
        JSXAttributeName::NamespacedName(ns) => {
            format!("{}:{}", ns.namespace.name, ns.name.name)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::super::support::{dynamic_count, exact_keys, parse_for_test};
    use super::*;
    use crate::diagnostics::{DiagnosticFact, SourceId, StyleSurfaceKind};
    use rustc_hash::FxHashSet;
    use std::collections::{BTreeMap, BTreeSet};

    // Walker-level: visitors shadow top-level declarators end to end.
    fn walk_bag_const(source: &str) -> Vec<DiagnosticFact> {
        let allocator = oxc_allocator::Allocator::default();
        let program = parse_for_test(&allocator, source);
        let constants =
            crate::extract::constants::collect_local_constants(&program, "test.ts", Some(source));
        let bag = constants.get_object("bag").expect("const bag");
        let style_props: FxHashSet<String> = ["mt"].into_iter().map(str::to_string).collect();
        let shadows: Vec<FxHashSet<String>> = Vec::new();
        let owned: BTreeMap<String, BTreeSet<String>> = BTreeMap::new();
        let gate = AttrGate { tag: "Div", owned: &owned };
        let mut facts = Vec::new();
        let mut walk = WalkCtx {
            facts: &mut facts,
            source: SourceId(0),
            surface: StyleSurfaceKind::JsxStyle,
            system: "test",
            style_props: &style_props,
            constants: &constants,
            shadows: &shadows,
        };
        walk_const_attrs(&mut walk, &gate, bag, Site::bare(Span::new(0, 0), &[]));
        facts
    }

    #[test]
    fn const_bag_hole_entries_emit_no_fact_and_true_stays_exact() {
        let facts = walk_bag_const("const bag = { mt: false };");
        assert!(facts.is_empty());
        let facts = walk_bag_const("const bag = { mt: true };");
        assert_eq!(exact_keys(&facts).len(), 1);
        assert_eq!(dynamic_count(&facts), 0);
    }
}
