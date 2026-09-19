//! Bare-specifier shapes and `package.json` `exports` mapping (SITE-54 slice).
//! Splits `pkg`, `pkg/sub`, and `@scope/pkg/sub` into package plus subpath,
//! then maps the subpath through the manifest's `exports` field (conditions
//! in `types`, `import`, `default` order, `*` patterns substituted once).
//! Manifest text arrives from the caller; this module never touches the
//! filesystem, so virtual and disk compiles share one mapping.

/// Split a bare specifier into package plus subpath (`.` for the root).
/// Relative and absolute specifiers yield None — the relative seam owns them.
pub(crate) fn split_bare(specifier: &str) -> Option<(String, String)> {
    if specifier.is_empty() || specifier.starts_with('.') || specifier.starts_with('/') {
        return None;
    }
    let mut parts = specifier.split('/');
    let first = parts.next()?;
    let package = if first.starts_with('@') {
        format!("{first}/{}", parts.next()?)
    } else {
        first.to_string()
    };
    let rest: Vec<&str> = parts.collect();
    let subpath = if rest.is_empty() {
        ".".to_string()
    } else {
        format!("./{}", rest.join("/"))
    };
    Some((package, subpath))
}

/// Map one subpath through a manifest's `exports`, or None when unmapped.
pub(crate) fn export_target_for_manifest(manifest: &str, subpath: &str) -> Option<String> {
    let json: serde_json::Value = serde_json::from_str(manifest).ok()?;
    export_target(json.get("exports")?, subpath)
}

/// The file target for one subpath through string, array, or object exports.
fn export_target(exports: &serde_json::Value, subpath: &str) -> Option<String> {
    match exports {
        serde_json::Value::String(target) => string_target(target, subpath),
        serde_json::Value::Array(list) => array_target(list, subpath),
        serde_json::Value::Object(map) => object_target(map, subpath),
        _ => None,
    }
}

/// A string exports map applies to the root subpath only.
fn string_target(target: &str, subpath: &str) -> Option<String> {
    (subpath == ".").then(|| target.to_string())
}

/// An array exports map applies to the root subpath only.
fn array_target(list: &[serde_json::Value], subpath: &str) -> Option<String> {
    if subpath == "." {
        first_string(list)
    } else {
        None
    }
}

/// Follow an object exports map: exact subpath, then `*` patterns, else None.
fn object_target(
    map: &serde_json::Map<String, serde_json::Value>,
    subpath: &str,
) -> Option<String> {
    if let Some(value) = map.get(subpath) {
        return condition_target(value);
    }
    for (pattern, value) in map {
        if let Some(star) = match_pattern(pattern, subpath) {
            if let Some(target) = condition_target(value) {
                return Some(target.replacen('*', star.as_str(), 1));
            }
        }
    }
    // Bare condition maps (`{"import": …, "default": …}`) apply to "." only.
    if subpath == "." && map.keys().any(|k| !k.starts_with('.')) {
        return condition_target(&serde_json::Value::Object(map.clone()));
    }
    None
}

/// Match one `*` exports pattern against a subpath, returning the star span.
fn match_pattern(pattern: &str, subpath: &str) -> Option<String> {
    let (before, after) = pattern.split_once('*')?;
    let rest = subpath.strip_prefix(before)?;
    if after.is_empty() {
        return Some(rest.to_string());
    }
    let star = rest.strip_suffix(after)?;
    Some(star.to_string())
}

/// Unwrap condition maps in `types`, `import`, `default` order to one file.
fn condition_target(value: &serde_json::Value) -> Option<String> {
    match value {
        serde_json::Value::String(target) => Some(target.clone()),
        serde_json::Value::Array(list) => first_string(list),
        serde_json::Value::Object(map) => condition_object(map),
        _ => None,
    }
}

/// The first condition entry that unwraps to a file, in priority order.
fn condition_object(map: &serde_json::Map<String, serde_json::Value>) -> Option<String> {
    ["types", "import", "default"]
        .iter()
        .find_map(|condition| map.get(*condition).and_then(condition_target))
}

/// The first string of an exports array, if any entry is a plain string.
fn first_string(list: &[serde_json::Value]) -> Option<String> {
    list.iter().find_map(|v| match v {
        serde_json::Value::String(s) => Some(s.clone()),
        _ => None,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn splits_scoped_and_bare_specifiers() {
        assert_eq!(split_bare("pkg"), Some(("pkg".into(), ".".into())));
        assert_eq!(
            split_bare("pkg/sub/deep"),
            Some(("pkg".into(), "./sub/deep".into()))
        );
        assert_eq!(
            split_bare("@scope/pkg/sub"),
            Some(("@scope/pkg".into(), "./sub".into()))
        );
        assert_eq!(split_bare("./rel"), None);
        assert_eq!(split_bare("@scope"), None);
    }

    #[test]
    fn exports_map_prefers_types_over_default() {
        let exports = serde_json::from_str(
            r#"{"./tokens": {"default": "./a.ts", "types": "./b.ts"}}"#,
        )
        .unwrap();
        assert_eq!(export_target(&exports, "./tokens"), Some("./b.ts".into()));
        assert_eq!(export_target(&exports, "./missing"), None);
    }

    #[test]
    fn manifest_mapping_round_trips() {
        let manifest = r#"{"name":"p","exports":{".":"./index.ts"}}"#;
        assert_eq!(
            export_target_for_manifest(manifest, "."),
            Some("./index.ts".into())
        );
        assert_eq!(export_target_for_manifest(manifest, "./x"), None);
        assert_eq!(export_target_for_manifest("nope", "."), None);
    }

    #[test]
    fn star_patterns_substitute_once() {
        assert_eq!(match_pattern("./*", "./tokens"), Some("tokens".into()));
        assert_eq!(match_pattern("./a", "./b"), None);
    }
}
