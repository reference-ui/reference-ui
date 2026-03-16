use oxc_ast::ast::{
    ImportDeclaration, ImportDeclarationSpecifier, ImportOrExportKind, ImportSpecifier,
};
use regex::Regex;

use super::constants::{CORE_PACKAGE, STYLED_SYSTEM_PATH};

pub struct RewritePlan {
    pub start: usize,
    pub end: usize,
    pub replacement: String,
    pub local_binding_to_normalize: Option<String>,
}

pub enum ImportCollection {
    Matched {
        local_binding_to_normalize: Option<String>,
    },
    Keep {
        part: String,
    },
}

pub struct ImportParts {
    pub default_name: Option<String>,
    pub remaining_parts: Vec<String>,
    pub local_binding_to_normalize: Option<String>,
}

pub fn apply_rewrite(source_code: &str, plan: RewritePlan) -> String {
    let mut rewritten = format!(
        "{}{}{}",
        &source_code[..plan.start],
        plan.replacement,
        &source_code[plan.end..]
    );

    if let Some(local_binding) = plan.local_binding_to_normalize {
        rewritten = normalize_cva_calls(&rewritten, &local_binding);
    }

    rewritten
}

pub fn is_core_runtime_import(source_code: &str, import: &ImportDeclaration<'_>) -> bool {
    import.import_kind != ImportOrExportKind::Type
        && import_module_specifier(source_code, import) == CORE_PACKAGE
}

pub fn collect_import_parts<F>(
    source_code: &str,
    import: &ImportDeclaration<'_>,
    mut classify_named_import: F,
) -> Option<ImportParts>
where
    F: FnMut(&str, &str) -> ImportCollection,
{
    let specifiers = import.specifiers.as_ref()?;
    let mut default_name = None;
    let mut remaining_parts = Vec::new();
    let mut matched = false;
    let mut local_binding_to_normalize = None;

    for specifier in specifiers {
        match specifier {
            ImportDeclarationSpecifier::ImportSpecifier(named) => {
                let imported = imported_name(named);
                let local = local_name(named, source_code);

                match classify_named_import(imported.as_str(), local.as_str()) {
                    ImportCollection::Matched {
                        local_binding_to_normalize: local_binding,
                    } => {
                        matched = true;
                        if local_binding_to_normalize.is_none() {
                            local_binding_to_normalize = local_binding;
                        }
                    }
                    ImportCollection::Keep { part } => remaining_parts.push(part),
                }
            }
            ImportDeclarationSpecifier::ImportDefaultSpecifier(default) => {
                let span = default.local.span;
                default_name =
                    Some(source_code[span.start as usize..span.end as usize].to_string());
            }
            _ => {}
        }
    }

    if !matched {
        return None;
    }

    Some(ImportParts {
        default_name,
        remaining_parts,
        local_binding_to_normalize,
    })
}

pub fn render_rewritten_imports(
    rewritten_binding: &str,
    default_name: &Option<String>,
    remaining_parts: &[String],
) -> String {
    let primary_line = format!(
        "import {{ {} }} from '{}';\n",
        rewritten_binding, STYLED_SYSTEM_PATH
    );
    let secondary_line = render_core_import(default_name, remaining_parts);
    primary_line + &secondary_line
}

pub fn render_named_import(imported: &str, local: &str) -> String {
    if imported == local {
        local.to_string()
    } else {
        format!("{} as {}", imported, local)
    }
}

fn render_core_import(default_name: &Option<String>, remaining_parts: &[String]) -> String {
    if remaining_parts.is_empty() && default_name.is_none() {
        return String::new();
    }

    if remaining_parts.is_empty() {
        return format!(
            "import {} from '{}';\n",
            default_name.as_ref().unwrap(),
            CORE_PACKAGE
        );
    }

    if let Some(default_name) = default_name {
        return format!(
            "import {}, {{ {} }} from '{}';\n",
            default_name,
            remaining_parts.join(", "),
            CORE_PACKAGE
        );
    }

    format!(
        "import {{ {} }} from '{}';\n",
        remaining_parts.join(", "),
        CORE_PACKAGE
    )
}

fn import_module_specifier<'a>(source_code: &'a str, import: &ImportDeclaration<'_>) -> &'a str {
    let source_str =
        &source_code[import.source.span.start as usize..import.source.span.end as usize];

    source_str.trim_matches('"').trim_matches('\'').trim()
}

fn imported_name(spec: &ImportSpecifier) -> String {
    spec.imported.name().to_string()
}

fn local_name(spec: &ImportSpecifier, source_code: &str) -> String {
    let span = spec.local.span;
    source_code[span.start as usize..span.end as usize].to_string()
}

fn normalize_cva_calls(source_code: &str, local_binding: &str) -> String {
    let pattern = regex::escape(local_binding) + r"\(";
    let Ok(re) = Regex::new(&pattern) else {
        return source_code.to_string();
    };

    re.replace_all(source_code, "cva(").to_string()
}
