//! Recursive type resolver for concrete style-prop name collection.

use std::collections::{BTreeSet, HashMap};
use std::fs;
use std::path::{Path, PathBuf};

use crate::tasty::resolve_external_import_path;

use super::model::{BoundTypeExpr, ParsedModule, TypeDeclaration, TypeExpr};
use super::parser::parse_module;
use super::util::{
    normalize_path, prefer_workspace_source_module, resolve_local_module_path, StyleTraceError,
};

const REFERENCE_STYLE_PROPS_ENTRY: &str = "packages/reference-core/src/types/style-props.ts";
const REFERENCE_TYPES_INDEX_ENTRY: &str = "packages/reference-core/src/types/index.ts";
const STYLED_TYPES_ROOT: &str = "packages/reference-core/src/system/styled/types";

pub fn collect_reference_style_prop_names(
    workspace_root: &Path,
) -> Result<Vec<String>, StyleTraceError> {
    collect_style_prop_names(
        workspace_root,
        &workspace_root.join(REFERENCE_STYLE_PROPS_ENTRY),
        "StyleProps",
    )
}

pub fn collect_style_prop_names(
    workspace_root: &Path,
    entry_path: &Path,
    export_name: &str,
) -> Result<Vec<String>, StyleTraceError> {
    let mut tracer = StyleTracer::new(workspace_root);
    let names = tracer.collect(entry_path, export_name)?;
    Ok(names.into_iter().collect())
}

struct StyleTracer {
    workspace_root: PathBuf,
    module_cache: HashMap<PathBuf, ParsedModule>,
}

impl StyleTracer {
    fn new(workspace_root: &Path) -> Self {
        Self {
            workspace_root: workspace_root.to_path_buf(),
            module_cache: HashMap::new(),
        }
    }

    fn collect(
        &mut self,
        entry_path: &Path,
        export_name: &str,
    ) -> Result<BTreeSet<String>, StyleTraceError> {
        let entry_path = normalize_path(entry_path);
        let mut visited = BTreeSet::new();
        self.resolve_reference_props(&entry_path, export_name, &HashMap::new(), &mut visited)
    }

    fn resolve_reference_props(
        &mut self,
        module_path: &Path,
        name: &str,
        env: &HashMap<String, BoundTypeExpr>,
        visited: &mut BTreeSet<String>,
    ) -> Result<BTreeSet<String>, StyleTraceError> {
        if let Some(bound) = env.get(name) {
            return self.resolve_prop_names(&bound.module_path, &bound.expr, env, visited);
        }

        let visit_key = format!("{}::{name}", module_path.display());
        if !visited.insert(visit_key.clone()) {
            return Ok(BTreeSet::new());
        }

        let result = match self.resolve_declaration(module_path, name)? {
            Some((resolved_module, declaration)) => self.resolve_decl_props(
                &resolved_module,
                &declaration,
                &[],
                module_path,
                env,
                visited,
            ),
            None => Ok(BTreeSet::new()),
        };

        visited.remove(&visit_key);
        result
    }

    fn resolve_prop_names(
        &mut self,
        module_path: &Path,
        expr: &TypeExpr,
        env: &HashMap<String, BoundTypeExpr>,
        visited: &mut BTreeSet<String>,
    ) -> Result<BTreeSet<String>, StyleTraceError> {
        match expr {
            TypeExpr::Unknown => Ok(BTreeSet::new()),
            TypeExpr::Object(props) => Ok(props.clone()),
            TypeExpr::Intersection(types) => {
                let mut names = BTreeSet::new();
                for nested in types {
                    names.extend(self.resolve_prop_names(module_path, nested, env, visited)?);
                }
                Ok(names)
            }
            TypeExpr::Reference { name, args } => {
                if let Some(names) =
                    self.resolve_builtin_props(module_path, name, args, env, visited)?
                {
                    return Ok(names);
                }

                if let Some(bound) = env.get(name) {
                    return self.resolve_prop_names(&bound.module_path, &bound.expr, env, visited);
                }

                match self.resolve_declaration(module_path, name)? {
                    Some((resolved_module, declaration)) => self.resolve_decl_props(
                        &resolved_module,
                        &declaration,
                        args,
                        module_path,
                        env,
                        visited,
                    ),
                    None => Ok(BTreeSet::new()),
                }
            }
            TypeExpr::UnionLiterals(_) => Ok(BTreeSet::new()),
            TypeExpr::IndexedAccess { object, .. } => match object.as_ref() {
                TypeExpr::Mapped { value_type, .. } => {
                    self.resolve_prop_names(module_path, value_type, env, visited)
                }
                _ => self.resolve_prop_names(module_path, object, env, visited),
            },
            TypeExpr::Mapped { key_source, .. } => {
                self.resolve_literal_names(module_path, key_source, env, visited)
            }
            TypeExpr::Keyof(_) => Ok(BTreeSet::new()),
            TypeExpr::Conditional {
                true_type,
                false_type,
            } => {
                let mut names = self.resolve_prop_names(module_path, true_type, env, visited)?;
                names.extend(self.resolve_prop_names(module_path, false_type, env, visited)?);
                Ok(names)
            }
        }
    }

