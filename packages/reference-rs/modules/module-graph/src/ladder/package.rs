//! Bare-specifier shapes and `package.json` entry mapping for node packages.
//!
//! Splits `pkg`, `pkg/sub`, and `@scope/pkg/sub` into package plus subpath,
//! then maps the subpath through the manifest's `exports` field (exact keys,
//! `*` patterns substituted once, condition maps expanded in `types`,
//! `import`, `default`, `require` order). Manifest text arrives from the
//! caller; this module never touches the filesystem. Targets come back as an
//! ordered list so the ladder can fall through to the next entry when the
//! first names a file that is not on disk.

/// Condition names in priority order: types first, `require` last.
const CONDITIONS: [&str; 4] = ["types", "import", "default", "require"];

/// Root entry fields in priority order: tasty's order verbatim.
const ROOT_FIELDS: [&str; 4] = ["types", "typings", "module", "main"];

/// Split a bare specifier into package plus subpath (`.` for the root).
/// Relative, absolute, and empty specifiers yield None.
pub(crate) fn split_bare(specifier: &str) -> Option<(String, String)> {
    if specifier.is_empty() || specifier.starts_with('.') || specifier.starts_with('/') {
        return None;
    }
    let mut parts = specifier.split('/');
    let first = parts.next()?;
    let package = if first.starts_with('@') {
        let second = parts.next()?;
        super::join_with(first, '/', second)
    } else {
        first.to_string()
    };
    let rest: Vec<&str> = parts.collect();
    let subpath = if rest.is_empty() {
        ".".to_string()
    } else {
        super::concat2("./", &rest.join("/"))
    };
    Some((package, subpath))
}

/// Ordered `exports` targets for one subpath, following exact keys first,
/// then `*` patterns, then bare condition maps for the root only.
pub(crate) fn export_targets(manifest: &str, subpath: &str) -> Vec<String> {
    let Ok(json) = serde_json::from_str::<serde_json::Value>(manifest) else {
        return Vec::new();
    };
    let Some(exports) = json.get("exports") else {
        return Vec::new();
    };
    match exports {
        serde_json::Value::String(target) => string_targets(target, subpath),
        serde_json::Value::Array(list) => array_targets(list, subpath),
        serde_json::Value::Object(map) => object_targets(map, subpath),
        _ => Vec::new(),
    }
}

/// Root entry targets: `types`, `typings`, `exports`("."), `module`,
/// `main` — tasty's manifest order, verbatim.
pub(crate) fn root_targets(manifest: &str) -> Vec<String> {
    let mut targets = field_entries(manifest, &ROOT_FIELDS[..2]);
    targets.extend(export_targets(manifest, "."));
    targets.extend(field_entries(manifest, &ROOT_FIELDS[2..]));
    targets
}

/// The string values of manifest `fields`, in order, skipping the missing.
fn field_entries(manifest: &str, fields: &[&str]) -> Vec<String> {
    let Ok(json) = serde_json::from_str::<serde_json::Value>(manifest) else {
        return Vec::new();
    };
    fields
        .iter()
        .filter_map(|field| json.get(*field).and_then(serde_json::Value::as_str))
        .map(str::to_string)
        .collect()
}

/// The `@types` package shadowing `package`: `@types/x`, or `@types/a__b`
/// for a scoped `@a/b`, per the DefinitelyTyped naming rule.
pub(crate) fn types_package_name(package: &str) -> String {
    match package.strip_prefix('@') {
        Some(rest) => match rest.split_once('/') {
            Some((scope, name)) => {
                let mut out =
                    String::with_capacity("@types/".len() + scope.len() + "__".len() + name.len());
                out.push_str("@types/");
                out.push_str(scope);
                out.push_str("__");
                out.push_str(name);
                out
            }
            None => super::concat2("@types/", rest),
        },
        None => super::concat2("@types/", package),
    }
}

/// A string exports map applies to the root subpath only.
fn string_targets(target: &str, subpath: &str) -> Vec<String> {
    if subpath == "." {
        vec![target.to_string()]
    } else {
        Vec::new()
    }
}

/// An array exports map applies to the root subpath only, expanded in order.
fn array_targets(list: &[serde_json::Value], subpath: &str) -> Vec<String> {
    if subpath == "." {
        expand_list(list)
    } else {
        Vec::new()
    }
}

/// Follow an object exports map: exact subpath, then `*` patterns, then bare
/// condition maps for the root only.
fn object_targets(map: &serde_json::Map<String, serde_json::Value>, subpath: &str) -> Vec<String> {
    if let Some(value) = map.get(subpath) {
        return expand_value(value);
    }
    for (pattern, value) in map {
        if let Some(star) = match_pattern(pattern, subpath) {
            let targets = expand_value(value);
            if !targets.is_empty() {
                return targets
                    .into_iter()
                    .map(|target| target.replacen('*', &star, 1))
                    .collect();
            }
        }
    }
    if subpath == "." && map.keys().any(|key| !key.starts_with('.')) {
        return expand_conditions(map);
    }
    Vec::new()
}

/// Match one `*` exports pattern against a subpath: the star span, if any.
fn match_pattern(pattern: &str, subpath: &str) -> Option<String> {
    let (before, after) = pattern.split_once('*')?;
    let rest = subpath.strip_prefix(before)?;
    if after.is_empty() {
        return Some(rest.to_string());
    }
    let star = rest.strip_suffix(after)?;
    Some(star.to_string())
}

/// Every file target a value position can name, in priority order.
fn expand_value(value: &serde_json::Value) -> Vec<String> {
    match value {
        serde_json::Value::String(target) => vec![target.clone()],
        serde_json::Value::Array(list) => expand_list(list),
        serde_json::Value::Object(map) => expand_conditions(map),
        _ => Vec::new(),
    }
}

/// Targets of an exports array, concatenated in order.
fn expand_list(list: &[serde_json::Value]) -> Vec<String> {
    list.iter().flat_map(expand_value).collect()
}

/// Targets of a condition map, in [`CONDITIONS`] order, recursing nested maps.
fn expand_conditions(map: &serde_json::Map<String, serde_json::Value>) -> Vec<String> {
    CONDITIONS
        .iter()
        .filter_map(|condition| map.get(*condition))
        .flat_map(expand_value)
        .collect()
}
