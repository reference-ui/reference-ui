//! Shared path and error helpers for resolver and analyzer modules.

use std::fs;
use std::fmt::{Display, Formatter};
use std::path::{Path, PathBuf};

const REFERENCE_STYLE_PROPS_ENTRY: &str = "packages/reference-core/src/types/style-props.ts";
const CORE_STYLE_PROPS_ENTRY: &str = "src/types/style-props.ts";
const CORE_PRIMITIVE_TAGS_ENTRY: &str = "src/system/primitives/tags.ts";
const STYLETRACE_WORKSPACE_ROOT_ENV: &str = "REFERENCE_STYLETRACE_WORKSPACE_ROOT";

#[derive(Debug, Clone)]
pub struct StyleTraceError {
    message: String,
}

impl StyleTraceError {
    pub(crate) fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
        }
    }
}

impl Display for StyleTraceError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.message)
    }
}

impl std::error::Error for StyleTraceError {}

pub(crate) fn resolve_workspace_root(
    start_path: &Path,
    workspace_hint: Option<&Path>,
) -> Result<PathBuf, StyleTraceError> {
    for candidate in workspace_root_candidates(start_path, workspace_hint) {
        if let Some(workspace_root) = find_workspace_root(&candidate) {
            return Ok(workspace_root);
        }
    }

    Err(StyleTraceError::new(format!(
        "could not resolve workspace root for {}",
        start_path.display()
    )))
}

fn workspace_root_candidates(start_path: &Path, workspace_hint: Option<&Path>) -> Vec<PathBuf> {
    let mut candidates = Vec::new();

    if let Ok(env_root) = std::env::var(STYLETRACE_WORKSPACE_ROOT_ENV) {
        if !env_root.trim().is_empty() {
            candidates.push(PathBuf::from(env_root));
        }
    }

    if let Some(workspace_hint) = workspace_hint {
        candidates.push(normalize_path(workspace_hint));
    }

    candidates.push(normalize_path(start_path));
    candidates
}

fn find_workspace_root(start_path: &Path) -> Option<PathBuf> {
    let mut current = if start_path.is_dir() {
        Some(start_path)
    } else {
        start_path.parent()
    };

    while let Some(path) = current {
        if path.join(REFERENCE_STYLE_PROPS_ENTRY).is_file() {
            return Some(canonicalize_existing_path(path));
        }
        if let Some(workspace_root) = derive_workspace_root_from_core_package(path) {
            return Some(workspace_root);
        }
        current = path.parent();
    }

    None
}

fn derive_workspace_root_from_core_package(path: &Path) -> Option<PathBuf> {
    if !path.join(CORE_STYLE_PROPS_ENTRY).is_file() || !path.join(CORE_PRIMITIVE_TAGS_ENTRY).is_file() {
        return None;
    }

    let package_name = path.file_name()?.to_string_lossy();
    let packages_dir = path.parent()?;
    if package_name != "reference-core" || packages_dir.file_name()?.to_string_lossy() != "packages" {
        return None;
    }

    Some(canonicalize_existing_path(packages_dir.parent()?))
}

fn canonicalize_existing_path(path: &Path) -> PathBuf {
    fs::canonicalize(path).unwrap_or_else(|_| normalize_path(path))
}

pub(crate) fn normalize_path(path: &Path) -> PathBuf {
    let mut normalized = PathBuf::new();
    for component in path.components() {
        normalized.push(component);
    }
    normalized
}

pub(crate) fn is_ignorable_module_specifier(specifier: &str) -> bool {
    specifier.starts_with("node:")
}

pub(crate) fn resolve_local_module_path(candidate: &Path) -> Option<PathBuf> {
    let direct_exts = ["", ".ts", ".tsx", ".d.ts", ".mts", ".d.mts"];
    for suffix in direct_exts {
        let path = if suffix.is_empty() {
            candidate.to_path_buf()
        } else {
            PathBuf::from(format!("{}{suffix}", candidate.display()))
        };
        if path.is_file() {
            return Some(path);
        }
    }

    if let Some(extension) = candidate.extension().and_then(|ext| ext.to_str()) {
        let stem = candidate.with_extension("");
        let mapped_exts: &[&str] = match extension {
            "js" => &[".mjs", ".d.ts", ".ts", ".tsx", ".mts", ".d.mts"],
            "mjs" => &[".js", ".d.mts", ".mts", ".d.ts", ".ts", ".tsx"],
            "cjs" => &[".js", ".mjs", ".d.ts", ".ts", ".tsx", ".mts", ".d.mts"],
            _ => &[],
        };

        for mapped_ext in mapped_exts {
            let path = PathBuf::from(format!("{}{mapped_ext}", stem.display()));
            if path.is_file() {
                return Some(path);
            }
        }
    }

    let index_files = [
        "index.ts",
        "index.tsx",
        "index.d.ts",
        "index.mts",
        "index.d.mts",
    ];
    for index_file in index_files {
        let path = candidate.join(index_file);
        if path.is_file() {
            return Some(path);
        }
    }

    None
}

