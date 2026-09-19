//! Recorded const-object lowering: spreads, args, and blocks paint alike.
//! A resolved const object lowers exactly as if spread: style entries lower
//! their leaves, condition entries scope their nested maps, and unknown keys
//! warn like literal keys. Const-array object elements lower through here
//! too, so merge-list spreads and const-object spreads agree. Whole-object
//! `css()` args and JSX style blocks share this path, keeping arg and spread
//! output identical by construction.

use std::collections::BTreeMap;

use oxc_span::Span;
use smallvec::SmallVec;

use super::{condition::is_condition_key, entries, BagSemantics, ObjectWalk};
use crate::atom::AtomValue;
use crate::diagnostics::DiagnosticCode;
use crate::extract::constants::{ConstObject, ObjectProp};
use canon::is_known_style_prop;

/// Lower one const-array object element exactly as if spread: its
/// single-leaf entries lower like const-object leaves with plans, unknown
/// keys warn like literals. Merge-list spreads lower through here, so array
/// and const-object spreads paint alike.
pub fn lower_array_object(
    ctx: &mut ObjectWalk<'_>,
    name: &str,
    map: &BTreeMap<String, AtomValue>,
    when: &SmallVec<[Box<str>; 2]>,
    span: Span,
) {
    let obj: ConstObject = map
        .iter()
        .map(|(key, val)| {
            (
                key.clone(),
                ObjectProp {
                    leaves: vec![val.clone()],
                    nested: ConstObject::new(),
                    residue: false,
                },
            )
        })
        .collect();
    lower_const_object(ctx, name, &obj, when, span);
}

/// Where one const-object lowering sits: whose object, under which
/// conditions, diagnosed at which span.
pub(crate) struct LowerSite<'a> {
    pub(crate) name: &'a str,
    pub(crate) when: &'a SmallVec<[Box<str>; 2]>,
    pub(crate) span: Span,
}

/// Lower a resolved const object exactly as if spread: one want and one
/// authored plan per recorded leaf, unknown keys diagnosed like literal
/// keys, entries with no static value diagnosed, nested conditions scoped
/// under their key (SPEC-V2-24). Whole-object `css()` args and JSX style
/// blocks lower through here, so arg and spread paint agree.
pub fn lower_const_object(
    ctx: &mut ObjectWalk<'_>,
    name: &str,
    obj: &ConstObject,
    when: &SmallVec<[Box<str>; 2]>,
    span: Span,
) {
    warn_unknown_spread_keys(ctx, obj, span);
    let site = LowerSite { name, when, span };
    // `r` is a known style prop, but under `JsxAttributes` the css/r loop
    // below owns both keys — the style loop would double-lower them.
    let jsx_attrs = matches!(ctx.bag, BagSemantics::JsxAttributes);
    for (key, prop) in obj.iter() {
        if is_known_style_prop(key) && !(jsx_attrs && (key == "css" || key == "r")) {
            entries::lower_style_entry(ctx, &site, key, prop);
        }
    }
    for (key, prop) in obj.iter() {
        if is_condition_key(key, ctx.breakpoints) {
            entries::lower_condition_entry(ctx, &site, key, prop);
        }
    }
    if jsx_attrs {
        lower_attr_entries(ctx, &site, obj);
    }
}

/// Lower the attribute keys of a JSX spread bag: `css` and `r` recurse
/// like their attribute spellings, every other key stays silent.
fn lower_attr_entries(ctx: &mut ObjectWalk<'_>, site: &LowerSite<'_>, obj: &ConstObject) {
    for (key, prop) in obj.iter() {
        if key == "css" {
            entries::lower_css_entry(ctx, site, key, prop);
        } else if key == "r" {
            entries::lower_r_entry(ctx, site, key, prop);
        }
    }
}

/// Warn once per spread key that is neither a style prop nor a condition.
/// Under `JsxAttributes` every other key is the host's business: silent.
fn warn_unknown_spread_keys(ctx: &mut ObjectWalk<'_>, obj: &ConstObject, span: Span) {
    if matches!(ctx.bag, BagSemantics::JsxAttributes) {
        return;
    }
    for (key, _) in obj.iter() {
        // Spread keys warn and drop like literal keys (N12).
        if !is_known_style_prop(key) && !is_condition_key(key, ctx.breakpoints) {
            ctx.warn(
                span,
                DiagnosticCode::UnknownProperty,
                format!("Unknown style property \"{key}\""),
            );
        }
    }
}
