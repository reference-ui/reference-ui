//! Module-level pass over one file's namespace blocks and import-equals aliases, run before the statement walk so a forward
//! reference resolves like a backward one. A block's interface and type-alias members are keyed `N.M`. Its `import`
//! aliases are bound under their qualified names for the whole file, and under their bare names inside the block. An
//! alias or member that names a sibling of its block is written with the block's name in front, so the target text stays
//! valid from anywhere in the file. `require('m')` names a module object, so it never becomes a binding here.

use std::collections::{BTreeMap, BTreeSet};

use oxc_ast::ast::{
    Declaration, ExportNamedDeclaration, Statement, TSImportEqualsDeclaration,
    TSInterfaceDeclaration, TSModuleBlock, TSModuleDeclaration, TSModuleDeclarationBody,
    TSModuleDeclarationName, TSModuleReference, TSTypeAliasDeclaration,
};
use oxc_span::GetSpan;

use super::super::slice_span;
use crate::ast::model::{ImportBinding, ImportBindingKind};

/// The declaration a namespace member is emitted from.
pub(crate) enum MemberKind<'s, 'a> {
    Interface(&'s TSInterfaceDeclaration<'a>),
    TypeAlias(&'s TSTypeAliasDeclaration<'a>),
}

/// One namespace member: its block, whether it is exported (an ambient block exports every member), and its declaration.
pub(crate) struct MemberDecl<'s, 'a> {
    pub(crate) namespace: String,
    pub(crate) exported: bool,
    pub(crate) kind: MemberKind<'s, 'a>,
}

/// What the module-level pass learns about one file's namespaces and aliases.
#[derive(Default)]
pub(crate) struct NamespaceTable<'s, 'a> {
    /// Members keyed by their qualified name, `N.M`.
    pub(crate) members: BTreeMap<String, MemberDecl<'s, 'a>>,
    /// Alias bindings: a top-level alias under its local name, a block alias under its qualified name `N.local`.
    pub(crate) aliases: BTreeMap<String, ImportBinding>,
    /// Per block: the bare names visible inside it (its members and its aliases), as alias bindings.
    pub(crate) scopes: BTreeMap<String, BTreeMap<String, ImportBinding>>,
    /// Top-level `export import X = <entity>` aliases in source order: the exported name and the target text.
    pub(crate) export_aliases: Vec<(String, String)>,
}

pub(crate) fn collect_namespace_table<'s, 'a>(
    statements: &'s [Statement<'a>],
    source: &str,
) -> NamespaceTable<'s, 'a> {
    let mut table = NamespaceTable::default();
    for statement in statements {
        collect_statement(&mut table, statement, source);
    }
    table
}

fn collect_statement<'s, 'a>(
    table: &mut NamespaceTable<'s, 'a>,
    statement: &'s Statement<'a>,
    source: &str,
) {
    match statement {
        Statement::TSModuleDeclaration(declaration) => collect_block(table, declaration, source),
        Statement::ExportNamedDeclaration(export) => collect_export(table, export, source),
        Statement::TSImportEqualsDeclaration(import) => {
            collect_top_alias(table, import, false, source);
        }
        _ => {}
    }
}

/// The source text of an `import X = <entity>` target. `require('m')` has none: it names a module object, which tasty
/// does not model, so the caller reports it.
pub(crate) fn entity_target(reference: &TSModuleReference<'_>, source: &str) -> Option<String> {
    match reference {
        TSModuleReference::ExternalModuleReference(_) => None,
        TSModuleReference::IdentifierReference(_) | TSModuleReference::QualifiedName(_) => {
            Some(slice_span(source, reference.span()).to_string())
        }
    }
}

/// An alias binding that expands to `target` wherever a reference names the alias.
pub(crate) fn alias_binding(target: String) -> ImportBinding {
    ImportBinding {
        kind: ImportBindingKind::Alias,
        imported_name: target,
        source_module: String::new(),
        target_file_id: None,
    }
}

fn collect_export<'s, 'a>(
    table: &mut NamespaceTable<'s, 'a>,
    export: &'s ExportNamedDeclaration<'a>,
    source: &str,
) {
    match &export.declaration {
        Some(Declaration::TSModuleDeclaration(declaration)) => {
            collect_block(table, declaration, source);
        }
        Some(Declaration::TSImportEqualsDeclaration(import)) => {
            collect_top_alias(table, import, true, source);
        }
        _ => {}
    }
}

