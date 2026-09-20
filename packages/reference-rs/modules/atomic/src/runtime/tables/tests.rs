//! Namer table census: versions, lookups, scale, and font rows.
//!
//! Pins the rules-version both namers carry, the alias/prefix census over
//! the dialect, the sorted keyword sets, the verbatim breakpoint names
//! with their declared-only widths, the condition union, and the font
//! default-weight rows the interpreter reads at runtime.

use super::*;

#[test]
fn rules_version_matches_js_pin() {
    assert_eq!(NAMER_RULES_VERSION, 3);
    let tables = NamerTables::for_system(BaseSystem::lib_fixture());
    assert_eq!(tables.rules_version, 3);
}

#[test]
fn aliases_cover_the_dialect() {
    let tables = NamerTables::for_system(BaseSystem::lib_fixture());
    assert_eq!(tables.aliases.len(), 315);
    assert_eq!(tables.aliases["p"], "padding");
    assert_eq!(tables.aliases["MozAnimation"], "mozAnimation");
}

#[test]
fn prefixes_hold_non_kebab_only() {
    let tables = NamerTables::for_system(BaseSystem::lib_fixture());
    assert_eq!(tables.prefixes.len(), 198);
    assert_eq!(
        tables.prefixes["msScrollLimitXMax"],
        "-ms-scroll-limit-xmax"
    );
    assert_eq!(
        tables.prefixes["msScrollbar3dlightColor"],
        "-ms-scrollbar-3dlight-color"
    );
    assert!(!tables.prefixes.contains_key("mozAnimation"));
    assert!(!tables.prefixes.contains_key("top"));
    assert_eq!(tables.prefixes["marginTop"], "mt");
}

#[test]
fn every_canon_prefix_resolves_through_table_or_kebab() {
    let tables = NamerTables::for_system(BaseSystem::lib_fixture());
    for prop in canon::CANONICAL_PROPERTIES {
        let resolved = tables
            .prefixes
            .get(prop.name)
            .cloned()
            .unwrap_or_else(|| kebab_case(prop.name));
        assert_eq!(resolved, prop.class_prefix, "{}", prop.name);
    }
}

#[test]
fn color_props_match_canon_sorted() {
    let tables = NamerTables::for_system(BaseSystem::lib_fixture());
    assert_eq!(tables.color_props.len(), 71);
    let mut sorted = tables.color_props.clone();
    sorted.sort();
    assert_eq!(tables.color_props, sorted);
}

#[test]
fn keyword_sets_come_from_gate_consts_sorted() {
    let tables = NamerTables::for_system(BaseSystem::lib_fixture());
    let keywords = &tables.keywords;
    assert_eq!(
        keywords.keys().collect::<Vec<_>>(),
        [
            "borderStyle",
            "cssWide",
            "lengthUnits",
            "lineWidth",
            "mathFns",
            "outlineStyle",
            "unrealizable",
            "zeroBorder",
        ]
    );
    assert_eq!(keywords["borderStyle"].len(), 10);
    assert_eq!(keywords["outlineStyle"].len(), 11);
    assert!(keywords["outlineStyle"].contains(&"auto".to_string()));
    assert_eq!(keywords["lineWidth"], vec!["medium", "thick", "thin"]);
    assert_eq!(
        keywords["zeroBorder"],
        vec!["0", "0%", "0em", "0px", "0rem"]
    );
    assert_eq!(keywords["unrealizable"].len(), 27);
    for set in keywords.values() {
        let mut sorted = set.clone();
        sorted.sort();
        assert_eq!(set, &sorted);
    }
}

#[test]
fn weight_keywords_keep_table_pairs() {
    let tables = NamerTables::for_system(BaseSystem::lib_fixture());
    let pairs: Vec<(&str, &str)> = tables
        .weight_keywords
        .iter()
        .map(|(name, value)| (name.as_str(), value.as_str()))
        .collect();
    assert_eq!(
        pairs,
        [
            ("thin", "100"),
            ("light", "300"),
            ("normal", "400"),
            ("semibold", "600"),
            ("bold", "700"),
            ("black", "900"),
        ]
    );
}

#[test]
fn breakpoints_ship_verbatim_with_base() {
    let tables = NamerTables::for_system(BaseSystem::lib_fixture());
    let names: Vec<&str> = tables.breakpoints.iter().map(String::as_str).collect();
    assert_eq!(names, ["base", "sm", "md", "lg", "xl", "2xl"]);
}

#[test]
fn breakpoint_widths_ship_declared_only() {
    let tables = NamerTables::for_system(BaseSystem::lib_fixture());
    assert_eq!(tables.breakpoint_widths["sm"], "640");
    assert_eq!(tables.breakpoint_widths["2xl"], "1536");
    assert!(!tables.breakpoint_widths.contains_key("base"));
    let empty = NamerTables::for_system(&BaseSystem::default());
    assert!(empty.breakpoint_widths.is_empty());
}

#[test]
fn conditions_union_system_and_presets() {
    let tables = NamerTables::for_system(BaseSystem::lib_fixture());
    assert!(tables.conditions.contains(&"hover".to_string()));
    assert!(tables.conditions.contains(&"osDark".to_string()));
    assert!(tables.conditions.contains(&"dark".to_string()));
    assert!(!tables.conditions.iter().any(|name| name.starts_with('_')));
    let mut sorted = tables.conditions.clone();
    sorted.sort();
    assert_eq!(tables.conditions, sorted);
}

#[test]
fn fonts_carry_default_weight_and_ordered_extras() {
    let tables = NamerTables::for_system(BaseSystem::lib_fixture());
    let sans = &tables.fonts["sans"];
    assert_eq!(sans.weight, "normal");
    assert!(sans.weights.contains_key("normal"));
    let keys: Vec<&str> = sans.css.iter().map(|(key, _)| key.as_str()).collect();
    assert!(keys.contains(&"fontWeight"));
}
