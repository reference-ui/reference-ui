//! One pass over a parsed program that records every value binding in scope.
//! Declarators of every kind, function and catch params (including
//! destructured names), function and class names, imports, and enum names
//! all become bindings in the scope that declares them. Identifier
//! declarators with literal, object, array, or branching inits carry values,
//! and destructuring patterns bind the entries they select; const objects
//! additionally resolve identifier values and static spreads. Baked entries
//! strip when their source was written anywhere in the project. Everything
//! else binds to shadow. Scope ids allocate one per `enter_scope` in walk
//! order, exactly as the extract visitor counts them, so a use site and its
//! bindings always meet at the same id. A second pass then lowers pure-helper
//! descriptors into the finished table so captures bake order-independently.

mod clear;
mod declarator;
mod imports;
mod params;
mod token_init;

use std::cell::Cell;

use oxc_ast::ast::{
    Class, Function, ImportDeclaration, Program, VariableDeclaration, VariableDeclarationKind,
    VariableDeclarator,
};
use oxc_ast_visit::{walk, Visit};

use super::binding::{Binding, BindingInit, BindingKind};
use super::fill::{OriginFill, SpreadResidue};
use super::lookup::ImportLookup;
use super::table::{ScopeId, ScopeTable, ROOT_SCOPE};
use super::value::{self, Dep};
use crate::extract::constants::LocalConstants;

/// Collect every value binding of a program into its scope table.
///
/// `project` is the merged project bag: baked entries copied from a binding
/// written anywhere in the project strip before return, matching the
/// name-wide mutation poison the walkers already apply (SPEC-V2-35).
pub fn collect(program: &Program<'_>, project: &LocalConstants) -> ScopeTable {
    collect_inner(program, project, None).0
}

/// Collect one origin file's table against its resolved imports, harvesting
/// the nested-spread residue markers refusals leave behind. Helpers and call
/// inits bake captures through the resolved map, never the name-wide bag.
pub fn collect_with(
    program: &Program<'_>,
    project: &LocalConstants,
    fill: &OriginFill<'_>,
) -> (ScopeTable, Vec<SpreadResidue>) {
    collect_inner(program, project, Some(*fill))
}

/// Collect with an optional origin fill: same-file shapes bake identically
/// either way, and only the fill answers imports.
fn collect_inner(
    program: &Program<'_>,
    project: &LocalConstants,
    fill: Option<OriginFill<'_>>,
) -> (ScopeTable, Vec<SpreadResidue>) {
    // function Card({ color }) { css({ color }) }  — `color` binds as a param
    let mut collector = ScopeCollector {
        table: ScopeTable::new(),
        stack: Vec::new(),
        decl_kind: VariableDeclarationKind::Const,
        deps: Vec::new(),
        factory: Vec::new(),
        token_waits: Vec::new(),
        fill,
        residues: Vec::new(),
    };
    collector.visit_program(program);
    let ScopeCollector {
        mut table,
        deps,
        factory,
        token_waits,
        fill,
        residues,
        ..
    } = collector;
    clear::clear_unbound_calls(&mut table, &deps, &factory, &token_waits);
    value::strip_stale(&mut table, &deps, project);
    let lookup = match fill {
        Some(baked) => ImportLookup::Binding {
            values: baked.resolved,
            fallback: project,
        },
        None => ImportLookup::ProjectBag(project),
    };
    crate::extract::fold::fence_attach::attach_pure_fns(program, &mut table, lookup);
    super::call_init::fold_call_inits(program, &mut table, lookup);
    (table, residues)
}

/// A factory-call init awaiting import verification: the callee must resolve
/// to a `keyframes`/`positionTry` import from a Reference package.
pub(crate) struct FactoryWait {
    pub(crate) scope: ScopeId,
    pub(crate) name: String,
    pub(crate) callee: String,
}

/// A `token()` init awaiting import verification: the callee must resolve
/// to a `token` import from a Reference package. Recorded optimistically so
/// forward imports (imports hoist) verify after the visit.
pub(crate) struct TokenWait {
    pub(crate) scope: ScopeId,
    pub(crate) name: String,
    pub(crate) callee: String,
}