fn collect_top_alias<'s, 'a>(
    table: &mut NamespaceTable<'s, 'a>,
    import: &TSImportEqualsDeclaration<'a>,
    exported: bool,
    source: &str,
) {
    let Some(target) = entity_target(&import.module_reference, source) else {
        return;
    };
    let local = import.id.name.to_string();
    if exported {
        table.export_aliases.push((local.clone(), target.clone()));
    }
    table.aliases.insert(local, alias_binding(target));
}

fn collect_block<'s, 'a>(
    table: &mut NamespaceTable<'s, 'a>,
    declaration: &'s TSModuleDeclaration<'a>,
    source: &str,
) {
    let (
        TSModuleDeclarationName::Identifier(id),
        Some(TSModuleDeclarationBody::TSModuleBlock(block)),
    ) = (&declaration.id, &declaration.body)
    else {
        return;
    };
    let namespace = id.name.to_string();
    let items = block_items(block, declaration.declare, source);
    let locals: BTreeSet<String> = items.iter().map(|item| item.name().to_string()).collect();
    let scope = table.scopes.entry(namespace.clone()).or_default();

    for item in items {
        match item {
            BlockItem::Member {
                name,
                exported,
                kind,
            } => {
                let key = qualified_name(&namespace, &name);
                scope.insert(name, alias_binding(key.clone()));
                table.members.insert(
                    key,
                    MemberDecl {
                        namespace: namespace.clone(),
                        exported,
                        kind,
                    },
                );
            }
            BlockItem::Alias { local, target } => {
                let target = scoped_target(&namespace, &target, &locals);
                scope.insert(local.clone(), alias_binding(target.clone()));
                table
                    .aliases
                    .insert(qualified_name(&namespace, &local), alias_binding(target));
            }
        }
    }
}

/// One statement of a namespace block that the table records.
enum BlockItem<'s, 'a> {
    Member {
        name: String,
        exported: bool,
        kind: MemberKind<'s, 'a>,
    },
    Alias {
        local: String,
        target: String,
    },
}

impl BlockItem<'_, '_> {
    fn name(&self) -> &str {
        match self {
            Self::Member { name, .. } => name,
            Self::Alias { local, .. } => local,
        }
    }
}

fn block_items<'s, 'a>(
    block: &'s TSModuleBlock<'a>,
    ambient: bool,
    source: &str,
) -> Vec<BlockItem<'s, 'a>> {
    block
        .body
        .iter()
        .filter_map(|statement| block_item(statement, ambient, source))
        .collect()
}

fn block_item<'s, 'a>(
    statement: &'s Statement<'a>,
    ambient: bool,
    source: &str,
) -> Option<BlockItem<'s, 'a>> {
    match statement {
        Statement::TSInterfaceDeclaration(decl) => Some(BlockItem::Member {
            name: decl.id.name.to_string(),
            exported: ambient,
            kind: MemberKind::Interface(decl),
        }),
        Statement::TSTypeAliasDeclaration(decl) => Some(BlockItem::Member {
            name: decl.id.name.to_string(),
            exported: ambient,
            kind: MemberKind::TypeAlias(decl),
        }),
        Statement::TSImportEqualsDeclaration(import) => block_alias(import, source),
        Statement::ExportNamedDeclaration(export) => exported_block_item(export, source),
        _ => None,
    }
}

fn exported_block_item<'s, 'a>(
    export: &'s ExportNamedDeclaration<'a>,
    source: &str,
) -> Option<BlockItem<'s, 'a>> {
    match &export.declaration {
        Some(Declaration::TSInterfaceDeclaration(decl)) => Some(BlockItem::Member {
            name: decl.id.name.to_string(),
            exported: true,
            kind: MemberKind::Interface(decl),
        }),
        Some(Declaration::TSTypeAliasDeclaration(decl)) => Some(BlockItem::Member {
            name: decl.id.name.to_string(),
            exported: true,
            kind: MemberKind::TypeAlias(decl),
        }),
        Some(Declaration::TSImportEqualsDeclaration(import)) => block_alias(import, source),
        _ => None,
    }
}

fn block_alias<'s, 'a>(
    import: &TSImportEqualsDeclaration<'a>,
    source: &str,
) -> Option<BlockItem<'s, 'a>> {
    let target = entity_target(&import.module_reference, source)?;
    Some(BlockItem::Alias {
        local: import.id.name.to_string(),
        target,
    })
}

/// A block-level target whose head names a sibling of the block gets the block's name in front.
fn scoped_target(namespace: &str, target: &str, locals: &BTreeSet<String>) -> String {
    let head = target.split('.').next().unwrap_or(target);
    if locals.contains(head) {
        qualified_name(namespace, target)
    } else {
        target.to_string()
    }
}

fn qualified_name(namespace: &str, name: &str) -> String {
    format!("{namespace}.{name}")
}
