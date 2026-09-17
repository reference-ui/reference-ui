//! Deterministic class name generation for closed component recipes.
//! Translates recipe stems, variant axes, and compound selections into qualified class strings.
//! Produces scoped base, variant, and compound selectors isolated from utility atoms.
//! Variant and compound suffixes preserve authored predicates without runtime re-evaluation.

use indexmap::IndexMap;

/// Qualified recipe identity: `${system}__${class_name}`.
pub fn qualified_stem(system: &str, class_name: &str) -> String {
    if system.is_empty() {
        class_name.to_string()
    } else {
        format!("{system}__{class_name}")
    }
}

/// Qualified base class name: `${stem}__base`.
pub fn base_class(stem: &str) -> String {
    format!("{stem}__base")
}

/// Variant class name: `${stem}_${key_prefix}_${value}`.
pub fn variant_class(stem: &str, key: &str, value: &str) -> String {
    let prefix = key.chars().next().unwrap_or('v');
    format!("{stem}_{prefix}_{value}")
}

/// Responsive variant class name: `${breakpoint}:${variant_class}`.
///
/// The breakpoint segment is a literal prefix, not a re-resolution: the rule
/// carrying this class is wrapped in that breakpoint's `@container` query so
/// a runtime `{ base, md }` selection paints by emitting both classes.
pub fn responsive_variant_class(breakpoint: &str, stem: &str, key: &str, value: &str) -> String {
    format!("{breakpoint}:{}", variant_class(stem, key, value))
}

/// Compound class name: `${stem}_c_${segments}`.
pub fn compound_class(stem: &str, predicates: &IndexMap<String, Vec<String>>) -> String {
    let mut segments = Vec::new();
    for (key, values) in predicates {
        if values.as_slice() == ["true"] {
            segments.push(key.clone());
        } else {
            segments.push(values.join("_"));
        }
    }
    if segments.is_empty() {
        format!("{stem}_c")
    } else {
        format!("{stem}_c_{}", segments.join("_"))
    }
}

/// Convenience helper for compound props with single string values.
pub fn compound_class_from_props(stem: &str, props: &IndexMap<String, String>) -> String {
    let mut predicates = IndexMap::new();
    for (k, v) in props {
        predicates.insert(k.clone(), vec![v.clone()]);
    }
    compound_class(stem, &predicates)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn qualified_stem_combines_system_and_class_name() {
        assert_eq!(
            qualified_stem("lib-test-system", "button"),
            "lib-test-system__button"
        );
        assert_eq!(qualified_stem("", "button"), "button");
    }

    #[test]
    fn base_class_appends_base_suffix() {
        assert_eq!(
            base_class("lib-test-system__button"),
            "lib-test-system__button__base"
        );
    }

    #[test]
    fn variant_and_compound_spelling() {
        assert_eq!(
            variant_class("lib-test-system__button", "variant", "solid"),
            "lib-test-system__button_v_solid"
        );
        assert_eq!(
            variant_class("lib-test-system__button", "disabled", "true"),
            "lib-test-system__button_d_true"
        );

        let mut predicates = IndexMap::new();
        predicates.insert("variant".into(), vec!["solid".into()]);
        predicates.insert("disabled".into(), vec!["true".into()]);
        assert_eq!(
            compound_class("lib-test-system__button", &predicates),
            "lib-test-system__button_c_solid_disabled"
        );
    }

    #[test]
    fn responsive_variant_prefixes_breakpoint() {
        assert_eq!(
            responsive_variant_class("md", "lib-test-system__button", "variant", "outline"),
            "md:lib-test-system__button_v_outline"
        );
    }
}
