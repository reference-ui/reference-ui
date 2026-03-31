use crate::atlas::internal::{
    ComponentDecl, ImportBinding, ImportKind, ModuleInfo, PropDef, PropValueType,
    PropsAnnotation, ReExport, TypeDef, TypeExpr,
};
use crate::atlas::scanner::SourceFile;
use regex::Regex;
use std::collections::HashMap;
use std::path::{Path, PathBuf};

pub fn parse_modules(
    source_files: &[SourceFile],
    app_root: Option<&Path>,
    package_name: Option<&str>,
) -> HashMap<PathBuf, ModuleInfo> {
    source_files
        .iter()
        .map(|source_file| {
            let display_source = package_name
                .map(|name| name.to_string())
                .unwrap_or_else(|| local_source_display(app_root.unwrap(), &source_file.path));
            let app_relative_path = app_root
                .and_then(|root| source_file.path.strip_prefix(root).ok())
                .map(path_to_posix);
            let imports = parse_imports(&source_file.content);
            let namespace_imports = imports
                .values()
                .filter(|binding| binding.kind == ImportKind::Namespace)
                .map(|binding| (binding.local.clone(), binding.source.clone()))
                .collect::<HashMap<_, _>>();

            (
                source_file.path.clone(),
                ModuleInfo {
                    path: source_file.path.clone(),
                    content: source_file.content.clone(),
                    display_source: display_source.clone(),
                    imports,
                    namespace_imports,
                    components: parse_components(
                        &source_file.content,
                        &source_file.path,
                        &display_source,
                        app_relative_path,
                    ),
                    default_component: parse_default_component_name(&source_file.content),
                    named_component_reexports: parse_reexports(&source_file.content, false),
                    types: parse_types(&source_file.content),
                    named_type_reexports: parse_reexports(&source_file.content, true),
                },
            )
        })
        .collect()
}

