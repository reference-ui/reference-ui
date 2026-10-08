//! StyleProps vocabulary assembled before printing: prop names with value
//! domains, condition keys, aliases, and dialect keys. `PropDefs::collect`
//! builds the system-independent definition once from canon tables; the style
//! printer and the napi vocabulary share it, so the names typegen prints are
//! the names it reports. Breakpoint `@…` condition keys join at print time
//! from the system; everything else here is constant per binary.

use base_system::BaseSystem;
use serde::Serialize;
use std::collections::{BTreeMap, BTreeSet};

/// Value domain of one StyleProps key: which token union (or shape) its
/// printed value takes. Serializes lowercase for the napi vocabulary.
#[derive(Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub(super) enum PropKind {
    Color,
    Spacing,
    Radius,
    Container,
    Rhythm,
    Open,
}

/// Assembled StyleProps vocabulary. `props` is the exact printed key set;
/// `conditions` the named conditions (breakpoints join at print time);
/// `aliases` the full alias-to-canonical map; `dialect` the canon
/// Reference-only props, including the reserved and font-owned members
/// that never land in `props`.
pub(super) struct PropDefs {
    props: BTreeMap<&'static str, PropKind>,
    conditions: BTreeSet<&'static str>,
    aliases: BTreeMap<&'static str, &'static str>,
    dialect: BTreeSet<&'static str>,
}

/// JSON view of `PropDefs` for `primitives_vocabulary()`. `props` is the
/// sorted key array downstream generators read; `domains` adds the value
/// domain per key; `conditions` carries named conditions only (no
/// system-specific `@…` breakpoint keys).
#[derive(Serialize)]
pub(super) struct Vocabulary<'a> {
    props: Vec<&'a str>,
    domains: BTreeMap<&'a str, PropKind>,
    conditions: Vec<&'a str>,
    aliases: BTreeMap<&'a str, &'a str>,
    dialect: Vec<&'a str>,
}

impl PropDefs {
    pub(super) fn collect() -> Self {
        Self {
            props: collect_props(),
            conditions: named_conditions(),
            aliases: collect_aliases(),
            dialect: collect_dialect(),
        }
    }

    pub(super) fn props(&self) -> &BTreeMap<&'static str, PropKind> {
        &self.props
    }

    pub(super) fn condition_keys(&self, system: &BaseSystem) -> BTreeSet<String> {
        let mut keys: BTreeSet<String> =
            self.conditions.iter().map(ToString::to_string).collect();
        for name in system.breakpoints().names() {
            if name == "base" {
                continue;
            }
            keys.insert(format!("@{name}"));
        }
        keys
    }

    pub(super) fn vocabulary(&self) -> Vocabulary<'_> {
        Vocabulary {
            props: self.props.keys().copied().collect(),
            domains: self.props.iter().map(|(name, kind)| (*name, *kind)).collect(),
            conditions: self.conditions.iter().copied().collect(),
            aliases: self.aliases.clone(),
            dialect: self.dialect.iter().copied().collect(),
        }
    }

    pub(super) fn vocabulary_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string(&self.vocabulary())
    }
}

fn collect_props() -> BTreeMap<&'static str, PropKind> {
    let mut props = BTreeMap::new();
    for name in color_prop_names() {
        insert_css_prop(&mut props, name, PropKind::Color);
    }
    for name in spacing_prop_names() {
        insert_css_prop(&mut props, name, PropKind::Spacing);
    }
    for name in radius_prop_names() {
        insert_css_prop(&mut props, name, PropKind::Radius);
    }
    props.insert("container", PropKind::Container);
    props.insert("r", PropKind::Rhythm);
    for name in open_prop_names() {
        props.entry(name).or_insert(PropKind::Open);
    }
    props
}

fn named_conditions() -> BTreeSet<&'static str> {
    canon::NAMED_CONDITIONS.iter().copied().collect()
}

fn collect_aliases() -> BTreeMap<&'static str, &'static str> {
    canon::ALIASES
        .iter()
        .map(|alias| (alias.alias, alias.canonical))
        .collect()
}

fn collect_dialect() -> BTreeSet<&'static str> {
    canon::REFERENCE_PROPS.iter().copied().collect()
}

fn open_prop_names() -> BTreeSet<&'static str> {
    let mut names = BTreeSet::new();
    for prop in canon::CANONICAL_PROPERTIES {
        names.insert(prop.name);
    }
    for alias in canon::ALIASES {
        names.insert(alias.alias);
    }
    for ref_prop in canon::REFERENCE_PROPS {
        if *ref_prop != "variant" && *ref_prop != "colorMode" {
            names.insert(ref_prop);
        }
    }
    names.remove("font");
    names.remove("weight");
    names
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
