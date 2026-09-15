//! Readable class spelling for closed `recipe()` variants.
//! Utility atoms keep using `stylesheet::name`. These names are only for
//! recipe tables: the stem, `--key_value` leaves, and `--compound-...`
//! matches. They are never hashed whole-object classes.

use indexmap::IndexMap;

/// CSS class stem: explicit `className`, else the const binding, else `recipe`.
pub fn stem(class_name: Option<&str>, binding: Option<&str>) -> String {
    if let Some(name) = non_empty(class_name) {
        return name.to_string();
    }
    if let Some(name) = non_empty(binding) {
        return name.to_string();
    }
    "recipe".to_string()
}

/// `button--variant_solid` for one declared variant value.
pub fn variant_class(stem: &str, key: &str, value: &str) -> String {
    format!("{stem}--{key}_{value}")
}

/// `button--compound-variant_solid` (keys in source order). Distinct from variant leaves.
pub fn compound_class(stem: &str, props: &IndexMap<String, String>) -> String {
    let mut out = format!("{stem}--compound");
    for (key, value) in props {
        out.push('-');
        out.push_str(key);
        out.push('_');
        out.push_str(value);
    }
    out
}

fn non_empty(value: Option<&str>) -> Option<&str> {
    value.filter(|name| !name.is_empty())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn stem_prefers_class_name_then_binding() {
        assert_eq!(stem(Some("button"), Some("badge")), "button");
        assert_eq!(stem(None, Some("badge")), "badge");
        assert_eq!(stem(Some(""), Some("badge")), "badge");
        assert_eq!(stem(None, None), "recipe");
    }

    #[test]
    fn variant_and_compound_spelling() {
        assert_eq!(variant_class("button", "variant", "solid"), "button--variant_solid");
        let mut props = IndexMap::new();
        props.insert("variant".into(), "solid".into());
        props.insert("size".into(), "sm".into());
        assert_eq!(
            compound_class("button", &props),
            "button--compound-variant_solid-size_sm"
        );
    }
}
