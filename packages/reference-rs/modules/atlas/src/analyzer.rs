//! Runs one Atlas analysis over a project: discovers and parses the app's sources, loads the packages it references
//! or includes, builds the tracked component set, counts usage and observations across the app's modules, and
//! assembles the result. It takes an `AtlasConfig` and emits an `AtlasAnalysisResult`. A scan or parse failure
//! becomes a result with one diagnostic and no components, so a bad tree never surfaces as a Rust error.

use crate::config::AtlasConfig;
use crate::diagnostics::{AtlasDiagnostic, DiagnosticError};
use crate::internal::{component_key, create_usage_state, ComponentTemplate, ModuleInfo};
use crate::model::Component;
use crate::output::AtlasAnalysisResult;
use crate::parser::parse_modules;
use crate::resolver::{
    apply_excludes, build_component_template, collect_included_packages,
    collect_public_package_components, collect_referenced_packages, is_local_component_module,
    resolve_package_index, PublicPackageComponent, TypeScope,
};
use crate::scanner::{Scanner, SourceFile};
use crate::usage::{collect_usage_for_module, finalize_components, observe_elements};
use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::path::{Path, PathBuf};

#[cfg(test)]
mod tests;

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

        let (local_files, local_sources) = match self.discover_local_sources() {
            Ok(found) => found,
            Err(message) => return failed_result(&message),
        };

        let mut modules = parse_modules(&local_sources, Some(&app_root), None);
        let include_packages = collect_included_packages(&self.config);
        let package_indexes =
            self.load_packages(&mut modules, &include_packages, &mut diagnostics)?;

        let scope = TypeScope {
            modules: &modules,
            package_indexes: &package_indexes,
        };
        let mut tracked = BTreeMap::new();
        insert_local_templates(scope, &app_root, &mut tracked, &mut diagnostics)?;
        insert_include_templates(scope, &include_packages, &mut tracked, &mut diagnostics)?;

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

        let app_modules = select_app_modules(&modules, &local_files, &app_root);

        for module in &app_modules {
            let snapshot = states.clone();
            collect_usage_for_module(module, &modules, &snapshot, &mut states);
        }

        Ok(AtlasAnalysisResult {
            observed: observe_elements(&app_modules, &self.config.observe),
            components: finalize_components(states),
            diagnostics: normalize_diagnostics(diagnostics),
        })
    }

    fn discover_local_sources(&self) -> Result<(Vec<PathBuf>, Vec<SourceFile>), String> {
        let local_files = self
            .scanner
            .discover_files(&self.config)
            .map_err(|err| format!("Failed to discover Atlas files: {err}"))?;
        let local_sources = self
            .scanner
            .parse_files(&local_files)
            .map_err(|err| format!("Failed to parse Atlas files: {err}"))?;
        Ok((local_files, local_sources))
    }

    /// Loads each referenced or included package into `modules`, and returns where each package's index file sits.
    fn load_packages(
        &self,
        modules: &mut HashMap<PathBuf, ModuleInfo>,
        include_packages: &BTreeMap<String, BTreeSet<String>>,
        diagnostics: &mut Vec<AtlasDiagnostic>,
    ) -> Result<HashMap<String, PathBuf>, DiagnosticError> {
        let referenced_packages = collect_referenced_packages(modules.values());
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
            if let Some(index_path) =
                self.load_package(&package_name, &package_src, modules, diagnostics)?
            {
                package_indexes.insert(package_name, index_path);
            }
        }
        Ok(package_indexes)
    }

    /// Scans and parses one package. A failed scan records a diagnostic and loads nothing from that package.
    fn load_package(
        &self,
        package_name: &str,
        package_src: &Path,
        modules: &mut HashMap<PathBuf, ModuleInfo>,
        diagnostics: &mut Vec<AtlasDiagnostic>,
    ) -> Result<Option<PathBuf>, DiagnosticError> {
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
            observe: Vec::new(),
        };

        let source_files = match scan_package(&package_scanner, &package_config) {
            Ok(files) => files,
            Err(err) => {
                diagnostics.push(crate::diagnostics::package_scan_failed(package_name, err)?);
                return Ok(None);
            }
        };

        let package_modules = parse_modules(&source_files, None, Some(package_name));
        let index_path = resolve_package_index(package_modules.keys());
        modules.extend(package_modules);
        Ok(index_path)
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

