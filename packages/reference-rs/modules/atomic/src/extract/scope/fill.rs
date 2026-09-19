//! Origin-fill baking: import values for one origin file's scope table.
//! The value graph resolves every import of an origin file before the bake,
//! so identifier values and spreads of imports merge origin data instead of
//! dropping silently. Merged entries carry no strip dep — origins arrive
//! unmutated and bags never change — while refused spreads record residue
//! markers the importing file's use sites diagnose.

use std::collections::HashMap;

use super::binding::BindingKind;
use super::table::{ScopeId, ScopeTable};
use super::value::EntrySink;
use crate::extract::constants::{ConstObject, ObjectProp};
use crate::extract::resolver::{ResolvedExport, UnfoldableSpread, ValueRefused};

/// One origin file's resolved imports, for graph-backed collection.
/// The value graph resolves every import of the file before the bake, so
/// nested import spreads merge origin objects and refused ones record
/// residue markers instead of dropping silently.
#[derive(Debug, Clone, Copy)]
pub struct OriginFill<'v> {
    /// The origin file's path, for marker file names.
    pub file: &'v str,
    /// The origin file's content, for marker line numbers.
    pub content: &'v str,
    /// Resolved imports by local name, merged into the bake.
    pub resolved: &'v HashMap<String, ResolvedExport>,
    /// Refused imports by local name, recorded as markers.
    pub refused: &'v HashMap<String, ValueRefused>,
}

/// One nested spread the bake could not unfold, tagged with its dependent.
#[derive(Debug, Clone)]
pub struct SpreadResidue {
    /// Scope of the binding that carries the partial value.
    pub scope: ScopeId,
    /// Name of the binding that carries the partial value.
    pub name: String,
    /// The marker the use site diagnoses.
    pub marker: UnfoldableSpread,
}

/// The resolved origin value for an import binding, through the fill.
/// Same-file bindings never reach the map, so shadows keep shadowing even
/// when a file-level import shares the name.
pub(crate) fn fill_export<'f>(
    fill: Option<OriginFill<'f>>,
    table: &ScopeTable,
    scope: ScopeId,
    name: &str,
) -> Option<&'f ResolvedExport> {
    let fill = fill?;
    let (_, binding) = table.resolve_from(name, scope)?;
    if !matches!(binding.kind, BindingKind::Import(_)) {
        return None;
    }
    fill.resolved.get(name)
}

/// Record one fill entry: the origin's scalars or object under the key.
/// True when a kind merged; arrays and valueless exports fall through to
/// the base marker exactly like unresolvable same-file shapes.
pub(crate) fn record_fill_entry(sink: &mut EntrySink, key: &str, export: &ResolvedExport) -> bool {
    sink.residues.extend(export.unfoldable().iter().cloned());
    if !export.scalars().is_empty() {
        sink.entries.insert(
            key.to_string(),
            ObjectProp {
                leaves: export.scalars().to_vec(),
                nested: ConstObject::new(),
                residue: false,
            },
        );
        return true;
    }
    if let Some(map) = export.object() {
        sink.entries.insert(
            key.to_string(),
            ObjectProp {
                leaves: Vec::new(),
                nested: map.clone(),
                residue: false,
            },
        );
        return true;
    }
    false
}

/// Provenance for one copied identifier entry: the source binding.
pub(crate) fn push_provenance(sink: &mut EntrySink, key: &str, src_scope: ScopeId, src_name: &str) {
    use super::value::KeyProvenance;

    sink.provenances.push(KeyProvenance {
        key: key.to_string(),
        src_scope,
        src_name: src_name.to_string(),
        src_key: None,
    });
}
