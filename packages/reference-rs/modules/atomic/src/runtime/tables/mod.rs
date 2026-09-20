//! Namer tables: the closed data both namers read, written once by Rust.
//!
//! Built from canon plus the `BaseSystem` plus the atomic constants at
//! compile time and shipped in the artifact as `runtime.namer`. Lookups
//! (aliases, prefixes, keyword sets, fonts) sort their keys; lowerings,
//! breakpoints, conditions unions, and font extras keep the orders the
//! interpreter and the expansion passes rely on. The rules version sits
//! at 4 and bumps whenever a naming rule changes a class.

use std::collections::BTreeMap;

use base_system::BaseSystem;
use serde::{Deserialize, Serialize};

use super::lowerings::{build_lowerings, LowerStep};
use crate::resolve::conditions::pseudoprops::PRESETS;
use crate::resolve::font::{family, weight};
use crate::resolve::shorthands::{border, parser};

/// Rules version both namers pin: bump whenever a naming rule changes a class.
pub const NAMER_RULES_VERSION: u32 = 4;

/// The closed, O(props + conditions + fonts) data both namers read.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NamerTables {
    /// Naming-rules version; artifact and runtime namer must agree.
    pub rules_version: u32,
    /// Alias to canonical, sorted keys.
    pub aliases: BTreeMap<String, String>,
    /// Canonical to class prefix, only where the prefix is not the kebab name.
    pub prefixes: BTreeMap<String, String>,
    /// Canonical to ordered lowering steps; absent means identity.
    pub lowerings: BTreeMap<String, Vec<LowerStep>>,
    /// Keyword sets the procedures consult.
    pub keywords: BTreeMap<String, Vec<String>>,
    /// Weight keyword pairs in table order.
    pub weight_keywords: Vec<(String, String)>,
    /// Props exempt from bare-number canonicalization.
    pub color_props: Vec<String>,
    /// Breakpoint scale names verbatim, leading `base` included.
    pub breakpoints: Vec<String>,
    /// Breakpoint name to post-`into_px` width, only where the scale
    /// declares one (`base` never present). The range gate reads it:
    /// `*Down`/`*Only`/`*To*` consult `width_px` parses the class never
    /// carries, so names alone cannot mirror membership.
    pub breakpoint_widths: BTreeMap<String, String>,
    /// Known `_` keys verbatim: authored keys plus their underscore
    /// twins, unioned with both preset spellings. The request tests
    /// membership exactly; the segment still strips one `_`.
    pub conditions: Vec<String>,
    /// Family to default weight, scoped weights, and ordered extras.
    pub fonts: BTreeMap<String, FontTable>,
}

/// One font family's namer row: precomputed default plus lookup data.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FontTable {
    /// Precomputed default weight (`css.fontWeight`, `weights.normal`, `400`).
    pub weight: String,
    /// Scoped weight map for `family.weight` lookups.
    pub weights: BTreeMap<String, String>,
    /// Ordered `css` extras as pairs; declaration order is load-bearing.
    pub css: Vec<(String, String)>,
}

impl NamerTables {
    /// Build the closed tables for one system from canon, the system, and
    /// the atomic constants. Atom-independent by construction.
    pub fn for_system(system: &BaseSystem) -> Self {
        Self {
            rules_version: NAMER_RULES_VERSION,
            aliases: build_aliases(),
            prefixes: build_prefixes(),
            lowerings: build_lowerings(),
            keywords: build_keywords(),
            weight_keywords: build_weight_keywords(),
            color_props: canon::COLOR_PROPERTIES
                .iter()
                .map(|name| (*name).to_string())
                .collect(),
            breakpoints: system.breakpoints().names().to_vec(),
            breakpoint_widths: build_breakpoint_widths(system),
            conditions: build_conditions(system),
            fonts: build_fonts(system),
        }
    }
}

impl Default for NamerTables {
    /// Tables for the empty system: canon lookups with no scale data.
    fn default() -> Self {
        Self::for_system(&BaseSystem::default())
    }
}

/// Alias to canonical over the full dialect, sorted keys.
fn build_aliases() -> BTreeMap<String, String> {
    canon::ALIASES
        .iter()
        .map(|alias| (alias.alias.to_string(), alias.canonical.to_string()))
        .collect()
}

/// Canonical to class prefix, only where the prefix is not the kebab name.
/// The fallback order is table hit, then `--*` verbatim, then kebab.
fn build_prefixes() -> BTreeMap<String, String> {
    canon::CANONICAL_PROPERTIES
        .iter()
        .filter(|prop| prop.class_prefix != kebab_case(prop.name))
        .map(|prop| (prop.name.to_string(), prop.class_prefix.to_string()))
        .collect()
}

