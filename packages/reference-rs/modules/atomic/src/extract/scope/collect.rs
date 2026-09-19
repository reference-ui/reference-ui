//! One pass over a parsed program that records every value binding in scope.
//! Declarators of every kind, function and catch params (including
//! destructured names), function and class names, imports, and enum names
//! all become bindings in the scope that declares them. Only identifier
//! declarators with literal, object, or branching inits carry values —
//! everything else binds to shadow. Scope ids allocate one per
//! `enter_scope` in walk order, exactly as the extract visitor counts them,
//! so a use site and its bindings always meet at the same id.

use std::cell::Cell;

use oxc_ast::ast::{
    BindingPattern, Class, Function, ImportDeclaration, ImportDeclarationSpecifier,
    ImportOrExportKind, Program, VariableDeclaration, VariableDeclarationKind, VariableDeclarator,
};
use oxc_ast_visit::{walk, Visit};

use super::binding::{Binding, BindingKind, ImportRef};
use super::init::binding_init;
use super::table::{ScopeId, ScopeTable, ROOT_SCOPE};

/// Collect every value binding of a program into its scope table.
pub fn collect(program: &Program<'_>) -> ScopeTable {
    // function Card({ color }) { css({ color }) }  — `color` binds as a param
    let mut collector = ScopeCollector {
        table: ScopeTable::new(),
        stack: Vec::new(),
        decl_kind: VariableDeclarationKind::Const,
    };
    collector.visit_program(program);
    collector.table
}

/// Visitor recording bindings in the innermost scope at each declaration.
struct ScopeCollector {
    table: ScopeTable,
    stack: Vec<ScopeId>,
    decl_kind: VariableDeclarationKind,
}

impl<'a> Visit<'a> for ScopeCollector {
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
        record_declarator(self, decl);
        walk::walk_variable_declarator(self, decl);
    }

    fn visit_formal_parameters(&mut self, params: &oxc_ast::ast::FormalParameters<'a>) {
        // function f(a, { b }, ...rest)  — every bound name is a param shadow
        for param in &params.items {
            declare_pattern(self, &param.pattern, BindingKind::Param);
        }
        if let Some(rest) = &params.rest {
            declare_pattern(self, &rest.rest.argument, BindingKind::Param);
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
        declare_pattern(self, &param.pattern, BindingKind::Param);
        walk::walk_catch_parameter(self, param);
    }

    fn visit_import_declaration(&mut self, decl: &ImportDeclaration<'a>) {
        record_import(self, decl);
        walk::walk_import_declaration(self, decl);
    }

    fn visit_ts_enum_declaration(&mut self, decl: &oxc_ast::ast::TSEnumDeclaration<'a>) {
        // enum Size { Sm }  — the name shadows until SPEC-V2-45 folds members
        self.declare_current(
            decl.id.name.as_str(),
            Binding {
                kind: BindingKind::Enum,
                init: None,
                span: decl.id.span,
            },
        );
        walk::walk_ts_enum_declaration(self, decl);
    }
}

impl ScopeCollector {
    /// The innermost scope at the current visit position.
    fn current(&self) -> ScopeId {
        self.stack.last().copied().unwrap_or(ROOT_SCOPE)
    }

    /// Declare a binding in the innermost scope.
    fn declare_current(&mut self, name: &str, binding: Binding) {
        let scope = self.current();
        self.table.declare(scope, name, binding);
    }
}

/// Record a declarator: identifier inits carry values, destructured names shadow.
fn record_declarator(collector: &mut ScopeCollector, decl: &VariableDeclarator<'_>) {
    let kind = declaration_kind(collector.decl_kind);
    if let BindingPattern::BindingIdentifier(ident) = &decl.id {
        // const space = '2r'  — the name carries its leaves
        let init = decl.init.as_ref().and_then(binding_init);
        collector.declare_current(
            ident.name.as_str(),
            Binding {
                kind,
                init,
                span: ident.span,
            },
        );
        return;
    }
    // const { color } = theme  — names shadow without values (SPEC-V2-32)
    declare_pattern(collector, &decl.id, kind);
}

/// Record every name a pattern binds, with no value.
fn declare_pattern(
    collector: &mut ScopeCollector,
    pattern: &BindingPattern<'_>,
    kind: BindingKind,
) {
    let mut names = Vec::new();
    pattern_names(pattern, &mut names);
    for (name, span) in names {
        collector.declare_current(
            &name,
            Binding {
                kind: kind.clone(),
                init: None,
                span,
            },
        );
    }
}