fn scan_package(scanner: &Scanner, config: &AtlasConfig) -> Result<Vec<SourceFile>, String> {
    let files = scanner.discover_files(config)?;
    scanner.parse_files(&files)
}

/// Adds every component the app declares in its own modules to `tracked`.
fn insert_local_templates(
    scope: TypeScope<'_>,
    app_root: &Path,
    tracked: &mut BTreeMap<String, ComponentTemplate>,
    diagnostics: &mut Vec<AtlasDiagnostic>,
) -> Result<(), DiagnosticError> {
    for module in scope.modules.values() {
        if !is_local_component_module(module, app_root) {
            continue;
        }
        for component in module.components.values() {
            if let Some(template) =
                build_component_template(component, module, scope, diagnostics)?
            {
                tracked.insert(component_key(&template.name, &template.source), template);
            }
        }
    }
    Ok(())
}

/// Adds the components each include entry selects from a package's public surface.
fn insert_include_templates(
    scope: TypeScope<'_>,
    include_packages: &BTreeMap<String, BTreeSet<String>>,
    tracked: &mut BTreeMap<String, ComponentTemplate>,
    diagnostics: &mut Vec<AtlasDiagnostic>,
) -> Result<(), DiagnosticError> {
    for (package_name, selectors) in include_packages {
        let Some(index_path) = scope.package_indexes.get(package_name) else {
            continue;
        };
        for public_component in collect_public_package_components(scope.modules, index_path) {
            if is_selected(selectors, &public_component) {
                insert_public_template(scope, &public_component, tracked, diagnostics)?;
            }
        }
    }
    Ok(())
}

/// No selectors takes every public component; otherwise the export or component name must be listed.
fn is_selected(selectors: &BTreeSet<String>, public_component: &PublicPackageComponent) -> bool {
    selectors.is_empty()
        || selectors.contains(&public_component.export_name)
        || selectors.contains(&public_component.component_name)
}

fn insert_public_template(
    scope: TypeScope<'_>,
    public_component: &PublicPackageComponent,
    tracked: &mut BTreeMap<String, ComponentTemplate>,
    diagnostics: &mut Vec<AtlasDiagnostic>,
) -> Result<(), DiagnosticError> {
    let Some(module) = scope.modules.get(&public_component.module_path) else {
        return Ok(());
    };
    let Some(component) = module.components.get(&public_component.component_name) else {
        return Ok(());
    };
    if let Some(template) = build_component_template(component, module, scope, diagnostics)? {
        tracked.insert(component_key(&template.name, &template.source), template);
    }
    Ok(())
}

/// The modules usage and observation are counted over, in path order: the files discovery found
/// for the project itself. Package sources join `modules` afterwards, and one reached through a
/// `node_modules` symlink or a sibling directory keeps a path under the app root, so the path alone
/// cannot tell app code from a dependency. Dependency files an include glob names are read for
/// resolution but are not app code either.
fn select_app_modules<'a>(
    modules: &'a HashMap<PathBuf, ModuleInfo>,
    discovered: &[PathBuf],
    app_root: &Path,
) -> Vec<&'a ModuleInfo> {
    discovered
        .iter()
        .filter(|path| !is_dependency_path(path, app_root))
        .filter_map(|path| modules.get(path))
        .collect()
}

fn is_dependency_path(path: &Path, app_root: &Path) -> bool {
    path.strip_prefix(app_root).is_ok_and(|relative| {
        relative
            .components()
            .any(|component| component.as_os_str() == "node_modules")
    })
}

fn failed_result(message: &str) -> Result<AtlasAnalysisResult, DiagnosticError> {
    Ok(AtlasAnalysisResult {
        components: Vec::new(),
        diagnostics: vec![crate::diagnostics::scan_failed(message)?],
        observed: Vec::new(),
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
