//! Traces a higher-order component applied at a binding, such as `export const Fancy = withPad(Box)`.
//! A factory whose product forwards style props into one of its own parameters is evaluated against the call's arguments, each resolved in the calling module, so the wrapped component decides the verdict. Any other factory keeps the memoized no-argument verdict.
//! An argument that names no component leaves its binding untraced and is recorded for one `STT-W-UNRESOLVED-HOC-ARGUMENT` warning, instead of being guessed.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use super::analyzer::StyleTraceAnalyzer;
use super::memo::Verdict;
use super::model::{EdgeTarget, FactoryCall, FactoryTarget, TraceComponent};
use crate::resolver::StyleTraceError;

/// Applications that stand untraced with an unresolved argument, keyed by (module, binding) and
/// holding the HOC's name and the first argument it could not resolve. An entry is removed when its
/// binding traces, so the warnings report only the applications that are still untraced.
pub(super) type UnresolvedHocs = BTreeMap<(PathBuf, String), (String, usize)>;

/// One HOC application under evaluation: the module that holds the call and the binding it
/// initializes, the HOC's name, and each argument the call passes, resolved in `site`.
pub(super) struct HocCall<'a> {
    pub(super) site: &'a Path,
    pub(super) binding: &'a str,
    pub(super) hoc: &'a str,
    pub(super) args: &'a [Option<EdgeTarget>],
}

impl StyleTraceAnalyzer<'_> {
    /// The verdict of a factory call that initializes `binding` in `site`.
    pub(super) fn factory_call_is_traced(
        &mut self,
        site: &Path,
        binding: &str,
        call: &FactoryCall,
        stack: &mut Vec<String>,
    ) -> Result<Verdict, StyleTraceError> {
        let Some((factory_module, factory_name)) = self.resolve_factory(site, &call.target)? else {
            return Ok(None);
        };
        let forwarding = self
            .modules
            .get(&factory_module)
            .and_then(|module| module.factories.get(&factory_name))
            .filter(|factory| factory.forwards_params())
            .cloned();
        let Some(factory) = forwarding else {
            return self.factory_target_is_traced(site, &call.target, stack);
        };
        let hoc = HocCall {
            site,
            binding,
            hoc: &factory_name,
            args: &call.args,
        };
        let verdict =
            self.component_value_is_traced(&factory_module, &factory.component, stack, Some(&hoc))?;
        if verdict.is_some() {
            self.unresolved_hocs
                .remove(&(site.to_path_buf(), binding.to_string()));
        }
        Ok(verdict)
    }

    /// The module and name that define the factory a call targets; `None` when its import cannot resolve.
    pub(super) fn resolve_factory(
        &mut self,
        site: &Path,
        target: &FactoryTarget,
    ) -> Result<Option<(PathBuf, String)>, StyleTraceError> {
        match target {
            FactoryTarget::Local(name) => Ok(Some((site.to_path_buf(), name.clone()))),
            FactoryTarget::Imported {
                source,
                imported_name,
            } => {
                let Some(resolved) =
                    self.resolver
                        .resolve_imported_module(site, source, &self.sync_root)?
                else {
                    return Ok(None);
                };
                self.ensure_module_loaded(&resolved)?;
                Ok(Some((resolved, imported_name.clone())))
            }
        }
    }

    /// The verdict of a forwarding parameter: the argument the call passes in that position, resolved
    /// in the calling module. A position the call leaves unnamed traces nothing.
    pub(super) fn parameter_is_traced(
        &mut self,
        call: &HocCall<'_>,
        index: usize,
        stack: &mut Vec<String>,
    ) -> Result<Verdict, StyleTraceError> {
        match call.args.get(index).and_then(Option::as_ref) {
            Some(target) => self.edge_is_traced(call.site, target, stack, None),
            None => Ok(None),
        }
    }

    /// Record the first forwarding parameter the call leaves unnamed. Called only when the product
    /// did not trace, so an application that traces through another edge records nothing.
    pub(super) fn note_unresolved_arguments(
        &mut self,
        call: &HocCall<'_>,
        component: &TraceComponent,
    ) {
        let first = component
            .edges
            .iter()
            .filter_map(|edge| match &edge.target {
                EdgeTarget::Parameter(index) if !names_component(call, *index) => Some(*index),
                _ => None,
            })
            .min();
        if let Some(index) = first {
            self.unresolved_hocs
                .entry((call.site.to_path_buf(), call.binding.to_string()))
                .or_insert_with(|| (call.hoc.to_string(), index));
        }
    }
}

/// Whether the call names a component in parameter `index`.
fn names_component(call: &HocCall<'_>, index: usize) -> bool {
    matches!(call.args.get(index), Some(Some(_)))
}
