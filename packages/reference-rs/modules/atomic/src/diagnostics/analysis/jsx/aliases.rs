//! Const ident alias map for one source: each `const X = Y` declarator, with its init peeled
//! through the extract's shared `peel`, so this path and the extract path classify `as`, parens,
//! and `!` inits identically. The map is scope-flattened on purpose (the last edge wins), and the
//! visitor's use-site kind gate covers shadowing.

use rustc_hash::FxHashMap;

use oxc_ast::ast::{
    BindingPattern, Expression, Program, VariableDeclaration, VariableDeclarationKind,
    VariableDeclarator,
};
use oxc_ast_visit::{walk, Visit};

use crate::extract::scope::peel;

/// One source's const ident alias edges (`const X = Y`, transparent
/// wrappers peeled through the extract's own `peel`): the mirror's flat
/// counterpart to the scope table's alias map. Scope-flattened like every
/// mirror read (F-G1b): repeated bindings keep the last edge, matching
/// runtime last-wins in one scope and approximating shadowing across
/// scopes. The shared peel keeps both paths classifying `as`/parens/
/// `!` inits identically; the use-site kind gate below covers shadowing.
pub(super) fn collect_ident_aliases(program: &Program<'_>) -> FxHashMap<String, String> {
    let mut collector = AliasCollector {
        aliases: FxHashMap::default(),
        kind: VariableDeclarationKind::Var,
    };
    collector.visit_program(program);
    collector.aliases
}

/// Visitor recording const ident declarators at every depth.
struct AliasCollector {
    aliases: FxHashMap<String, String>,
    kind: VariableDeclarationKind,
}

impl<'a> Visit<'a> for AliasCollector {
    fn visit_variable_declaration(&mut self, decl: &VariableDeclaration<'a>) {
        let prev = self.kind;
        self.kind = decl.kind;
        walk::walk_variable_declaration(self, decl);
        self.kind = prev;
    }

    fn visit_variable_declarator(&mut self, decl: &VariableDeclarator<'a>) {
        if !is_const_kind(self.kind) {
            return;
        }
        let BindingPattern::BindingIdentifier(ident) = &decl.id else {
            return;
        };
        let Some(init) = decl.init.as_ref() else {
            return;
        };
        if let Expression::Identifier(target) = peel(init) {
            if target.name.as_str() != ident.name.as_str() {
                self.aliases
                    .insert(ident.name.to_string(), target.name.to_string());
            }
        }
    }
}

/// True for declaration kinds that pin their init: `const` plus the
/// `using` forms, matching the scope table's kind map.
pub(super) fn is_const_kind(kind: VariableDeclarationKind) -> bool {
    matches!(
        kind,
        VariableDeclarationKind::Const
            | VariableDeclarationKind::Using
            | VariableDeclarationKind::AwaitUsing
    )
}
