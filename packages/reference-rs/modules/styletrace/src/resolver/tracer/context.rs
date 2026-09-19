//! Provides context structures for tracing types across modules.
//!
//! The `TraceSession` holds long-lived caches like loaded modules.
//! The `TraceContext` provides scoped state for deep recursive type walks,
//! avoiding argument soup and keeping track of visited nodes.

use std::collections::{BTreeSet, HashMap};
use std::fs;
use std::path::{Path, PathBuf};

use crate::resolver::error::StyleTraceError;
use crate::resolver::model::{
    BoundTypeExpr, ParsedModule, TypeAliasDecl, TypeDeclaration, TypeExpr,
};
use crate::resolver::parser::parse_module;
use crate::resolver::path::{
    is_ignorable_module_specifier, normalize_path, prefer_sync_root_source_module,
    resolve_specifier,
};

pub struct TraceSession {
    pub sync_root: PathBuf,
    pub module_cache: HashMap<PathBuf, ParsedModule>,
    /// Engine-mode fallback: names an unresolvable `@reference-ui/react`
    /// surface-type import denotes. `None` keeps disk resolution strict.
    pub unresolved_style_props: Option<BTreeSet<String>>,
}

impl TraceSession {
    pub fn new(sync_root: &Path) -> Self {
        Self {
            sync_root: sync_root.to_path_buf(),
            module_cache: HashMap::new(),
            unresolved_style_props: None,
        }
    }
}

pub struct TraceContext<'a> {
    pub session: &'a mut TraceSession,
    pub module_path: &'a Path,
    pub env: &'a HashMap<String, BoundTypeExpr>,
    pub visited: &'a mut BTreeSet<String>,
}

