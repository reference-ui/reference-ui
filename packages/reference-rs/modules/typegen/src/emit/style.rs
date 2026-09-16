//! Prints StyleProps, StylePropValue, StyleConditionKey, FontProps mix-in,
//! and recursive SystemStyleObject. Color keys are `canon::COLOR_PROPERTIES`
//! plus dialect aliases whose `resolve_alias` target is a color prop (`bg` →
//! `background`). Spacing keys are padding/margin aliases from `ALIASES`
//! and those canonical names — not the full CSS table and not `gap`. Radius
//! keys are canon names ending in `Radius` excluding `webkit*`, never Panda
//! `rounded*`. Raw CSS `font`, `weight`, `container`, and `r` are omitted;
//! dialect `container` / `r` plus `FontProps` replace them. Open values keep
//! the `(string & {})` hatch; strict wrappers live in `strict.rs`.

use super::fonts;
use super::strict::{self, StrictKeys};
use super::ts::{join_union, push_prop_name};
use crate::EmitOptions;
use base_system::BaseSystem;
use std::collections::{BTreeMap, BTreeSet};

const COLOR_VALUE: &str = "StylePropValue<ColorToken | (string & {})>";
const SPACING_VALUE: &str = "StylePropValue<SpacingToken | (string & {})>";
const RADIUS_VALUE: &str = "StylePropValue<RadiusToken | (string & {})>";
const CONTAINER_VALUE: &str = "StylePropValue<string | boolean>";
const RHYTHM_VALUE: &str = "StylePropValue<Record<string | number, StyleProps>>";
const PROP_VALUE: &str =
    "export type StylePropValue<T> = T | Array<T | null> | { [K in StyleConditionKey]?: T };\n";

#[derive(Clone, Copy, PartialEq, Eq)]
enum PropKind {
    Color,
    Spacing,
    Radius,
    Container,
    Rhythm,
}

struct StyleSection {
    conditions: BTreeSet<String>,
    props: BTreeMap<&'static str, PropKind>,
}

pub(super) fn style_types(system: &BaseSystem, options: &EmitOptions) -> String {
    let Some(section) = gather(system) else {
        return String::new();
    };
    let keys = strict_keys(&section.props);
    let active = strict::normalize(&options.strict, &keys);
    let mut out = String::new();
    push_condition_key(&mut out, &section.conditions);
    out.push('\n');
    out.push_str(PROP_VALUE);
    out.push('\n');
    out.push_str(fonts::font_props());
    push_props_type(&mut out, &section.props);
    out.push('\n');
    strict::push_system_style_object(&mut out, &active, &keys);
    out
}

fn gather(system: &BaseSystem) -> Option<StyleSection> {
    if system.breakpoints().is_empty() {
        return None;
    }
    Some(StyleSection {
        conditions: condition_keys(system),
        props: collect_props(
            has_category(system, "colors"),
            has_category(system, "spacing"),
            has_category(system, "radii"),
        ),
    })
}

fn collect_props(color: bool, spacing: bool, radii: bool) -> BTreeMap<&'static str, PropKind> {
    let mut props = BTreeMap::new();
    if color {
        for name in color_prop_names() {
            insert_css_prop(&mut props, name, PropKind::Color);
        }
    }
    if spacing {
        for name in spacing_prop_names() {
            insert_css_prop(&mut props, name, PropKind::Spacing);
        }
    }
    if radii {
        for name in radius_prop_names() {
            insert_css_prop(&mut props, name, PropKind::Radius);
        }
    }
    props.insert("container", PropKind::Container);
    props.insert("r", PropKind::Rhythm);
    props
}

fn insert_css_prop(
    props: &mut BTreeMap<&'static str, PropKind>,
    name: &'static str,
    kind: PropKind,
) {
    if is_omitted_css(name) {
        return;
    }
    props.insert(name, kind);
}

fn is_omitted_css(name: &str) -> bool {
    matches!(name, "font" | "weight" | "container" | "r")
}

fn color_prop_names() -> BTreeSet<&'static str> {
    let mut names = BTreeSet::new();
    names.extend(canon::COLOR_PROPERTIES.iter().copied());
    for alias in canon::ALIASES {
        if canon::is_color_prop(alias.alias) {
            names.insert(alias.alias);
        }
    }
    names
}

fn spacing_prop_names() -> BTreeSet<&'static str> {
    let mut names = BTreeSet::new();
    for alias in canon::ALIASES {
        if !is_box_spacing(alias.canonical) {
            continue;
        }
        names.insert(alias.alias);
        names.insert(alias.canonical);
    }
    names
}

fn radius_prop_names() -> BTreeSet<&'static str> {
    let mut names = BTreeSet::new();
    for prop in canon::CANONICAL_PROPERTIES {
        if is_canon_radius_prop(prop.name) {
            names.insert(prop.name);
        }
    }
    names
}

fn is_canon_radius_prop(name: &str) -> bool {
    name.ends_with("Radius") && !name.starts_with("webkit")
}

fn is_box_spacing(canonical: &str) -> bool {
    canonical.starts_with("padding") || canonical.starts_with("margin")
}

fn condition_keys(system: &BaseSystem) -> BTreeSet<String> {
    let mut keys = BTreeSet::new();
    for name in canon::NAMED_CONDITIONS {
        keys.insert((*name).to_string());
    }
    for name in system.breakpoints().names() {
        if name == "base" {
            continue;
        }
        keys.insert(format!("@{name}"));
    }
    keys
}

fn has_category(system: &BaseSystem, category: &str) -> bool {
    system
        .tokens
        .iter()
        .any(|(_, entry)| entry.category() == category)
}

fn strict_keys(props: &BTreeMap<&'static str, PropKind>) -> StrictKeys {
    StrictKeys {
        colors: keys_of(props, PropKind::Color),
        radii: keys_of(props, PropKind::Radius),
        spacing: keys_of(props, PropKind::Spacing),
    }
}

fn keys_of(props: &BTreeMap<&'static str, PropKind>, kind: PropKind) -> BTreeSet<&'static str> {
    props
        .iter()
        .filter(|(_, prop_kind)| **prop_kind == kind)
        .map(|(name, _)| *name)
        .collect()
}

fn push_condition_key(out: &mut String, keys: &BTreeSet<String>) {
    out.push_str("export type StyleConditionKey = ");
    out.push_str(&join_union(keys));
    out.push_str(";\n");
}

fn push_props_type(out: &mut String, props: &BTreeMap<&'static str, PropKind>) {
    out.push('\n');
    out.push_str("export type StyleProps = FontProps & {\n");
    for (name, kind) in props {
        out.push_str("  ");
        push_prop_name(out, name);
        out.push_str("?: ");
        out.push_str(value_for(kind));
        out.push_str(";\n");
    }
    out.push_str("};\n");
}

fn value_for(kind: &PropKind) -> &'static str {
    match kind {
        PropKind::Color => COLOR_VALUE,
        PropKind::Spacing => SPACING_VALUE,
        PropKind::Radius => RADIUS_VALUE,
        PropKind::Container => CONTAINER_VALUE,
        PropKind::Rhythm => RHYTHM_VALUE,
    }
}
