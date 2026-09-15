//! Lowers `BaseSystem.static_css` into wants before resolve.
//!
//! This is the third want source beside JSX StyleProps and `css()`. Each
//! property maps to a token list or `['*']`. A wildcard enumerates every token
//! in the property's category (color props → `colors`) using the dump's
//! insertion order. Listed values become the same `Want` shape extract would
//! have pushed. Emit does not expand; AtomSet is the only dedup.

use base_system::BaseSystem;

use crate::atom::{AtomValue, Want};

const STATIC_ORIGIN: &str = "staticCss";

/// Append staticCss wants onto the shared want list.
pub fn append_wants(system: &BaseSystem, wants: &mut Vec<Want>) {
    for (prop, values) in &system.static_css {
        append_prop(system, wants, prop, values);
    }
}

fn append_prop(system: &BaseSystem, wants: &mut Vec<Want>, prop: &str, values: &[String]) {
    if values.iter().any(|value| value == "*") {
        append_wildcard(system, wants, prop);
        return;
    }
    for value in values {
        push_want(wants, prop, value);
    }
}

fn append_wildcard(system: &BaseSystem, wants: &mut Vec<Want>, prop: &str) {
    let Some(category) = wildcard_category(prop) else {
        return;
    };
    for (key, entry) in system.tokens.iter() {
        if entry.category == category {
            push_want(wants, prop, authored_path(key, category));
        }
    }
}

fn wildcard_category(prop: &str) -> Option<&'static str> {
    if canon::is_color_prop(prop) {
        Some("colors")
    } else {
        None
    }
}

fn authored_path<'a>(key: &'a str, category: &str) -> &'a str {
    key.strip_prefix(category)
        .and_then(|rest| rest.strip_prefix('.'))
        .unwrap_or(key)
}

fn push_want(wants: &mut Vec<Want>, prop: &str, value: &str) {
    wants.push(Want::new(prop, AtomValue::String(value.into())).with_origin(Some(STATIC_ORIGIN)));
}

#[cfg(test)]
mod tests {
    use super::*;
    use base_system::TokenLeaf;

    fn color_dump() -> BaseSystem {
        let mut system = BaseSystem::default();
        for (path, light, dark) in [
            ("n100", "#f4f4f5", "#18181b"),
            ("n200", "#e4e4e7", "#27272a"),
            ("n300", "#d4d4d8", "#3f3f46"),
        ] {
            system.tokens.insert_leaf(TokenLeaf {
                category: "colors",
                path,
                light,
                dark,
            });
        }
        system.tokens.insert_leaf(TokenLeaf {
            category: "radii",
            path: "md",
            light: "0.4rem",
            dark: "0.4rem",
        });
        system
    }

    fn values_for<'a>(wants: &'a [Want], prop: &str) -> Vec<&'a str> {
        wants
            .iter()
            .filter(|want| &*want.prop == prop)
            .map(|want| want.value.class_name_str())
            .collect()
    }

    #[test]
    fn wildcard_enumerates_color_tokens_not_radii() {
        let mut system = color_dump();
        system.static_css.insert("color".into(), vec!["*".into()]);
        let mut wants = Vec::new();
        append_wants(&system, &mut wants);
        assert_eq!(values_for(&wants, "color"), ["n100", "n200", "n300"]);
        assert!(values_for(&wants, "borderRadius").is_empty());
        assert!(wants
            .iter()
            .all(|want| want.origin.as_deref() == Some(STATIC_ORIGIN)));
    }

    #[test]
    fn listed_values_become_authored_wants() {
        let mut system = color_dump();
        system
            .static_css
            .insert("bg".into(), vec!["n100".into(), "n200".into()]);
        let mut wants = Vec::new();
        append_wants(&system, &mut wants);
        assert_eq!(values_for(&wants, "bg"), ["n100", "n200"]);
    }

    #[test]
    fn empty_bag_is_a_no_op() {
        let mut wants = Vec::new();
        append_wants(&color_dump(), &mut wants);
        assert!(wants.is_empty());
    }
}
