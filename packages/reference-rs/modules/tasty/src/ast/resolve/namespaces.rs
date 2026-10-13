//! Namespace re-export linking: `export * as ns from './m'` exposes one namespace named `ns`, never the target's flat names.
//! A named import of such a binding (`import { ns } from './barrel'`) is rebound to the namespace's own file as a namespace
//! import, so a qualified `ns.Leaf` reference resolves through the same path `import * as ns` already uses. Named re-export
//! chains (`export { ns } from './barrel'`) are followed until one binding names the namespace, and the walk is bounded by the
//! file count so a re-export cycle ends it. The rebinding runs once over the parsed files, before any index is built.

use std::collections::BTreeMap;

use crate::ast::model::{ImportBindingKind, ParsedFileAst};

/// Rebinds every named import of a namespace re-export to a namespace import of the namespace's file.
pub(super) fn link_namespace_imports(parsed_files: &mut [ParsedFileAst]) {
    for (file_index, local_name, namespace_file) in namespace_rebinds(parsed_files) {
        let Some(binding) = parsed_files[file_index]
            .import_bindings
            .get_mut(&local_name)
        else {
            continue;
        };
        binding.kind = ImportBindingKind::Namespace;
        binding.imported_name = "*".to_string();
        binding.target_file_id = Some(namespace_file);
    }
}

/// Each named import whose imported name is a namespace in its target, as (file index, local name, namespace file).
fn namespace_rebinds(parsed_files: &[ParsedFileAst]) -> Vec<(usize, String, String)> {
    let by_file_id = parsed_files
        .iter()
        .map(|parsed| (parsed.file_id.as_str(), parsed))
        .collect::<BTreeMap<_, _>>();
    let mut rebinds = Vec::new();
    for (file_index, parsed) in parsed_files.iter().enumerate() {
        for (local_name, binding) in &parsed.import_bindings {
            if !matches!(binding.kind, ImportBindingKind::Named) {
                continue;
            }
            let Some(target_file_id) = binding.target_file_id.as_deref() else {
                continue;
            };
            if let Some(namespace_file) =
                namespace_target(&by_file_id, target_file_id, &binding.imported_name)
            {
                rebinds.push((file_index, local_name.clone(), namespace_file));
            }
        }
    }
    rebinds
}

/// The file a namespace re-export names when `name` is exported by `file_id`. Each hop maps the export name to its
/// local binding, then follows that re-export to its target; the first binding whose remote name is `*` is the namespace.
fn namespace_target(
    by_file_id: &BTreeMap<&str, &ParsedFileAst>,
    file_id: &str,
    name: &str,
) -> Option<String> {
    let mut file = file_id;
    let mut export_name = name;
    for _ in 0..by_file_id.len() {
        let parsed = by_file_id.get(file)?;
        let local = parsed
            .export_bindings
            .get(export_name)
            .map_or(export_name, String::as_str);
        let (target, remote) = parsed.reexport_target.get(local)?;
        if remote.as_str() == "*" {
            return Some(target.clone());
        }
        file = target.as_str();
        export_name = remote.as_str();
    }
    None
}