    fn resolve_literal_names(
        &mut self,
        module_path: &Path,
        expr: &TypeExpr,
        env: &HashMap<String, BoundTypeExpr>,
        visited: &mut BTreeSet<String>,
    ) -> Result<BTreeSet<String>, StyleTraceError> {
        match expr {
            TypeExpr::Unknown => Ok(BTreeSet::new()),
            TypeExpr::UnionLiterals(values) => Ok(values.clone()),
            TypeExpr::Keyof(target) => self.resolve_prop_names(module_path, target, env, visited),
            TypeExpr::Intersection(types) => {
                let mut names = BTreeSet::new();
                for nested in types {
                    names.extend(self.resolve_literal_names(module_path, nested, env, visited)?);
                }
                Ok(names)
            }
            TypeExpr::Reference { name, args } => {
                if let Some(values) =
                    self.resolve_builtin_literals(module_path, name, args, env, visited)?
                {
                    return Ok(values);
                }

                if let Some(bound) = env.get(name) {
                    return self.resolve_literal_names(
                        &bound.module_path,
                        &bound.expr,
                        env,
                        visited,
                    );
                }

                match self.resolve_declaration(module_path, name)? {
                    Some((resolved_module, declaration)) => self.resolve_decl_literals(
                        &resolved_module,
                        &declaration,
                        args,
                        module_path,
                        env,
                        visited,
                    ),
                    None => Ok(BTreeSet::new()),
                }
            }
            TypeExpr::Mapped { key_source, .. } => {
                self.resolve_literal_names(module_path, key_source, env, visited)
            }
            TypeExpr::IndexedAccess { object, index } => {
                let _ = self.resolve_literal_names(module_path, index, env, visited)?;
                match object.as_ref() {
                    TypeExpr::Mapped { key_source, .. } => {
                        self.resolve_literal_names(module_path, key_source, env, visited)
                    }
                    _ => Ok(BTreeSet::new()),
                }
            }
            TypeExpr::Object(_) => Ok(BTreeSet::new()),
            TypeExpr::Conditional {
                true_type,
                false_type,
            } => {
                let mut names = self.resolve_literal_names(module_path, true_type, env, visited)?;
                names.extend(self.resolve_literal_names(module_path, false_type, env, visited)?);
                Ok(names)
            }
        }
    }