/// Visitor recording bindings in the innermost scope at each declaration.
pub(crate) struct ScopeCollector<'v> {
    pub(crate) table: ScopeTable,
    pub(crate) stack: Vec<ScopeId>,
    pub(crate) decl_kind: VariableDeclarationKind,
    pub(crate) deps: Vec<Dep>,
    pub(crate) factory: Vec<FactoryWait>,
    pub(crate) token_waits: Vec<TokenWait>,
    pub(crate) fill: Option<OriginFill<'v>>,
    pub(crate) residues: Vec<SpreadResidue>,
}

impl<'a, 'v> Visit<'a> for ScopeCollector<'v> {
    fn enter_scope(
        &mut self,
        _flags: oxc_syntax::scope::ScopeFlags,
        _scope_id: &Cell<Option<oxc_syntax::scope::ScopeId>>,
    ) {
        let parent = self.stack.last().copied();
        let id = self.table.alloc_scope(parent);
        self.stack.push(id);
    }

    fn leave_scope(&mut self) {
        self.stack.pop();
    }

    fn visit_variable_declaration(&mut self, decl: &VariableDeclaration<'a>) {
        let prev = self.decl_kind;
        self.decl_kind = decl.kind;
        walk::walk_variable_declaration(self, decl);
        self.decl_kind = prev;
    }

    fn visit_variable_declarator(&mut self, decl: &VariableDeclarator<'a>) {
        declarator::record_declarator(self, decl);
        walk::walk_variable_declarator(self, decl);
    }

    fn visit_formal_parameters(&mut self, params: &oxc_ast::ast::FormalParameters<'a>) {
        // function f(a, { b }, ...rest)  — every bound name is a param shadow
        for param in &params.items {
            params::record_param(self, param);
        }
        if let Some(rest) = &params.rest {
            params::declare_pattern(self, &rest.rest.argument, BindingKind::Param);
        }
        walk::walk_formal_parameters(self, params);
    }

    fn visit_function(&mut self, func: &Function<'a>, flags: oxc_syntax::scope::ScopeFlags) {
        // function helper() {}  — the name binds in the enclosing scope
        if let Some(id) = &func.id {
            self.declare_current(
                id.name.as_str(),
                Binding {
                    kind: BindingKind::Function,
                    init: None,
                    span: id.span,
                },
            );
        }
        walk::walk_function(self, func, flags);
    }

    fn visit_class(&mut self, class: &Class<'a>) {
        // class Theme {}  — the name binds in the enclosing scope
        if let Some(id) = &class.id {
            self.declare_current(
                id.name.as_str(),
                Binding {
                    kind: BindingKind::Function,
                    init: None,
                    span: id.span,
                },
            );
        }
        walk::walk_class(self, class);
    }

    fn visit_catch_parameter(&mut self, param: &oxc_ast::ast::CatchParameter<'a>) {
        // catch (e) {}  — the param binds in the catch scope
        params::declare_pattern(self, &param.pattern, BindingKind::Param);
        walk::walk_catch_parameter(self, param);
    }

    fn visit_import_declaration(&mut self, decl: &ImportDeclaration<'a>) {
        imports::record_import(self, decl);
        walk::walk_import_declaration(self, decl);
    }

    fn visit_ts_enum_declaration(&mut self, decl: &oxc_ast::ast::TSEnumDeclaration<'a>) {
        // enum Sizes { Small = '4px' }  — initialized members fold (SPEC-V2-45)
        self.declare_current(
            decl.id.name.as_str(),
            Binding {
                kind: BindingKind::Enum,
                init: Some(BindingInit::Object(super::types::enum_object(decl))),
                span: decl.id.span,
            },
        );
        walk::walk_ts_enum_declaration(self, decl);
    }
}

impl ScopeCollector<'_> {
    /// The innermost scope at the current visit position.
    pub(crate) fn current(&self) -> ScopeId {
        self.stack.last().copied().unwrap_or(ROOT_SCOPE)
    }

    /// Declare a binding in the innermost scope.
    pub(crate) fn declare_current(&mut self, name: &str, binding: Binding) {
        let scope = self.current();
        self.table.declare(scope, name, binding);
    }
}
