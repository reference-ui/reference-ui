//! Category-relative token unions plus the aggregate `Tokens` index.
//! Walks `tokens.iter()`, strips the spec category prefix so
//! `colors.brand.primary` becomes `brand.primary`, and emits sorted unique
//! string-literal unions. Unknown spec categories are skipped. Empty
//! categories are omitted rather than printed as `never`.

use super::ts::join_union;
use base_system::BaseSystem;
use std::collections::{BTreeMap, BTreeSet};

struct CategorySpec {
    category: &'static str,
    ts_type: &'static str,
}

/// Spec category names as `from_json` stores them, mapped to SPEC type aliases.
const CATEGORIES: &[CategorySpec] = &[
    CategorySpec {
        category: "colors",
        ts_type: "ColorToken",
    },
    CategorySpec {
        category: "spacing",
        ts_type: "SpacingToken",
    },
    CategorySpec {
        category: "radii",
        ts_type: "RadiusToken",
    },
    CategorySpec {
        category: "fontSizes",
        ts_type: "FontSizeToken",
    },
    CategorySpec {
        category: "fontWeights",
        ts_type: "FontWeightToken",
    },
    CategorySpec {
        category: "lineHeights",
        ts_type: "LineHeightToken",
    },
    CategorySpec {
        category: "shadows",
        ts_type: "ShadowToken",
    },
    CategorySpec {
        category: "zIndex",
        ts_type: "ZIndexToken",
    },
];

pub(super) fn token_unions(system: &BaseSystem) -> String {
    let grouped = group_literals(system);
    let mut out = String::new();
    let mut fields = Vec::new();
    for spec in CATEGORIES {
        let Some(lits) = grouped.get(spec.category) else {
            continue;
        };
        if !out.is_empty() {
            out.push('\n');
        }
        push_alias(&mut out, spec.ts_type, lits);
        fields.push(spec);
    }
    push_tokens_interface(&mut out, &fields);
    out
}

fn group_literals(system: &BaseSystem) -> BTreeMap<&'static str, BTreeSet<String>> {
    let mut grouped: BTreeMap<&'static str, BTreeSet<String>> = BTreeMap::new();
    for (key, entry) in system.tokens.iter() {
        let Some(spec) = spec_for(entry.category()) else {
            continue;
        };
        grouped
            .entry(spec.category)
            .or_default()
            .insert(relative_path(key, spec.category).to_string());
    }
    grouped
}

fn spec_for(category: &str) -> Option<&'static CategorySpec> {
    CATEGORIES.iter().find(|spec| spec.category == category)
}

fn relative_path<'a>(key: &'a str, category: &str) -> &'a str {
    key.strip_prefix(category)
        .and_then(|rest| rest.strip_prefix('.'))
        .unwrap_or(key)
}

fn push_alias(out: &mut String, name: &str, lits: &BTreeSet<String>) {
    out.push_str("export type ");
    out.push_str(name);
    out.push_str(" = ");
    out.push_str(&join_union(lits));
    out.push_str(";\n");
}

fn push_tokens_interface(out: &mut String, fields: &[&CategorySpec]) {
    if fields.is_empty() {
        return;
    }
    if !out.is_empty() {
        out.push('\n');
    }
    out.push_str("export interface Tokens {\n");
    for spec in fields {
        out.push_str("  ");
        out.push_str(spec.category);
        out.push_str(": ");
        out.push_str(spec.ts_type);
        out.push_str(";\n");
    }
    out.push_str("}\n");
}