pub fn parse_imports(content: &str) -> HashMap<String, ImportBinding> {
    let import_re = Regex::new(r#"(?m)^\s*import\s+([^;]+?)\s+from\s+['\"]([^'\"]+)['\"];?\s*$"#).unwrap();
    let mut imports = HashMap::new();

    for captures in import_re.captures_iter(content) {
        let clause = captures.get(1).unwrap().as_str().trim();
        let source = captures.get(2).unwrap().as_str().to_string();

        if let Some(alias) = clause.strip_prefix("* as ") {
            let local = alias.trim().to_string();
            imports.insert(
                local.clone(),
                ImportBinding {
                    source: source.clone(),
                    local,
                    imported: None,
                    kind: ImportKind::Namespace,
                    is_type: false,
                },
            );
            continue;
        }

        if clause.starts_with('{') && clause.ends_with('}') {
            for entry in clause.trim_matches(|ch| ch == '{' || ch == '}').split(',') {
                let spec = entry.trim();
                if spec.is_empty() {
                    continue;
                }
                let is_type = spec.starts_with("type ");
                let spec = spec.trim_start_matches("type ").trim();
                let (imported, local) = if let Some((left, right)) = spec.split_once(" as ") {
                    (left.trim().to_string(), right.trim().to_string())
                } else {
                    (spec.to_string(), spec.to_string())
                };
                imports.insert(
                    local.clone(),
                    ImportBinding {
                        source: source.clone(),
                        local,
                        imported: Some(imported),
                        kind: ImportKind::Named,
                        is_type,
                    },
                );
            }
            continue;
        }

        let local = clause.trim().to_string();
        imports.insert(
            local.clone(),
            ImportBinding {
                source,
                local,
                imported: Some("default".to_string()),
                kind: ImportKind::Default,
                is_type: false,
            },
        );
    }

    imports
}

pub fn parse_components(
    content: &str,
    file_path: &Path,
    display_source: &str,
    app_relative_path: Option<String>,
) -> HashMap<String, ComponentDecl> {
    let function_re = Regex::new(
        r#"(?s)export\s+(default\s+)?function\s+([A-Z][A-Za-z0-9_]*)\s*\((.*?)\)\s*(?::[^\{]+)?\{"#,
    )
    .unwrap();
    let mut components = HashMap::new();

    for captures in function_re.captures_iter(content) {
        let name = captures.get(2).unwrap().as_str().to_string();
        let params = captures.get(3).map(|capture| capture.as_str()).unwrap_or("");
        components.insert(
            name.clone(),
            ComponentDecl {
                name,
                file_path: file_path.to_path_buf(),
                source_display: display_source.to_string(),
                app_relative_path: app_relative_path.clone(),
                props: parse_props_annotation(params),
            },
        );
    }

    components
}

pub fn parse_default_component_name(content: &str) -> Option<String> {
    let re = Regex::new(r#"export\s+default\s+function\s+([A-Z][A-Za-z0-9_]*)"#).unwrap();
    re.captures(content)
        .and_then(|captures| captures.get(1).map(|capture| capture.as_str().to_string()))
}

pub fn parse_props_annotation(params: &str) -> PropsAnnotation {
    let trimmed = params.trim();
    if trimmed.is_empty() {
        return PropsAnnotation::None;
    }
    let Some(annotation_index) = find_top_level_colon(trimmed) else {
        return PropsAnnotation::None;
    };
    let annotation = trimmed[annotation_index + 1..].trim();
    if annotation.starts_with('{') {
        return PropsAnnotation::InlineObject;
    }
    if is_identifier(annotation) {
        return PropsAnnotation::Named(annotation.to_string());
    }
    PropsAnnotation::None
}

pub fn parse_types(content: &str) -> HashMap<String, TypeDef> {
    let mut types = HashMap::new();

    let intersection_re = Regex::new(
        r#"(?s)(?:export\s+)?type\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([A-Za-z_][A-Za-z0-9_]*)\s*&\s*\{(.*?)\}"#,
    )
    .unwrap();
    for captures in intersection_re.captures_iter(content) {
        types.insert(
            captures.get(1).unwrap().as_str().to_string(),
            TypeDef {
                expr: TypeExpr::Intersection(vec![
                    TypeExpr::Reference(captures.get(2).unwrap().as_str().to_string()),
                    TypeExpr::Object(parse_object_props(captures.get(3).unwrap().as_str())),
                ]),
            },
        );
    }

    let interface_re = Regex::new(
        r#"(?s)(?:export\s+)?interface\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{(.*?)\}"#,
    )
    .unwrap();
    for captures in interface_re.captures_iter(content) {
        let name = captures.get(1).unwrap().as_str().to_string();
        if types.contains_key(&name) {
            continue;
        }
        types.insert(
            name,
            TypeDef {
                expr: TypeExpr::Object(parse_object_props(captures.get(2).unwrap().as_str())),
            },
        );
    }

    let object_re = Regex::new(
        r#"(?s)(?:export\s+)?type\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*\{(.*?)\}"#,
    )
    .unwrap();
    for captures in object_re.captures_iter(content) {
        let name = captures.get(1).unwrap().as_str().to_string();
        if types.contains_key(&name) {
            continue;
        }
        types.insert(
            name,
            TypeDef {
                expr: TypeExpr::Object(parse_object_props(captures.get(2).unwrap().as_str())),
            },
        );
    }

    let alias_re = Regex::new(r#"(?m)^(?:export\s+)?type\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([^\n;]+)"#).unwrap();
    for captures in alias_re.captures_iter(content) {
        let name = captures.get(1).unwrap().as_str().to_string();
        if types.contains_key(&name) {
            continue;
        }
        let expr = captures.get(2).unwrap().as_str().trim();
        let parsed = if let Some(values) = parse_string_literal_union(expr) {
            TypeExpr::UnionLiterals(values)
        } else if is_identifier(expr) {
            TypeExpr::Reference(expr.to_string())
        } else {
            TypeExpr::Unknown
        };
        types.insert(name, TypeDef { expr: parsed });
    }

    types
}

pub fn parse_object_props(body: &str) -> Vec<PropDef> {
    let prop_re = Regex::new(r#"(?m)^\s*([A-Za-z_][A-Za-z0-9_]*)\??\s*:\s*([^\n]+)"#).unwrap();
    let mut props = Vec::new();
    for captures in prop_re.captures_iter(body) {
        let name = captures.get(1).unwrap().as_str().to_string();
        let raw = captures.get(2).unwrap().as_str().trim().trim_end_matches(',').trim();
        let value_type = if let Some(values) = parse_string_literal_union(raw) {
            PropValueType::UnionLiterals(values)
        } else if is_identifier(raw) {
            PropValueType::Reference(raw.to_string())
        } else {
            PropValueType::Unknown
        };
        props.push(PropDef { name, value_type });
    }
    props
}

pub fn parse_reexports(content: &str, type_only: bool) -> HashMap<String, ReExport> {
    let re = Regex::new(r#"(?m)^\s*export\s+(type\s+)?\{([^}]+)\}\s+from\s+['\"]([^'\"]+)['\"];?\s*$"#).unwrap();
    let mut reexports = HashMap::new();
    for captures in re.captures_iter(content) {
        let is_type = captures.get(1).is_some();
        if is_type != type_only {
            continue;
        }
        let source = captures.get(3).unwrap().as_str().to_string();
        for entry in captures.get(2).unwrap().as_str().split(',') {
            let entry = entry.trim();
            if entry.is_empty() {
                continue;
            }
            let (imported, exported) = if let Some((left, right)) = entry.split_once(" as ") {
                (left.trim().to_string(), right.trim().to_string())
            } else {
                (entry.to_string(), entry.to_string())
            };
            reexports.insert(
                exported,
                ReExport {
                    source: source.clone(),
                    imported,
                },
            );
        }
    }
    reexports
}

pub fn parse_string_literal_union(value: &str) -> Option<Vec<String>> {
    let parts = value
        .split('|')
        .map(|part| part.trim())
        .filter(|part| !part.is_empty())
        .collect::<Vec<_>>();
    if parts.is_empty() {
        return None;
    }
    let mut values = Vec::new();
    for part in parts {
        values.push(strip_quoted_literal(part)?.to_string());
    }
    Some(values)
}

pub fn strip_quoted_literal(value: &str) -> Option<&str> {
    if value.starts_with('"') && value.ends_with('"') && value.len() >= 2 {
        return Some(&value[1..value.len() - 1]);
    }
    if value.starts_with('\'') && value.ends_with('\'') && value.len() >= 2 {
        return Some(&value[1..value.len() - 1]);
    }
    None
}

pub fn is_identifier(value: &str) -> bool {
    Regex::new(r#"^[A-Za-z_][A-Za-z0-9_]*$"#)
        .unwrap()
        .is_match(value)
}

pub fn local_source_display(root: &Path, file_path: &Path) -> String {
    if let Ok(relative) = file_path.strip_prefix(root.join("src")) {
        return format!("./{}", path_to_posix(relative));
    }
    if let Ok(relative) = file_path.strip_prefix(root) {
        return format!("./{}", path_to_posix(relative));
    }
    file_path.to_string_lossy().replace('\\', "/")
}

pub fn path_to_posix(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}

fn find_top_level_colon(value: &str) -> Option<usize> {
    let bytes = value.as_bytes();
    let mut brace_depth = 0usize;
    let mut paren_depth = 0usize;
    let mut bracket_depth = 0usize;
    let mut quote: Option<u8> = None;

    for (index, byte) in bytes.iter().copied().enumerate() {
        if let Some(active) = quote {
            if byte == active {
                quote = None;
            }
            continue;
        }

        match byte {
            b'\'' | b'"' => quote = Some(byte),
            b'{' => brace_depth += 1,
            b'}' => brace_depth = brace_depth.saturating_sub(1),
            b'(' => paren_depth += 1,
            b')' => paren_depth = paren_depth.saturating_sub(1),
            b'[' => bracket_depth += 1,
            b']' => bracket_depth = bracket_depth.saturating_sub(1),
            b':' if brace_depth == 0 && paren_depth == 0 && bracket_depth == 0 => {
                return Some(index)
            }
            _ => {}
        }
    }

    None
}