pub(crate) fn prefer_workspace_source_module(
    resolved_path: &Path,
    workspace_root: &Path,
) -> PathBuf {
    let normalized = normalize_path(resolved_path);
    if !normalized.starts_with(workspace_root) {
        return normalized;
    }

    let Ok(relative) = normalized.strip_prefix(workspace_root) else {
        return normalized;
    };

    let components = relative
        .components()
        .map(|component| component.as_os_str().to_string_lossy().to_string())
        .collect::<Vec<_>>();

    let Some(dist_index) = components.iter().position(|component| component == "dist") else {
        return normalized;
    };

    let package_root = workspace_root.join(components[..dist_index].join("/"));
    if !package_root.join("package.json").is_file() || !package_root.join("src").is_dir() {
        return normalized;
    }

    let relative_dist_path = PathBuf::from_iter(components[dist_index + 1..].iter().map(String::as_str));
    let source_relative = strip_compiled_module_extension(&relative_dist_path);
    let source_candidate = package_root.join("src").join(source_relative);

    resolve_local_module_path(&source_candidate).unwrap_or(normalized)
}

fn strip_compiled_module_extension(path: &Path) -> PathBuf {
    let path_str = path.to_string_lossy();
    for suffix in [".d.ts", ".d.mts", ".mjs", ".js", ".cjs"] {
        if let Some(stripped) = path_str.strip_suffix(suffix) {
            return PathBuf::from(stripped);
        }
    }

    path.to_path_buf()
}

#[cfg(test)]
mod tests {
    use super::{
        canonicalize_existing_path, prefer_workspace_source_module, resolve_workspace_root,
    };
    use std::fs;
    use std::path::PathBuf;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn prefers_workspace_source_files_over_dist_outputs() {
        let stamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("expected current time")
            .as_nanos();
        let scratch = std::env::temp_dir().join(format!(
            "reference-rs-workspace-source-preference-{}-{stamp}",
            std::process::id()
        ));

        write_file(&scratch, "packages/icons/package.json", "{}\n");
        write_file(
            &scratch,
            "packages/icons/src/generated/passport.tsx",
            "export const x = 1\n",
        );
        write_file(
            &scratch,
            "packages/icons/dist/generated/passport.mjs",
            "export const x = 1\n",
        );

        let resolved = prefer_workspace_source_module(
            &scratch.join("packages/icons/dist/generated/passport.mjs"),
            &scratch,
        );

        assert_eq!(
            resolved,
            scratch.join("packages/icons/src/generated/passport.tsx")
        );

        let _ = fs::remove_dir_all(&scratch);
    }

    #[test]
    fn resolves_workspace_root_from_hint_for_vendored_layouts() {
        let stamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("expected current time")
            .as_nanos();
        let scratch = std::env::temp_dir().join(format!(
            "reference-rs-workspace-hint-{}-{stamp}",
            std::process::id()
        ));

        write_file(
            &scratch,
            "consumer-app/vendor/reference-ui/packages/reference-core/src/types/style-props.ts",
            "export type StyleProps = { color?: string }\n",
        );

        let resolved = resolve_workspace_root(
            &scratch.join("consumer-app/src"),
            Some(&scratch.join("consumer-app/vendor/reference-ui/packages/reference-core")),
        )
        .expect("expected vendored workspace root to resolve from hint");

        assert_eq!(resolved, canonicalize_existing_path(&scratch.join("consumer-app/vendor/reference-ui")));

        let _ = fs::remove_dir_all(&scratch);
    }

    fn write_file(root: &PathBuf, relative_path: &str, content: &str) {
        let file_path = root.join(relative_path);
        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent).expect("expected parent dir to be created");
        }
        fs::write(file_path, content).expect("expected fixture file to be written");
    }
}
