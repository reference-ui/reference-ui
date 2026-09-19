//! Second-pass helper lowering into the finished scope table (SPEC-V2-39).
//!
//! `attach_pure_fns` walks the program after collection and lowers every
//! same-file helper into its binding, so captures bake order-independently
//! the way v2's resolver sees the whole file. The walk replays the
//! collector's scope ids one per `enter_scope` in walk order without pruning
//! anything, and each attach additionally checks the binding kind and
//! declaring span — a misaligned id fails closed to no descriptor, never to
//! a wrong one. Named function expressions attach only their outer
//! declarator name; the inner name never binds a call site. Exported
//! declarations attach under their declared name, so the descriptor
//! export (SPEC-V2-57) carries them cross-file.

use oxc_ast_visit::Visit;

use super::fence::{lower_callable_expr, lower_function, PureFn};

/// Lower every same-file helper into its binding after collection.
///
/// This second pass runs on the finished scope table so captures bake
/// order-independently, the way v2's resolver sees the whole file. The walk
/// replays the collector's scope ids one per `enter_scope` in walk order
/// without pruning anything, and each attach additionally checks the binding
/// kind and declaring span — a misaligned id fails closed to no descriptor,
/// never to a wrong one. Named function expressions attach only their outer
/// declarator name; the inner name never binds a call site. Exported
/// declarations attach under their declared name for the descriptor export.
pub fn attach_pure_fns(
    program: &oxc_ast::ast::Program<'_>,
    table: &mut crate::extract::scope::ScopeTable,
    project: &crate::extract::constants::LocalConstants,
) {
    let chain = crate::extract::scope::ScopeChain::new(table, import_lookup(project));
    let mut pass = AttachPass {
        chain,
        stack: Vec::new(),
        next: 0,
        pending: Vec::new(),
    };
    pass.visit_program(program);
    let pending = std::mem::take(&mut pass.pending);
    drop(pass);
    for (scope, name, span, func) in pending {
        table.attach_pure_fn(scope, &name, span, func);
    }
}

/// The merge-era import lookup captures bake through, like identifiers.
fn import_lookup(
    project: &crate::extract::constants::LocalConstants,
) -> crate::extract::scope::ImportLookup<'_> {
    crate::extract::scope::ImportLookup::ProjectBag(project)
}

/// Second-pass visitor lowering helpers with the finished table in hand.
struct AttachPass<'a> {
    chain: crate::extract::scope::ScopeChain<'a>,
    stack: Vec<crate::extract::scope::ScopeId>,
    next: crate::extract::scope::ScopeId,
    pending: Vec<(
        crate::extract::scope::ScopeId,
        String,
        oxc_span::Span,
        PureFn,
    )>,
}

impl AttachPass<'_> {
    /// The innermost scope at the current visit position.
    fn current(&self) -> crate::extract::scope::ScopeId {
        self.stack
            .last()
            .copied()
            .unwrap_or(crate::extract::scope::ROOT_SCOPE)
    }
}

impl<'a> oxc_ast_visit::Visit<'a> for AttachPass<'a> {
    fn enter_scope(
        &mut self,
        _flags: oxc_syntax::scope::ScopeFlags,
        _scope_id: &std::cell::Cell<Option<oxc_syntax::scope::ScopeId>>,
    ) {
        let id = self.next;
        self.next += 1;
        self.stack.push(id);
    }

    fn leave_scope(&mut self) {
        self.stack.pop();
    }

    fn visit_variable_declarator(&mut self, decl: &oxc_ast::ast::VariableDeclarator<'a>) {
        if let oxc_ast::ast::BindingPattern::BindingIdentifier(ident) = &decl.id {
            if let Some(init) = decl.init.as_ref() {
                let scoped = self.chain.at(self.current());
                if let Some(mut func) = lower_callable_expr(init, scoped) {
                    func.residue = super::residue::expr_entry_residue(init, scoped).is_some();
                    self.pending
                        .push((self.current(), ident.name.to_string(), ident.span, func));
                }
            }
        }
        oxc_ast_visit::walk::walk_variable_declarator(self, decl);
    }

    fn visit_statement(&mut self, stmt: &oxc_ast::ast::Statement<'a>) {
        if let oxc_ast::ast::Statement::FunctionDeclaration(func) = stmt {
            if let Some(id) = func.id.as_ref() {
                let scoped = self.chain.at(self.current());
                if let Some(mut lowered) = lower_function(func, scoped) {
                    lowered.residue = super::residue::fn_decl_residue(func, scoped);
                    self.pending
                        .push((self.current(), id.name.to_string(), id.span, lowered));
                }
            }
        }
        oxc_ast_visit::walk::walk_statement(self, stmt);
    }

    fn visit_export_named_declaration(
        &mut self,
        decl: &oxc_ast::ast::ExportNamedDeclaration<'a>,
    ) {
        if let Some(oxc_ast::ast::Declaration::FunctionDeclaration(func)) =
            decl.declaration.as_ref()
        {
            if let Some(id) = func.id.as_ref() {
                let scoped = self.chain.at(self.current());
                if let Some(mut lowered) = lower_function(func, scoped) {
                    lowered.residue = super::residue::fn_decl_residue(func, scoped);
                    self.pending
                        .push((self.current(), id.name.to_string(), id.span, lowered));
                }
            }
        }
        oxc_ast_visit::walk::walk_export_named_declaration(self, decl);
    }

    fn visit_export_default_declaration(
        &mut self,
        decl: &oxc_ast::ast::ExportDefaultDeclaration<'a>,
    ) {
        if let oxc_ast::ast::ExportDefaultDeclarationKind::FunctionDeclaration(func) =
            &decl.declaration
        {
            if let Some(id) = func.id.as_ref() {
                let scoped = self.chain.at(self.current());
                if let Some(mut lowered) = lower_function(func, scoped) {
                    lowered.residue = super::residue::fn_decl_residue(func, scoped);
                    self.pending
                        .push((self.current(), id.name.to_string(), id.span, lowered));
                }
            }
        }
        oxc_ast_visit::walk::walk_export_default_declaration(self, decl);
    }
}