    fn resolve_builtin_props(
        &mut self,
        module_path: &Path,
        name: &str,
        args: &[TypeExpr],
        env: &HashMap<String, BoundTypeExpr>,
        visited: &mut BTreeSet<String>,
    ) -> Result<Option<BTreeSet<String>>, StyleTraceError> {
        match name {
            "Omit" => {
                let Some(target) = args.first() else {
                    return Ok(Some(BTreeSet::new()));
                };
                let mut names = self.resolve_prop_names(module_path, target, env, visited)?;
                if let Some(keys) = args.get(1) {
                    for key in self.resolve_literal_names(module_path, keys, env, visited)? {
                        names.remove(&key);
                    }
                }
                Ok(Some(names))
            }
            "Pick" => {
                let Some(target) = args.first() else {
                    return Ok(Some(BTreeSet::new()));
                };
                let names = self.resolve_prop_names(module_path, target, env, visited)?;
                let keys = args
                    .get(1)
                    .map(|expr| self.resolve_literal_names(module_path, expr, env, visited))
                    .transpose()?
                    .unwrap_or_default();
                Ok(Some(names.intersection(&keys).cloned().collect()))
            }
            "Nested" | "Pretty" | "ConditionalValue" | "StylePropValue" | "WithEscapeHatch"
            | "OnlyKnown" => {
                let Some(target) = args.first() else {
                    return Ok(Some(BTreeSet::new()));
                };
                Ok(Some(self.resolve_prop_names(
                    module_path,
                    target,
                    env,
                    visited,
                )?))
            }
            "Assign" | "DistributiveUnion" => {
                let mut names = BTreeSet::new();
                if let Some(left) = args.first() {
                    names.extend(self.resolve_prop_names(module_path, left, env, visited)?);
                }
                if let Some(right) = args.get(1) {
                    names.extend(self.resolve_prop_names(module_path, right, env, visited)?);
                }
                Ok(Some(names))
            }
            "Partial" | "Required" | "Readonly" | "Array" => {
                let Some(target) = args.first() else {
                    return Ok(Some(BTreeSet::new()));
                };
                Ok(Some(self.resolve_prop_names(
                    module_path,
                    target,
                    env,
                    visited,
                )?))
            }
            _ => Ok(None),
        }
    }

    fn resolve_decl_props(
        &mut self,
        module_path: &Path,
        declaration: &TypeDeclaration,
        args: &[TypeExpr],
        arg_module_path: &Path,
        inherited_env: &HashMap<String, BoundTypeExpr>,
        visited: &mut BTreeSet<String>,
    ) -> Result<BTreeSet<String>, StyleTraceError> {
        match declaration {
            TypeDeclaration::Interface(interface_decl) => {
                let next_env = bind_type_params(
                    &interface_decl.type_params,
                    args,
                    arg_module_path,
                    inherited_env,
                );
                let mut names = interface_decl.props.clone();
                for parent in &interface_decl.extends {
                    names.extend(self.resolve_prop_names(
                        module_path,
                        parent,
                        &next_env,
                        visited,
                    )?);
                }
                Ok(names)
            }
            TypeDeclaration::TypeAlias(type_alias) => {
                let next_env = bind_type_params(
                    &type_alias.type_params,
                    args,
                    arg_module_path,
                    inherited_env,
                );
                self.resolve_prop_names(module_path, &type_alias.expr, &next_env, visited)
            }
        }
    }

    fn resolve_builtin_literals(
        &mut self,
        module_path: &Path,
        name: &str,
        args: &[TypeExpr],
        env: &HashMap<String, BoundTypeExpr>,
        visited: &mut BTreeSet<String>,
    ) -> Result<Option<BTreeSet<String>>, StyleTraceError> {
        match name {
            "Extract" => {
                let left = args
                    .first()
                    .map(|expr| self.resolve_literal_names(module_path, expr, env, visited))
                    .transpose()?
                    .unwrap_or_default();
                let right = args
                    .get(1)
                    .map(|expr| self.resolve_literal_names(module_path, expr, env, visited))
                    .transpose()?
                    .unwrap_or_default();
                Ok(Some(left.intersection(&right).cloned().collect()))
            }
            "Exclude" => {
                let left = args
                    .first()
                    .map(|expr| self.resolve_literal_names(module_path, expr, env, visited))
                    .transpose()?
                    .unwrap_or_default();
                let right = args
                    .get(1)
                    .map(|expr| self.resolve_literal_names(module_path, expr, env, visited))
                    .transpose()?
                    .unwrap_or_default();
                Ok(Some(left.difference(&right).cloned().collect()))
            }
            _ => Ok(None),
        }
    }

