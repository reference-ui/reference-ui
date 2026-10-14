//! Namespace members and export aliases, applied once a file's statements are walked. A member `N.M` becomes a symbol named
//! `N.M` when a reference or an export names it, and it lowers under its block's scope, so a bare name inside the block
//! resolves to the block's own member or alias. An exported alias of a same-file name is an export binding. An exported
//! alias of an import is a re-export of the imported name, the bookkeeping `export { M as X } from` already leaves behind.

use std::collections::{BTreeMap, BTreeSet};

use oxc_ast::ast::Comment;
use oxc_span::GetSpan;

use super::super::symbols::{push_interface_shell, push_type_alias_shell};
use super::super::ExtractionContext;
use super::expand::expand_alias;
use super::table::{MemberDecl, MemberKind, NamespaceTable};
use crate::ast::model::{ImportBinding, ImportBindingKind, SymbolShell};
use crate::model::TypeRef;
use crate::scanner::{symbol_id, ScannedFile};

/// The file-level inputs the namespace pass reads once its statements are walked.
pub(crate) struct NamespaceView<'v, 's, 'a> {
    pub(crate) scanned_file: &'v ScannedFile,
    pub(crate) comments: &'v [Comment],
    pub(crate) file_bindings: &'v BTreeMap<String, ImportBinding>,
    pub(crate) table: &'v NamespaceTable<'s, 'a>,
}

impl NamespaceView<'_, '_, '_> {
    /// Records each top-level `export import X = <entity>`: a same-file target becomes an export binding, and an imported
    /// target becomes a re-export of the imported name (`*` for a whole namespace import).
    pub(crate) fn record_export_aliases(
        &self,
        export_bindings: &mut BTreeMap<String, String>,
        reexport_target: &mut BTreeMap<String, (String, String)>,
    ) {
        for (exported, target) in &self.table.export_aliases {
            let expanded = expand_alias(self.file_bindings, target);
            match self.import_export(&expanded) {
                Some(reexport) => {
                    reexport_target.insert(exported.clone(), reexport);
                }
                None => {
                    export_bindings.insert(exported.clone(), expanded);
                }
            }
        }
    }

    /// The re-export an expanded entity names when its head is an import: the target file and the export name it reads.
    fn import_export(&self, expanded: &str) -> Option<(String, String)> {
        let (head, rest) = split_head(expanded);
        let binding = self.file_bindings.get(head)?;
        let target_file = binding.target_file_id.clone()?;
        Some((target_file, reexport_name(binding, rest)?))
    }

    /// Emits each namespace member that a seed or an emitted shell names, and each member those name in turn.
    pub(crate) fn materialize(&self, seeds: Vec<String>, exports: &mut Vec<SymbolShell>) {
        let mut emitted: BTreeSet<String> = exports.iter().map(|shell| shell.id.clone()).collect();
        let mut pending = seeds;
        for shell in exports.iter() {
            pending.extend(reference_names(shell));
        }

        while let Some(key) = pending.pop() {
            let Some(member) = self.table.members.get(&key) else {
                continue;
            };
            if !emitted.insert(symbol_id(&self.scanned_file.file_id, &key)) {
                continue;
            }
            let Some(shell) = self.member_shell(&key, member) else {
                continue;
            };
            pending.extend(reference_names(&shell));
            exports.push(shell);
        }
    }

    /// One member's shell, lowered under its block's scope and named by its qualified key.
    fn member_shell(&self, key: &str, member: &MemberDecl<'_, '_>) -> Option<SymbolShell> {
        let file = self.scanned_file;
        let bindings = self.scoped_bindings(&member.namespace);
        let ctx = ExtractionContext {
            source: &file.source,
            comments: self.comments,
            import_bindings: &bindings,
            module_specifier: &file.module_specifier,
            library: &file.library,
        };
        let mut shells = Vec::new();
        match &member.kind {
            MemberKind::Interface(decl) => push_interface_shell(
                &file.file_id,
                &ctx,
                decl,
                decl.span(),
                member.exported,
                &mut shells,
            ),
            MemberKind::TypeAlias(decl) => push_type_alias_shell(
                &file.file_id,
                &ctx,
                decl,
                decl.span(),
                member.exported,
                &mut shells,
            ),
        }
        let mut shell = shells.pop()?;
        shell.name = key.to_string();
        shell.id = symbol_id(&file.file_id, key);
        Some(shell)
    }

    /// The file's bindings with the block's own names laid over them, so a bare name inside the block resolves first.
    fn scoped_bindings(&self, namespace: &str) -> BTreeMap<String, ImportBinding> {
        let mut bindings = self.file_bindings.clone();
        if let Some(scope) = self.table.scopes.get(namespace) {
            bindings.extend(
                scope
                    .iter()
                    .map(|(name, binding)| (name.clone(), binding.clone())),
            );
        }
        bindings
    }
}

/// An entity's head and the rest after its first dot, if it has one.
fn split_head(expanded: &str) -> (&str, Option<&str>) {
    match expanded.split_once('.') {
        Some((head, rest)) => (head, Some(rest)),
        None => (expanded, None),
    }
}

/// The export name an import exposes for an entity: a namespace member, the namespace itself (`*`), or the imported name.
fn reexport_name(binding: &ImportBinding, rest: Option<&str>) -> Option<String> {
    match (&binding.kind, rest) {
        (ImportBindingKind::Namespace, Some(member)) => Some(member.to_string()),
        (ImportBindingKind::Namespace, None) => Some("*".to_string()),
        (ImportBindingKind::Named | ImportBindingKind::Default, None) => {
            Some(binding.imported_name.clone())
        }
        _ => None,
    }
}

/// The bare names a shell's references mention, which may name a namespace member.
fn reference_names(shell: &SymbolShell) -> Vec<String> {
    shell
        .references
        .iter()
        .filter_map(|type_ref| match type_ref {
            TypeRef::Reference {
                name,
                type_parameter: false,
                ..
            } => Some(name.clone()),
            _ => None,
        })
        .collect()
}