impl<'a> TraceContext<'a> {
    pub fn branch<'b>(
        &'b mut self,
        module_path: &'b Path,
        env: &'b HashMap<String, BoundTypeExpr>,
    ) -> TraceContext<'b> {
        TraceContext {
            session: self.session,
            module_path,
            env,
            visited: self.visited,
        }
    }

    pub fn load_module(&mut self, module_path: &Path) -> Result<ParsedModule, StyleTraceError> {
        let normalized = normalize_path(module_path);
        if let Some(module) = self.session.module_cache.get(&normalized) {
            return Ok(module.clone());
        }

        let source = fs::read_to_string(&normalized).map_err(|error| {
            StyleTraceError::new(format!("failed to read {}: {error}", normalized.display()))
        })?;
        let parsed = parse_module(&normalized, &source)?;
        self.session
            .module_cache
            .insert(normalized.clone(), parsed.clone());
        Ok(parsed)
    }

    pub fn resolve_module_specifier(
        &self,
        current_module: &Path,
        specifier: &str,
    ) -> Result<Option<PathBuf>, StyleTraceError> {
        if let Some(path) = self.resolve_styled_module(current_module, specifier)? {
            return Ok(Some(path));
        }
        if let Some(path) = self.resolve_react_module(current_module, specifier)? {
            return Ok(Some(path));
        }
        self.resolve_standard_module(current_module, specifier)
    }

    fn resolve_styled_module(
        &self,
        current_module: &Path,
        specifier: &str,
    ) -> Result<Option<PathBuf>, StyleTraceError> {
        if specifier == "@reference-ui/styled/types" {
            return self.resolve_support_candidates(
                current_module,
                specifier,
                &[
                    self.styled_types_path("system-types.d.ts"),
                    self.sync_path("styled/types/system-types.d.ts"),
                    self.sync_path("types/system-types.d.ts"),
                ],
            );
        }
        if let Some(rest) = specifier.strip_prefix("@reference-ui/styled/types/") {
            return self.resolve_support_candidates(
                current_module,
                specifier,
                &[
                    self.styled_types_path(&format!("{rest}.d.ts")),
                    self.sync_path(&format!("styled/types/{rest}.d.ts")),
                    self.sync_path(&format!("types/{rest}.d.ts")),
                ],
            );
        }
        if specifier == "@reference-ui/styled" {
            return self.resolve_support_candidates(
                current_module,
                specifier,
                &[
                    self.styled_types_path("index.d.ts"),
                    self.sync_path(".reference-ui/styled/index.d.ts"),
                    self.sync_path("styled/types/index.d.ts"),
                    self.sync_path("styled/index.d.ts"),
                ],
            );
        }
        Ok(None)
    }

    fn resolve_react_module(
        &self,
        current_module: &Path,
        specifier: &str,
    ) -> Result<Option<PathBuf>, StyleTraceError> {
        if specifier != "@reference-ui/react" {
            return Ok(None);
        }
        self.resolve_support_candidates(
            current_module,
            specifier,
            &[
                self.sync_path(super::REFERENCE_REACT_ENTRY),
                self.sync_path(".reference-ui/react/react.d.ts"),
                self.sync_path("react/react.d.mts"),
                self.sync_path("react/react.d.ts"),
                self.sync_path("react.d.mts"),
                self.sync_path("react.d.ts"),
            ],
        )
    }

    fn resolve_support_candidates(
        &self,
        current_module: &Path,
        specifier: &str,
        candidates: &[PathBuf],
    ) -> Result<Option<PathBuf>, StyleTraceError> {
        for candidate in candidates {
            if let Some(path) =
                self.resolve_reference_support_module(current_module, candidate, specifier)?
            {
                return Ok(Some(path));
            }
        }
        Ok(None)
    }

    fn sync_path(&self, relative: &str) -> PathBuf {
        self.session.sync_root.join(relative)
    }

    fn styled_types_path(&self, file: &str) -> PathBuf {
        self.session
            .sync_root
            .join(super::STYLED_TYPES_ROOT)
            .join(file)
    }

    fn resolve_standard_module(
        &self,
        current_module: &Path,
        specifier: &str,
    ) -> Result<Option<PathBuf>, StyleTraceError> {
        if specifier.starts_with('.') {
            return Ok(resolve_specifier(current_module, specifier));
        }

        if is_ignorable_module_specifier(specifier) {
            return Ok(None);
        }

        let Some(resolved) = resolve_specifier(current_module, specifier) else {
            // An unresolvable module contributes no names; the trace continues without it.
            return Ok(None);
        };
        Ok(Some(prefer_sync_root_source_module(
            &resolved,
            &self.session.sync_root,
        )))
    }

    fn resolve_reference_support_module(
        &self,
        current_module: &Path,
        generated_path: &Path,
        specifier: &str,
    ) -> Result<Option<PathBuf>, StyleTraceError> {
        if generated_path.is_file() {
            return Ok(Some(generated_path.to_path_buf()));
        }

        let Some(resolved) = resolve_specifier(current_module, specifier) else {
            return Ok(None);
        };
        Ok(Some(prefer_sync_root_source_module(
            &resolved,
            &self.session.sync_root,
        )))
    }

    pub fn resolve_declaration(
        &mut self,
        module_path: &Path,
        name: &str,
    ) -> Result<Option<(PathBuf, TypeDeclaration)>, StyleTraceError> {
        let module = self.load_module(module_path)?;
        if let Some(declaration) = module.declarations.get(name) {
            return Ok(Some((module_path.to_path_buf(), declaration.clone())));
        }

        if let Some(reexport) = module.reexports.get(name) {
            let Some(imported_module) =
                self.resolve_module_specifier(module_path, &reexport.source)?
            else {
                return Ok(None);
            };
            return self.resolve_declaration(&imported_module, &reexport.imported_name);
        }

        for source in &module.export_all_sources {
            let Some(imported_module) = self.resolve_module_specifier(module_path, source)? else {
                continue;
            };
            if let Some(resolved) = self.resolve_declaration(&imported_module, name)? {
                return Ok(Some(resolved));
            }
        }

        let Some(import_binding) = module.imports.get(name) else {
            return Ok(None);
        };
        let Some(imported_module) =
            self.resolve_module_specifier(module_path, &import_binding.source)?
        else {
            return Ok(self.unresolved_surface_type_fallback(
                &import_binding.source,
                &import_binding.imported_name,
                module_path,
            ));
        };
        self.resolve_declaration(&imported_module, &import_binding.imported_name)
    }

    /// Engine-mode fallback: an unresolvable surface-type import
    /// (`StyleProps`, `PrimitiveProps`) from `@reference-ui/react` denotes
    /// the engine surface, so wipe-state traces resolve without file edges.
    /// Real declarations always win (this runs only when module resolution
    /// failed); disk sessions carry no fallback and other names keep
    /// returning `None`.
    fn unresolved_surface_type_fallback(
        &self,
        source: &str,
        imported_name: &str,
        module_path: &Path,
    ) -> Option<(PathBuf, TypeDeclaration)> {
        if source != "@reference-ui/react" || !is_surface_type_name(imported_name) {
            return None;
        }
        let fallback = self.session.unresolved_style_props.clone()?;
        Some((
            module_path.to_path_buf(),
            TypeDeclaration::TypeAlias(TypeAliasDecl {
                name: imported_name.to_string(),
                type_params: Vec::new(),
                expr: TypeExpr::Object(fallback),
            }),
        ))
    }
}

/// Type names that denote the engine style surface: `StyleProps` is the
/// surface itself and `PrimitiveProps` is native props plus the surface.
fn is_surface_type_name(imported_name: &str) -> bool {
    matches!(imported_name, "StyleProps" | "PrimitiveProps")
}
