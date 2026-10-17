//! Builds the `ComponentTemplate` for one discovered component: it resolves the component's props annotation to
//! a declared type and flattens that type into the prop list. An annotation that cannot be resolved still yields a
//! template, which keeps the name as written with a guessed source, and records a diagnostic. It takes the
//! declaration, its module, the `TypeScope` and the diagnostics sink, and emits `None` for a props shape it does
//! not support.

use super::types::{resolve_component_props, resolve_named_type};
use super::TypeScope;
use crate::diagnostics::{AtlasDiagnostic, DiagnosticError};
use crate::internal::{ComponentDecl, ComponentTemplate, ModuleInfo, PropsAnnotation, ResolvedType};
use std::collections::HashSet;

pub(crate) fn build_component_template(
    component: &ComponentDecl,
    module: &ModuleInfo,
    scope: TypeScope<'_>,
    diagnostics: &mut Vec<AtlasDiagnostic>,
) -> Result<Option<ComponentTemplate>, DiagnosticError> {
    let (interface_name, interface_source, resolved_type) = match &component.props {
        PropsAnnotation::InlineObject => {
            diagnostics.push(crate::diagnostics::unsupported_props_annotation(
                &component.source_display,
                &component.name,
            )?);
            return Ok(None);
        }
        PropsAnnotation::Named(type_name) => {
            let found = resolve_named_type(scope, &module.path, type_name, &mut HashSet::new());
            if found.is_none() {
                diagnostics.push(crate::diagnostics::unresolved_props_type(
                    &component.source_display,
                    &component.name,
                    type_name,
                )?);
            }
            props_interface(module, type_name, found)
        }
        PropsAnnotation::None => (None, None, None),
    };

    let props = resolved_type
        .as_ref()
        .map(|resolved| resolve_component_props(scope, resolved))
        .unwrap_or_default();

    Ok(Some(ComponentTemplate {
        name: component.name.clone(),
        source: component.source_display.clone(),
        interface_name,
        interface_source,
        file_path: component.file_path.clone(),
        app_relative_path: component.app_relative_path.clone(),
        props,
    }))
}

/// The interface name, its source and the resolved type for a named props annotation. An unresolved name keeps
/// its written text, with a source guessed from its import.
fn props_interface(
    module: &ModuleInfo,
    type_name: &str,
    found: Option<ResolvedType>,
) -> (Option<String>, Option<String>, Option<ResolvedType>) {
    match found {
        Some(resolved) => (
            Some(resolved.name.clone()),
            Some(resolved.source.clone()),
            Some(resolved),
        ),
        None => (
            Some(type_name.to_string()),
            Some(guess_interface_source(module, type_name)),
            None,
        ),
    }
}

fn guess_interface_source(module: &ModuleInfo, type_name: &str) -> String {
    if let Some(binding) = module.imports.get(type_name) {
        if binding.source.starts_with('@') {
            return binding.source.clone();
        }
    }
    module.display_source.clone()
}