/// Keyword sets the procedures consult, sorted for stable bytes.
fn build_keywords() -> BTreeMap<String, Vec<String>> {
    let mut keywords = BTreeMap::new();
    keywords.insert("borderStyle".to_string(), sorted_set(parser::BORDER_STYLES));
    let mut outline = vec![parser::OUTLINE_STYLE_EXTRA];
    outline.extend(parser::BORDER_STYLES.iter());
    keywords.insert("outlineStyle".to_string(), sorted_set(&outline));
    keywords.insert(
        "lineWidth".to_string(),
        sorted_set(parser::LINE_WIDTH_KEYWORDS),
    );
    keywords.insert("lengthUnits".to_string(), sorted_set(parser::LENGTH_UNITS));
    keywords.insert("mathFns".to_string(), sorted_set(parser::MATH_FUNCTIONS));
    keywords.insert("cssWide".to_string(), sorted_set(parser::CSS_WIDE_KEYWORDS));
    keywords.insert(
        "zeroBorder".to_string(),
        sorted_set(border::ZERO_BORDER_VALUES),
    );
    keywords.insert(
        "unrealizable".to_string(),
        sorted_set(canon::UNREALIZABLE_EXTENSIONS),
    );
    keywords
}

/// Sorted copy of one keyword source set.
fn sorted_set(set: &[&str]) -> Vec<String> {
    let mut out: Vec<String> = set.iter().map(|name| (*name).to_string()).collect();
    out.sort();
    out
}

/// Weight keyword pairs in source order.
fn build_weight_keywords() -> Vec<(String, String)> {
    weight::CSS_WEIGHT_KEYWORDS
        .iter()
        .map(|(name, value)| ((*name).to_string(), (*value).to_string()))
        .collect()
}

/// Declared breakpoint widths from the scale, post-`into_px` verbatim.
/// Names without a width stay absent; the map sorts for stable bytes.
fn build_breakpoint_widths(system: &BaseSystem) -> BTreeMap<String, String> {
    let scale = system.breakpoints();
    scale
        .names()
        .iter()
        .filter_map(|name| {
            scale
                .width_px(name)
                .map(|width| (name.clone(), width.to_string()))
        })
        .collect()
}

/// Authored condition keys plus their underscore twins, unioned with
/// both preset spellings and sorted. Mirrors the dual-key lookup's known
/// set verbatim, so the runtime tests the request exactly.
fn build_conditions(system: &BaseSystem) -> Vec<String> {
    let mut names = std::collections::BTreeSet::new();
    for key in system.conditions.keys() {
        names.insert(key.to_string());
        names.insert(twin_key(key));
    }
    for (name, _) in PRESETS {
        names.insert((*name).to_string());
        names.insert(format!("_{name}"));
    }
    names.into_iter().collect()
}

/// The underscore twin `ConditionMap::get` answers: strip one leading
/// `_` when present, else prepend one. Mirrors `insert_twin`.
fn twin_key(key: &str) -> String {
    if let Some(stripped) = key.strip_prefix('_') {
        return stripped.to_string();
    }
    format!("_{key}")
}

/// Font rows with the precomputed default weight and ordered extras.
fn build_fonts(system: &BaseSystem) -> BTreeMap<String, FontTable> {
    system
        .fonts()
        .iter()
        .map(|(name, def)| {
            let table = FontTable {
                weight: family::default_weight(def).to_string(),
                weights: def
                    .weights
                    .iter()
                    .map(|(key, value)| (key.clone(), value.clone()))
                    .collect(),
                css: def
                    .css
                    .iter()
                    .map(|(key, value)| (key.clone(), value.clone()))
                    .collect(),
            };
            (name.clone(), table)
        })
        .collect()
}

/// Vendor prefixes that take a leading dash in the kebab fallback.
const VENDOR_PREFIXES: &[&str] = &["moz", "webkit", "ms", "o"];

/// camelCase to kebab with a leading dash for vendor-prefixed names.
fn kebab_case(name: &str) -> String {
    let mut out = String::with_capacity(name.len() + 4);
    if is_vendor_prefixed(name) {
        out.push('-');
    }
    for (index, ch) in name.chars().enumerate() {
        if ch.is_ascii_uppercase() {
            if index > 0 {
                out.push('-');
            }
            out.push(ch.to_ascii_lowercase());
        } else {
            out.push(ch);
        }
    }
    out
}

/// True when the name opens with a vendor prefix plus an uppercase letter.
fn is_vendor_prefixed(name: &str) -> bool {
    VENDOR_PREFIXES.iter().any(|prefix| {
        name.len() > prefix.len()
            && name.starts_with(prefix)
            && name[prefix.len()..].starts_with(|c: char| c.is_ascii_uppercase())
    })
}

#[cfg(test)]
mod tests;
