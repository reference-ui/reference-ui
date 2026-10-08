//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

use crate::config::AtlasConfig;
use crate::diagnostics::{AtlasDiagnostic, DiagnosticError};
use crate::internal::{component_key, create_usage_state};
use crate::model::Component;
use crate::output::AtlasAnalysisResult;
use crate::parser::parse_modules;
use crate::resolver::{
    apply_excludes, build_component_template, collect_included_packages,
    collect_public_package_components, collect_referenced_packages, is_local_component_module,
    resolve_package_index,
};
use crate::scanner::Scanner;
use crate::usage::{collect_usage_for_module, finalize_components};
use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::path::{Path, PathBuf};

pub struct AtlasAnalyzer {
    pub config: AtlasConfig,
    scanner: Scanner,
}

impl AtlasAnalyzer {
    pub fn new(config: AtlasConfig) -> Self {
        let scanner = Scanner::new(&config.root_dir);
        Self { config, scanner }
    }

    pub fn analyze(&mut self, project_path: &str) -> Vec<Component> {
        // Diagnostic construction uses hardcoded valid codes and non-blank
        // messages, so the error is unreachable; an empty inventory is the
        // honest fallback if the template ever rejects what we mint.
        self.analyze_detailed(project_path)
            .map(|result| result.components)
            .unwrap_or_default()
    }

    pub fn analyze_detailed(
        &mut self,
        _project_path: &str,
    ) -> Result<AtlasAnalysisResult, DiagnosticError> {
        let app_root = PathBuf::from(&self.config.root_dir);
        let mut diagnostics = Vec::new();

        let local_files = match self.scanner.discover_files(&self.config) {
            Ok(files) => files,
            Err(err) => {
                return failed_result(&format!("Failed to discover Atlas files: {err}"));
            }
        };

        let local_sources = match self.scanner.parse_files(&local_files) {
            Ok(files) => files,
            Err(err) => {
                return failed_result(&format!("Failed to parse Atlas files: {err}"));
            }
        };

        let mut modules = parse_modules(&local_sources, Some(&app_root), None);
        let referenced_packages = collect_referenced_packages(modules.values());
        let include_packages = collect_included_packages(&self.config);
        let packages_to_load = referenced_packages
            .into_iter()
            .chain(include_packages.keys().cloned())
            .collect::<BTreeSet<_>>();

        let mut package_indexes = HashMap::new();
        for package_name in packages_to_load {
            let Some(package_src) = self.resolve_package_src(&package_name) else {
                if include_packages.contains_key(&package_name) {
                    diagnostics.push(crate::diagnostics::unresolved_include_package(
                        &package_name,
                    )?);
                }
                continue;
            };

            let package_scanner = Scanner::new(package_src.to_string_lossy().as_ref());
            let package_config = AtlasConfig {
                root_dir: package_src.to_string_lossy().to_string(),
                include: None,
                exclude: Some(vec![
                    "**/node_modules/**".to_string(),
                    "**/dist/**".to_string(),
                    "**/build/**".to_string(),
                    "**/*.test.*".to_string(),
                    "**/*.spec.*".to_string(),
                ]),
            };

            let files = match package_scanner.discover_files(&package_config) {
                Ok(files) => files,
                Err(err) => {
                    diagnostics.push(crate::diagnostics::package_scan_failed(&package_name, err)?);
                    continue;
                }
            };
            let source_files = match package_scanner.parse_files(&files) {
                Ok(files) => files,
                Err(err) => {
                    diagnostics.push(crate::diagnostics::package_scan_failed(&package_name, err)?);
                    continue;
                }
            };

            let package_modules = parse_modules(&source_files, None, Some(&package_name));
            if let Some(index_path) = resolve_package_index(package_modules.keys()) {
                package_indexes.insert(package_name.clone(), index_path);
            }
            modules.extend(package_modules);
        }

        let mut tracked = BTreeMap::new();
        for module in modules.values() {
            if !is_local_component_module(module, &app_root) {
                continue;
            }

            for component in module.components.values() {
                if let Some(template) = build_component_template(
                    component,
                    module,
                    &modules,
                    &package_indexes,
                    &mut diagnostics,
                )? {
                    tracked.insert(component_key(&template.name, &template.source), template);
                }
            }
        }

        for (package_name, selectors) in include_packages {
            let Some(index_path) = package_indexes.get(&package_name) else {
                continue;
            };

            for public_component in collect_public_package_components(&modules, index_path) {
                if !selectors.is_empty()
                    && !selectors.contains(&public_component.export_name)
                    && !selectors.contains(&public_component.component_name)
                {
                    continue;
                }

                let Some(module) = modules.get(&public_component.module_path) else {
                    continue;
                };
                let Some(component) = module.components.get(&public_component.component_name)
                else {
                    continue;
                };

                if let Some(template) = build_component_template(
                    component,
                    module,
                    &modules,
                    &package_indexes,
                    &mut diagnostics,
                )? {
                    tracked.insert(component_key(&template.name, &template.source), template);
                }
            }
        }

        apply_excludes(&mut tracked, &self.config, &app_root);

        let mut states = tracked
            .into_values()
            .map(create_usage_state)
            .map(|state| {
                (
                    component_key(&state.component.name, &state.component.source),
                    state,
                )
            })
            .collect::<BTreeMap<_, _>>();

        let mut app_modules: Vec<&crate::internal::ModuleInfo> = modules
            .values()
            .filter(|m| m.path.starts_with(&app_root))
            .collect();
        app_modules.sort_by_key(|m| &m.path);

        for module in app_modules {
            let snapshot = states.clone();
            collect_usage_for_module(module, &modules, &snapshot, &mut states);
        }

        Ok(AtlasAnalysisResult {
            components: finalize_components(states),
            diagnostics: normalize_diagnostics(diagnostics),
        })
    }

    fn resolve_package_src(&self, package: &str) -> Option<PathBuf> {
        let root = Path::new(&self.config.root_dir);
        let fixture_name = package.rsplit('/').next()?;
        let workspace_root = Path::new(env!("CARGO_MANIFEST_DIR"));
        let candidates = [
            root.join("..").join(fixture_name).join("src"),
            root.join("..").join("..").join(fixture_name).join("src"),
            workspace_root
                .join("fixtures")
                .join(fixture_name)
                .join("src"),
            root.join("node_modules").join(package).join("src"),
            root.join("node_modules").join(package),
        ];
        candidates.into_iter().find(|path| path.exists())
    }
}

fn failed_result(message: &str) -> Result<AtlasAnalysisResult, DiagnosticError> {
    Ok(AtlasAnalysisResult {
        components: Vec::new(),
        diagnostics: vec![crate::diagnostics::scan_failed(message)?],
    })
}

fn normalize_diagnostics(mut diagnostics: Vec<AtlasDiagnostic>) -> Vec<AtlasDiagnostic> {
    diagnostics.sort_by(|left, right| {
        left.code
            .as_str()
            .cmp(right.code.as_str())
            .then(left.file.cmp(&right.file))
            .then(left.message.cmp(&right.message))
    });
    diagnostics.dedup_by(|left, right| {
        left.code == right.code && left.file == right.file && left.message == right.message
    });
    diagnostics
}