    fn resolve_decl_literals(
        &mut self,
        module_path: &Path,
        declaration: &TypeDeclaration,
        args: &[TypeExpr],
        arg_module_path: &Path,
        inherited_env: &HashMap<String, BoundTypeExpr>,
        visited: &mut BTreeSet<String>,
    ) -> Result<BTreeSet<String>, StyleTraceError> {
        match declaration {
            TypeDeclaration::Interface(interface_decl) => {
                let next_env = bind_type_params(
                    &interface_decl.type_params,
                    args,
                    arg_module_path,
                    inherited_env,
                );
                let mut names = interface_decl.props.clone();
                for parent in &interface_decl.extends {
                    names.extend(self.resolve_literal_names(
                        module_path,
                        parent,
                        &next_env,
                        visited,
                    )?);
                }
                Ok(names)
            }
            TypeDeclaration::TypeAlias(type_alias) => {
                let next_env = bind_type_params(
                    &type_alias.type_params,
                    args,
                    arg_module_path,
                    inherited_env,
                );
                self.resolve_literal_names(module_path, &type_alias.expr, &next_env, visited)
            }
        }
    }

    fn resolve_declaration(
        &mut self,
        module_path: &Path,
        name: &str,
    ) -> Result<Option<(PathBuf, TypeDeclaration)>, StyleTraceError> {
        let module = self.load_module(module_path)?;
        if let Some(declaration) = module.declarations.get(name) {
            return Ok(Some((module_path.to_path_buf(), declaration.clone())));
        }

        if let Some(reexport) = module.reexports.get(name) {
            let imported_module = self.resolve_module_specifier(module_path, &reexport.source)?;
            return self.resolve_declaration(&imported_module, &reexport.imported_name);
        }

        for source in &module.export_all_sources {
            let imported_module = self.resolve_module_specifier(module_path, source)?;
            if let Some(resolved) = self.resolve_declaration(&imported_module, name)? {
                return Ok(Some(resolved));
            }
        }

        let Some(import_binding) = module.imports.get(name) else {
            return Ok(None);
        };
        let imported_module = self.resolve_module_specifier(module_path, &import_binding.source)?;
        self.resolve_declaration(&imported_module, &import_binding.imported_name)
    }

    fn load_module(&mut self, module_path: &Path) -> Result<ParsedModule, StyleTraceError> {
        let normalized = normalize_path(module_path);
        if let Some(module) = self.module_cache.get(&normalized) {
            return Ok(module.clone());
        }

        let source = fs::read_to_string(&normalized).map_err(|error| {
            StyleTraceError::new(format!("failed to read {}: {error}", normalized.display()))
        })?;
        let parsed = parse_module(&normalized, &source)?;
        self.module_cache.insert(normalized.clone(), parsed.clone());
        Ok(parsed)
    }

    fn resolve_module_specifier(
        &self,
        current_module: &Path,
        specifier: &str,
    ) -> Result<PathBuf, StyleTraceError> {
        if specifier == "@reference-ui/styled/types" {
            return Ok(self
                .workspace_root
                .join(STYLED_TYPES_ROOT)
                .join("system-types.d.ts"));
        }

        if let Some(rest) = specifier.strip_prefix("@reference-ui/styled/types/") {
            return Ok(self
                .workspace_root
                .join(STYLED_TYPES_ROOT)
                .join(format!("{rest}.d.ts")));
        }

        if specifier == "@reference-ui/react" {
            return Ok(self.workspace_root.join(REFERENCE_TYPES_INDEX_ENTRY));
        }

        if specifier.starts_with('.') {
            let base = current_module.parent().unwrap_or(current_module);
            let candidate = normalize_path(&base.join(specifier));
            if let Some(resolved) = resolve_local_module_path(&candidate) {
                return Ok(resolved);
            }
        }

        let resolution_root = current_module.parent().unwrap_or(current_module);
        if let Some(resolved) = resolve_external_import_path(resolution_root, specifier) {
            return Ok(prefer_workspace_source_module(&resolved, &self.workspace_root));
        }

        Err(StyleTraceError::new(format!(
            "unsupported module specifier {specifier} from {}",
            current_module.display()
        )))
    }
}

fn bind_type_params(
    params: &[String],
    args: &[TypeExpr],
    arg_module_path: &Path,
    inherited_env: &HashMap<String, BoundTypeExpr>,
) -> HashMap<String, BoundTypeExpr> {
    let mut env = inherited_env.clone();
    for (index, param) in params.iter().enumerate() {
        env.insert(
            param.clone(),
            BoundTypeExpr {
                module_path: arg_module_path.to_path_buf(),
                expr: args.get(index).cloned().unwrap_or(TypeExpr::Unknown),
            },
        );
    }
    env
}
