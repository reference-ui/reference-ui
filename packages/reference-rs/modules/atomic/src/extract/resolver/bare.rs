//! Bare-specifier candidates for the binding walk (SPEC-V2-76, SITE-54 slice).
//! Turns `pkg/sub` and `@/tokens` into the ordered paths the walk probes
//! against the source set: `tsconfig` `paths`/`baseUrl` first, then ancestor
//! `node_modules` with `package.json` `exports` mapping ahead of direct
//! subpaths. Manifests and tsconfigs read from disk opportunistically, so
//! virtual compiles without a filesystem still probe direct `node_modules`
//! candidates. Every candidate normalizes lexically to match graph keys.

/// Ordered probe candidates for a bare specifier authored in `from_file`.
/// Relative specifiers yield nothing here — the relative seam owns them.
pub fn candidates(from_file: &str, specifier: &str) -> Vec<String> {
    if specifier.starts_with('.') {
        return Vec::new();
    }
    let mut out = Vec::new();
    for base in tsconfig_bases(from_file, specifier) {
        push_probed(&mut out, &base);
    }
    for base in node_bases(from_file, specifier) {
        push_probed(&mut out, &base);
    }
    out
}

/// `tsconfig` target bases for a specifier, via the nearest config upward.
fn tsconfig_bases(from_file: &str, specifier: &str) -> Vec<String> {
    let Some((text, dir)) = find_tsconfig(&dir_of(from_file)) else {
        return Vec::new();
    };
    let Some(tsconfig) = super::tsconfig::parse_text(&text, &dir) else {
        return Vec::new();
    };
    tsconfig
        .candidates(specifier)
        .iter()
        .map(|base| normalize_joined(&base.to_string_lossy()))
        .collect()
}

/// `node_modules` bases nearest-first: exports-mapped, then direct subpaths.
fn node_bases(from_file: &str, specifier: &str) -> Vec<String> {
    let Some((package, subpath)) = super::package::split_bare(specifier) else {
        return Vec::new();
    };
    let mut out = Vec::new();
    for dir in ancestors(&dir_of(from_file)) {
        let pkg_dir = format!("{dir}/node_modules/{package}");
        if let Some(mapped) = exports_mapped(&pkg_dir, &subpath) {
            out.push(normalize_joined(&mapped));
        }
        if subpath == "." {
            out.push(normalize_joined(&pkg_dir));
        } else {
            out.push(normalize_joined(&format!(
                "{pkg_dir}/{}",
                subpath.trim_start_matches("./")
            )));
        }
    }
    out
}

/// The exports-mapped file for one package dir and subpath, if mapped.
fn exports_mapped(pkg_dir: &str, subpath: &str) -> Option<String> {
    let text = std::fs::read_to_string(format!("{pkg_dir}/package.json")).ok()?;
    let target = super::package::export_target_for_manifest(&text, subpath)?;
    Some(format!("{pkg_dir}/{}", target.trim_start_matches("./")))
}

/// Nearest `tsconfig.json` walking up from a dir: its text plus home dir.
fn find_tsconfig(from_dir: &str) -> Option<(String, String)> {
    for dir in ancestors(from_dir) {
        let path = format!("{dir}/tsconfig.json");
        if let Ok(text) = std::fs::read_to_string(&path) {
            return Some((text, dir));
        }
    }
    None
}

/// A dir plus its ancestors up to the filesystem root, nearest first.
fn ancestors(dir: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut cursor = dir.to_string();
    for _ in 0..32 {
        out.push(cursor.clone());
        match cursor.rfind('/') {
            Some(0) => {
                out.push("/".to_string());
                break;
            }
            Some(idx) => cursor.truncate(idx),
            None => break,
        }
    }
    out
}

/// Directory of a source path, without the trailing slash.
fn dir_of(path: &str) -> String {
    path.rfind('/').map_or_else(String::new, |idx| {
        if idx == 0 {
            "/".to_string()
        } else {
            path[..idx].to_string()
        }
    })
}

/// Push one base plus its extension and index probes, deduped in order.
fn push_probed(out: &mut Vec<String>, base: &str) {
    for candidate in probes(base) {
        if !out.contains(&candidate) {
            out.push(candidate);
        }
    }
}

/// The bare base, four extensions, and three index spellings, in order.
fn probes(base: &str) -> Vec<String> {
    let mut out = Vec::with_capacity(8);
    out.push(base.to_string());
    for ext in ["ts", "tsx", "js", "jsx"] {
        out.push(format!("{base}.{ext}"));
    }
    for index in ["index.ts", "index.tsx", "index.js"] {
        out.push(format!("{base}/{index}"));
    }
    out
}

/// Lexically normalize a joined path: collapse dots, keep the anchor.
pub(crate) fn normalize_joined(path: &str) -> String {
    let mut parts: Vec<&str> = Vec::new();
    for segment in path.split('/') {
        push_segment(&mut parts, segment);
    }
    join_parts(path, &parts)
}

/// Fold one path segment into the normalized prefix.
fn push_segment<'a>(parts: &mut Vec<&'a str>, segment: &'a str) {
    match segment {
        "" | "." => {}
        ".." => {
            parts.pop();
        }
        keep => parts.push(keep),
    }
}

/// Join normalized segments, restoring the anchor and the empty path.
fn join_parts(path: &str, parts: &[&str]) -> String {
    let mut joined = parts.join("/");
    if path.starts_with('/') {
        joined.insert(0, '/');
    }
    if joined.is_empty() {
        joined.push('.');
    }
    joined
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn relative_specifiers_stay_empty() {
        assert!(candidates("/p/src/a.ts", "./b").is_empty());
        assert!(candidates("/p/src/a.ts", "../b").is_empty());
    }

    #[test]
    fn node_candidates_walk_ancestors_nearest_first() {
        let got = candidates("/p/src/a.ts", "pkg/sub");
        assert!(got.contains(&"/p/src/node_modules/pkg/sub.ts".to_string()));
        assert!(got.contains(&"/p/node_modules/pkg/sub.ts".to_string()));
        let near = got
            .iter()
            .position(|c| c == "/p/src/node_modules/pkg/sub.ts")
            .unwrap();
        let far = got
            .iter()
            .position(|c| c == "/p/node_modules/pkg/sub.ts")
            .unwrap();
        assert!(near < far);
    }

    #[test]
    fn normalize_collapses_dots() {
        assert_eq!(normalize_joined("/r/./src/tokens"), "/r/src/tokens");
        assert_eq!(normalize_joined("/r/a/../b"), "/r/b");
    }
}