/// Gather every name a binding pattern declares, however nested.
fn pattern_names(pattern: &BindingPattern<'_>, out: &mut Vec<(String, oxc_span::Span)>) {
    match pattern {
        BindingPattern::BindingIdentifier(ident) => {
            // color  in  { color }  /  [color]  /  (color)
            out.push((ident.name.to_string(), ident.span));
        }
        BindingPattern::ObjectPattern(obj) => object_pattern_names(obj, out),
        BindingPattern::ArrayPattern(arr) => array_pattern_names(arr, out),
        BindingPattern::AssignmentPattern(assign) => {
            // { color = 'red' }  — the default does not change the binding
            pattern_names(&assign.left, out);
        }
    }
}

/// Gather the names an object pattern binds: property values plus rest.
fn object_pattern_names(
    obj: &oxc_ast::ast::ObjectPattern<'_>,
    out: &mut Vec<(String, oxc_span::Span)>,
) {
    // { primary: color, ...space }  — values bind, keys do not
    for prop in &obj.properties {
        pattern_names(&prop.value, out);
    }
    if let Some(rest) = &obj.rest {
        pattern_names(&rest.argument, out);
    }
}

/// Gather the names an array pattern binds: elements plus rest.
fn array_pattern_names(
    arr: &oxc_ast::ast::ArrayPattern<'_>,
    out: &mut Vec<(String, oxc_span::Span)>,
) {
    // [a, , ...rest]  — holes bind nothing
    for element in arr.elements.iter().flatten() {
        pattern_names(element, out);
    }
    if let Some(rest) = &arr.rest {
        pattern_names(&rest.argument, out);
    }
}

/// Record the value bindings of an import declaration, skipping type-only.
fn record_import(collector: &mut ScopeCollector, decl: &ImportDeclaration<'_>) {
    if decl.import_kind == ImportOrExportKind::Type {
        return;
    }
    let Some(specifiers) = &decl.specifiers else {
        return;
    };
    for spec in specifiers {
        record_specifier(collector, decl.source.value.as_str(), spec);
    }
}

/// Record one import specifier as an import binding in the current scope.
fn record_specifier(
    collector: &mut ScopeCollector,
    specifier: &str,
    spec: &ImportDeclarationSpecifier<'_>,
) {
    match spec {
        ImportDeclarationSpecifier::ImportSpecifier(named) => {
            if named.import_kind == ImportOrExportKind::Type {
                return;
            }
            // import { brand as primary } from './tokens'
            let imported = super::super::bindings::imported_name(&named.imported);
            let binding = import_binding(
                named.local.name.as_str(),
                &imported,
                specifier,
                named.local.span,
            );
            collector.declare_current(named.local.name.as_str(), binding);
        }
        ImportDeclarationSpecifier::ImportDefaultSpecifier(default) => {
            // import theme from './tokens'
            let binding = import_binding(
                default.local.name.as_str(),
                "default",
                specifier,
                default.local.span,
            );
            collector.declare_current(default.local.name.as_str(), binding);
        }
        ImportDeclarationSpecifier::ImportNamespaceSpecifier(ns) => {
            // import * as tokens from './tokens'
            let binding = import_binding(ns.local.name.as_str(), "*", specifier, ns.local.span);
            collector.declare_current(ns.local.name.as_str(), binding);
        }
    }
}

/// One imported name with its specifier and exported name, carrying no value.
fn import_binding(local: &str, imported: &str, specifier: &str, span: oxc_span::Span) -> Binding {
    Binding {
        kind: BindingKind::Import(ImportRef {
            local: local.into(),
            imported: imported.into(),
            specifier: specifier.into(),
        }),
        init: None,
        span,
    }
}

/// Map a declaration keyword to its binding kind.
fn declaration_kind(kind: VariableDeclarationKind) -> BindingKind {
    match kind {
        VariableDeclarationKind::Const => BindingKind::Const,
        VariableDeclarationKind::Let => BindingKind::Let,
        VariableDeclarationKind::Var => BindingKind::Var,
        VariableDeclarationKind::Using | VariableDeclarationKind::AwaitUsing => BindingKind::Const,
    }
}
