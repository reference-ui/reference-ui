//! Scope-aware traversal for the JSX walk: entering and leaving a scope pushes and pops its shadow
//! and opaque frames, declarations and parameters record their names there, and every JSX opening
//! element is handed to the visitor's tag gate. The shadow stack and the gate share `JsxVisitor`
//! state, so this file only moves frames and dispatches; the decisions live in `mod.rs`.

use std::cell::Cell;

use rustc_hash::FxHashSet;

use oxc_ast::ast::{
    Class, FormalParameters, Function, JSXOpeningElement, VariableDeclaration, VariableDeclarator,
};
use oxc_ast_visit::{walk, Visit};
use oxc_syntax::scope::ScopeFlags;
use oxc_syntax::scope::ScopeId as OxcScopeId;

use super::super::{record_declarator_shadow, record_param_shadows};
use super::aliases::is_const_kind;
use super::JsxVisitor;

impl<'a, 'b> Visit<'a> for JsxVisitor<'a, 'b> {
    fn enter_scope(&mut self, _flags: ScopeFlags, _scope_id: &Cell<Option<OxcScopeId>>) {
        self.shadows.push(FxHashSet::default());
        self.opaque.push(FxHashSet::default());
    }

    fn leave_scope(&mut self) {
        self.shadows.pop();
        self.opaque.pop();
    }

    fn visit_variable_declaration(&mut self, decl: &VariableDeclaration<'a>) {
        let prev = self.decl_kind;
        self.decl_kind = decl.kind;
        walk::walk_variable_declaration(self, decl);
        self.decl_kind = prev;
    }

    fn visit_formal_parameters(&mut self, params: &FormalParameters<'a>) {
        record_param_shadows(&mut self.shadows, params);
        record_param_shadows(&mut self.opaque, params);
        walk::walk_formal_parameters(self, params);
    }

    fn visit_function(&mut self, func: &Function<'a>, flags: ScopeFlags) {
        // The name binds in the enclosing scope, like the collector; opaque
        // only, never a shadow, matching the extract visitor's silence.
        if let Some(id) = &func.id {
            if let Some(scope) = self.opaque.last_mut() {
                scope.insert(id.name.to_string());
            }
        }
        walk::walk_function(self, func, flags);
    }

    fn visit_class(&mut self, class: &Class<'a>) {
        if let Some(id) = &class.id {
            if let Some(scope) = self.opaque.last_mut() {
                scope.insert(id.name.to_string());
            }
        }
        walk::walk_class(self, class);
    }

    fn visit_variable_declarator(&mut self, decl: &VariableDeclarator<'a>) {
        walk::walk_variable_declarator(self, decl);
        record_declarator_shadow(&mut self.shadows, decl);
        if !is_const_kind(self.decl_kind) {
            record_declarator_shadow(&mut self.opaque, decl);
        }
    }

    fn visit_jsx_opening_element(&mut self, elem: &JSXOpeningElement<'a>) {
        self.handle_opening(elem);
        walk::walk_jsx_opening_element(self, elem);
    }
}
