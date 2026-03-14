//! Import rewriting transforms using Oxc parser.
//! Replaces TypeScript compiler with ~10x faster, lower memory Oxc.

use napi::Result;
use napi_derive::napi;
use oxc_allocator::Allocator;
use oxc_ast::ast::{
    ImportDeclarationSpecifier, ImportOrExportKind, ImportSpecifier, Statement,
};
use oxc_parser::Parser;
use oxc_span::SourceType;
use regex::Regex;

const CORE_PACKAGE: &str = "@reference-ui/react";
const CSS_BINDING: &str = "css";
const CVA_BINDINGS: [&str; 2] = ["cva", "recipe"];

/// Virtual files are only scanned by Panda (cwd=reference-core). Use fixed path;
/// never needs to resolve from consumer—Panda picks up system/css from core.
fn compute_styled_system_path(_relative_path: &str) -> String {
    "src/system/css".to_string()
}

fn get_imported_name(spec: &ImportSpecifier) -> String {
    spec.imported.name().to_string()
}

fn get_local_name(spec: &ImportSpecifier, source: &str) -> String {
    let span = spec.local.span;
    source[span.start as usize..span.end as usize].to_string()
}

/// Rewrite css imports from @reference-ui/react to styled-system path.
#[napi]
pub fn rewrite_css_imports(source_code: String, relative_path: String) -> Result<String> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(&relative_path).unwrap_or_default();

    let ret = Parser::new(&allocator, &source_code, source_type).parse();
    let program = ret.program;
    let styled_system_path = compute_styled_system_path(&relative_path);

    for stmt in program.body.iter() {
        if let Statement::ImportDeclaration(import) = stmt {
            if import.import_kind == ImportOrExportKind::Type {
                continue;
            }

            let specifiers = match &import.specifiers {
                Some(s) => s,
                None => continue,
            };

            let source_str = &source_code[import.source.span.start as usize
                ..import.source.span.end as usize];
            let module_spec = source_str
                .trim_matches('"')
                .trim_matches('\'')
                .trim();
            if module_spec != CORE_PACKAGE {
                continue;
            }

            let mut rest_parts: Vec<String> = Vec::new();
            let mut default_name: Option<String> = None;
            let mut has_css = false;

            for spec in specifiers.iter() {
                match spec {
                    ImportDeclarationSpecifier::ImportSpecifier(named) => {
                        let imported = get_imported_name(named);
                        let local = get_local_name(named, &source_code);
                        if imported == CSS_BINDING {
                            has_css = true;
                        } else {
                            let part = if imported == local {
                                local
                            } else {
                                format!("{} as {}", imported, local)
                            };
                            rest_parts.push(part);
                        }
                    }
                    ImportDeclarationSpecifier::ImportDefaultSpecifier(default) => {
                        let span = default.local.span;
                        default_name = Some(
                            source_code[span.start as usize..span.end as usize].to_string(),
                        );
                    }
                    _ => {}
                }
            }

            if !has_css {
                continue;
            }

            let start = import.span.start as usize;
            let end = import.span.end as usize;

            let css_line = format!("import {{ {} }} from '{}';\n", CSS_BINDING, styled_system_path);
            let mut core_line = String::new();
            if !rest_parts.is_empty() || default_name.is_some() {
                if rest_parts.is_empty() {
                    core_line = format!("import {} from '{}';\n", default_name.unwrap(), CORE_PACKAGE);
                } else if let Some(def) = &default_name {
                    core_line = format!(
                        "import {}, {{ {} }} from '{}';\n",
                        def,
                        rest_parts.join(", "),
                        CORE_PACKAGE
                    );
                } else {
                    core_line = format!(
                        "import {{ {} }} from '{}';\n",
                        rest_parts.join(", "),
                        CORE_PACKAGE
                    );
                }
            }

            let replacement = css_line + &core_line;
            let result = format!(
                "{}{}{}",
                &source_code[..start],
                replacement,
                &source_code[end..]
            );
            return Ok(result);
        }
    }

    Ok(source_code)
}

/// Rewrite cva/recipe imports and replace recipe( with cva(.
#[napi]
pub fn rewrite_cva_imports(source_code: String, relative_path: String) -> Result<String> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(&relative_path).unwrap_or_default();

    let ret = Parser::new(&allocator, &source_code, source_type).parse();
    let program = ret.program;
    let styled_system_path = compute_styled_system_path(&relative_path);

    for stmt in program.body.iter() {
        if let Statement::ImportDeclaration(import) = stmt {
            if import.import_kind == ImportOrExportKind::Type {
                continue;
            }

            let specifiers = match &import.specifiers {
                Some(s) => s,
                None => continue,
            };

            let source_str = &source_code[import.source.span.start as usize
                ..import.source.span.end as usize];
            let module_spec = source_str
                .trim_matches('"')
                .trim_matches('\'')
                .trim();
            if module_spec != CORE_PACKAGE {
                continue;
            }

            let mut rest_parts: Vec<String> = Vec::new();
            let mut default_name: Option<String> = None;
            let mut has_cva_or_recipe = false;
            let mut local_cva_name: Option<String> = None;

            for spec in specifiers.iter() {
                match spec {
                    ImportDeclarationSpecifier::ImportSpecifier(named) => {
                        let imported = get_imported_name(named);
                        let local = get_local_name(named, &source_code);
                        if CVA_BINDINGS.contains(&imported.as_str()) {
                            has_cva_or_recipe = true;
                            local_cva_name = Some(local);
                        } else {
                            let part = if imported == local {
                                local
                            } else {
                                format!("{} as {}", imported, local)
                            };
                            rest_parts.push(part);
                        }
                    }
                    ImportDeclarationSpecifier::ImportDefaultSpecifier(default) => {
                        let span = default.local.span;
                        default_name = Some(
                            source_code[span.start as usize..span.end as usize].to_string(),
                        );
                    }
                    _ => {}
                }
            }

            if !has_cva_or_recipe {
                continue;
            }

            let start = import.span.start as usize;
            let end = import.span.end as usize;

            let cva_line = format!("import {{ cva }} from '{}';\n", styled_system_path);
            let mut core_line = String::new();
            if !rest_parts.is_empty() || default_name.is_some() {
                if rest_parts.is_empty() {
                    core_line = format!("import {} from '{}';\n", default_name.unwrap(), CORE_PACKAGE);
                } else if let Some(def) = &default_name {
                    core_line = format!(
                        "import {}, {{ {} }} from '{}';\n",
                        def,
                        rest_parts.join(", "),
                        CORE_PACKAGE
                    );
                } else {
                    core_line = format!(
                        "import {{ {} }} from '{}';\n",
                        rest_parts.join(", "),
                        CORE_PACKAGE
                    );
                }
            }

            let replacement = cva_line + &core_line;
            let mut result = format!(
                "{}{}{}",
                &source_code[..start],
                replacement,
                &source_code[end..]
            );

            if let Some(local) = &local_cva_name {
                if local != "cva" {
                    let pattern = regex::escape(local) + r"\(";
                    if let Ok(re) = Regex::new(&pattern) {
                        result = re.replace_all(&result, "cva(").to_string();
                    }
                }
            }

            return Ok(result);
        }
    }

    Ok(source_code)
}
