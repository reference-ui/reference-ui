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

use std::cell::Cell;

use oxc_ast::ast::{
    BindingPattern, Class, Function, ImportDeclaration, ImportDeclarationSpecifier,
    ImportOrExportKind, Program, VariableDeclaration, VariableDeclarationKind, VariableDeclarator,
};
use oxc_ast_visit::{walk, Visit};

use super::binding::{Binding, BindingInit, BindingKind, ImportRef};
use super::destructure::{bind_pattern, PatternCtx};
use super::init::binding_init;
use super::lookup::{ImportLookup, ScopeChain};
use super::table::{ScopeId, ScopeTable, ROOT_SCOPE};
use super::value::{self, Dep, DepKey};
use crate::atom::AtomValue;
use crate::extract::constants::LocalConstants;

/// Collect every value binding of a program into its scope table.
///
/// `project` is the merged project bag: baked entries copied from a binding
/// written anywhere in the project strip before return, matching the
/// name-wide mutation poison the walkers already apply (SPEC-V2-35).
pub fn collect(program: &Program<'_>, project: &LocalConstants) -> ScopeTable {
    // function Card({ color }) { css({ color }) }  — `color` binds as a param
    let mut collector = ScopeCollector {
        table: ScopeTable::new(),
        stack: Vec::new(),
        decl_kind: VariableDeclarationKind::Const,
        deps: Vec::new(),
        factory: Vec::new(),
        token_waits: Vec::new(),
    };
    collector.visit_program(program);
    let ScopeCollector {
        mut table,
        deps,
        factory,
        token_waits,
        ..
    } = collector;
    clear_unbound_calls(&mut table, &deps, &factory, &token_waits);
    value::strip_stale(&mut table, &deps, project);
    crate::extract::fold::fence_attach::attach_pure_fns(program, &mut table, project);
    table
}

/// A factory-call init awaiting import verification: the callee must resolve
/// to a `keyframes`/`positionTry` import from a Reference package.
struct FactoryWait {
    scope: ScopeId,
    name: String,
    callee: String,
}

/// A `token()` init awaiting import verification: the callee must resolve
/// to a `token` import from a Reference package. Recorded optimistically so
/// forward imports (imports hoist) verify after the visit.
struct TokenWait {
    scope: ScopeId,
    name: String,
    callee: String,
}

/// Visitor recording bindings in the innermost scope at each declaration.
struct ScopeCollector {
    table: ScopeTable,
    stack: Vec<ScopeId>,
    decl_kind: VariableDeclarationKind,
    deps: Vec<Dep>,
    factory: Vec<FactoryWait>,
    token_waits: Vec<TokenWait>,
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
            record_param(self, param);
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

/// Record a declarator: identifier inits carry values, patterns bind entries.
fn record_declarator(collector: &mut ScopeCollector, decl: &VariableDeclarator<'_>) {
    let kind = declaration_kind(collector.decl_kind);
    if let BindingPattern::BindingIdentifier(ident) = &decl.id {
        // const space = '2r'  — the name carries its leaves
        let name = ident.name.as_str();
        let (init, deps) = declarator_init(collector, decl.init.as_ref(), name);
        collector.deps.extend(deps);
        collector.declare_current(
            name,
            Binding {
                kind,
                init,
                span: ident.span,
            },
        );
        return;
    }
    // const { color } = theme  — each name carries the entry it selects
    let scope = collector.current();
    let ctx = PatternCtx {
        table: &collector.table,
        scope,
        kind,
    };
    let bound = bind_pattern(&ctx, &decl.id, decl.init.as_ref());
    collector.deps.extend(bound.deps);
    for (name, binding) in bound.bindings {
        collector.declare_current(&name, binding);
    }
}

/// An identifier declarator's carried value: resolving objects, else as before.
fn declarator_init(
    collector: &mut ScopeCollector,
    init: Option<&oxc_ast::ast::Expression<'_>>,
    name: &str,
) -> (Option<BindingInit>, Vec<Dep>) {
    let Some(init) = init else {
        return (None, Vec::new());
    };
    if let Some(obj) = value::as_object_init(init) {
        // const theme = { primary: red, ...base }  — literals plus resolved
        // identifier values and static spreads, with provenance deps.
        let scope = collector.current();
        let (entries, provenances) = value::object_init(obj, &collector.table, scope);
        let deps = provenances
            .into_iter()
            .map(|provenance| {
                let key = DepKey::ObjectKey(provenance.key.clone());
                provenance.into_dep(scope, name, key)
            })
            .collect();
        return (Some(BindingInit::Object(entries)), deps);
    }
    if let Some(alias) = alias_init(collector, init, name) {
        return alias;
    }
    if let Some(factory) = factory_init(collector, init, name) {
        return factory;
    }
    if let Some(membered) = member_init(collector, init, name) {
        return membered;
    }
    if let Some(token) = token_init(collector, init, name) {
        return token;
    }
    // Literals, arrays, and branch leaves as before.
    (binding_init(init), Vec::new())
}

/// A `token()` init records its folded reference, with provenance deps.
///
/// `const c = token('colors.red.500')` carries `'{colors.red.500}'`, and a
/// fallback rides the Token value — the same shapes the value walkers fold,
/// so the const resolves at its uses. Only already-recorded same-file consts
/// answer for identifier paths and fallbacks; the deps keep a later write
/// from going stale. An unbound callee records optimistically for a forward
/// import and verifies after the visit; anything else records nothing.
fn token_init(
    collector: &mut ScopeCollector,
    init: &oxc_ast::ast::Expression<'_>,
    name: &str,
) -> Option<(Option<BindingInit>, Vec<Dep>)> {
    let peeled = value::peel(init);
    let oxc_ast::ast::Expression::CallExpression(call) = peeled else {
        return None;
    };
    let (args, local) = match token_init_head(call) {
        TokenInitHead::Fold(args, local) => (args, local),
        TokenInitHead::Valueless => return Some((None, Vec::new())),
        TokenInitHead::NotACall => return None,
    };
    let scope = collector.current();
    if !token_init_verify(collector, scope, name, local) {
        return None;
    }
    let mut deps = Vec::new();
    let ctx = TokenInitCtx {
        table: &collector.table,
        scope,
        name,
    };
    let Some(value) = token_init_value(&ctx, &args, &mut deps) else {
        return Some((None, Vec::new()));
    };
    Some((Some(BindingInit::Scalars(vec![value])), deps))
}

/// Fold a validated call's path and fallback to its carried value.
fn token_init_value(
    ctx: &TokenInitCtx<'_>,
    args: &crate::extract::fold::TokenArgs<'_, '_>,
    deps: &mut Vec<Dep>,
) -> Option<AtomValue> {
    use crate::extract::fold::shape_value;
    let path = token_init_operand(ctx, args.path, true, deps)?;
    let mut fallback = None;
    if let Some(expr) = args.fallback {
        fallback = Some(token_init_operand(ctx, expr, false, deps)?);
    }
    Some(shape_value(&path, fallback))
}

/// A `token()` init call head: foldable, valueless, or not a token call.
enum TokenInitHead<'a, 'b> {
    /// A bound name plus validated args, ready to fold.
    Fold(crate::extract::fold::TokenArgs<'a, 'b>, &'a str),
    /// A foreign member or bad arity: record nothing and shadow.
    Valueless,
    /// Not a token call shape at all: fall through to the next init kind.
    NotACall,
}

/// Validate a `token()` init call's callee shape and arity.
fn token_init_head<'a, 'b>(call: &'b oxc_ast::ast::CallExpression<'a>) -> TokenInitHead<'a, 'b> {
    use crate::extract::fold::{token_args, token_callee, TokenCallee};
    let Some(callee) = token_callee(&call.callee) else {
        return TokenInitHead::NotACall;
    };
    let local = match callee {
        TokenCallee::Bare(local) | TokenCallee::Var(local) => local,
        TokenCallee::Foreign { .. } => return TokenInitHead::Valueless,
    };
    match token_args(call) {
        Ok(args) => TokenInitHead::Fold(args, local),
        Err(_) => TokenInitHead::Valueless,
    }
}

/// What the callee check decided for a `token()` init.
enum TokenCalleeStatus {
    /// Import-bound already: record.
    Bound,
    /// Unbound yet: record optimistically, verify after the visit.
    Forward,
    /// Shadowed or foreign: not a token call.
    Refused,
}

/// Verify a `token()` init callee: bound records, forward records with a
/// post-visit wait, and refused (shadowed or foreign) answers false.
fn token_init_verify(
    collector: &mut ScopeCollector,
    scope: ScopeId,
    name: &str,
    local: &str,
) -> bool {
    match token_callee_status(&collector.table, scope, local) {
        TokenCalleeStatus::Refused => false,
        TokenCalleeStatus::Forward => {
            collector.token_waits.push(TokenWait {
                scope,
                name: name.to_string(),
                callee: local.to_string(),
            });
            true
        }
        TokenCalleeStatus::Bound => true,
    }
}

/// Check a `token()` init callee against the table: bound, forward, or refused.
fn token_callee_status(table: &ScopeTable, scope: ScopeId, local: &str) -> TokenCalleeStatus {
    use crate::extract::fold::is_token_import;
    let Some((_, binding)) = table.resolve_from(local, scope) else {
        return TokenCalleeStatus::Forward;
    };
    if matches!(&binding.kind, BindingKind::Import(imp) if is_token_import(imp)) {
        TokenCalleeStatus::Bound
    } else {
        TokenCalleeStatus::Refused
    }
}

/// Where a `token()` init records: the table, scope, and binding name.
struct TokenInitCtx<'a> {
    table: &'a ScopeTable,
    scope: ScopeId,
    name: &'a str,
}

/// One `token()` init operand: literals fold, recorded consts resolve with a
/// provenance dep, and anything else refuses the init.
fn token_init_operand(
    ctx: &TokenInitCtx<'_>,
    expr: &oxc_ast::ast::Expression<'_>,
    is_path: bool,
    deps: &mut Vec<Dep>,
) -> Option<String> {
    use crate::extract::fold::{
        classify_fallback, classify_path, resolve_fallback_operand, resolve_path_operand,
        TokenOperand,
    };
    let operand = if is_path {
        classify_path(expr)
    } else {
        classify_fallback(expr)
    };
    let TokenOperand::Name(target) = operand else {
        return match operand {
            TokenOperand::Literal(spelling) => Some(spelling),
            TokenOperand::Refused(_) | TokenOperand::Name(_) => None,
        };
    };
    let (src_scope, binding) = ctx.table.resolve_from(target, ctx.scope)?;
    let BindingInit::Scalars(leaves) = binding.init.as_ref()? else {
        return None;
    };
    let resolved = if is_path {
        resolve_path_operand(TokenOperand::Name(target), leaves)
    } else {
        resolve_fallback_operand(TokenOperand::Name(target), leaves)
    }?;
    deps.push(Dep {
        scope: ctx.scope,
        name: ctx.name.to_string(),
        key: DepKey::Whole,
        src_scope,
        src_name: target.to_string(),
        src_key: None,
    });
    Some(resolved)
}

/// A static-member init reads the recorded leaves through the table.
///
/// `const accent = tokens.colors.red` carries the member leaves, so uses
/// resolve exactly like the member they abbreviate. Only earlier local
/// declarations resolve (no imports, matching aliases); the copy carries a
/// whole-binding dep on the root so a later write strips it (SPEC-V2-31).
fn member_init(
    collector: &ScopeCollector,
    init: &oxc_ast::ast::Expression<'_>,
    name: &str,
) -> Option<(Option<BindingInit>, Vec<Dep>)> {
    let peeled = value::peel(init);
    let oxc_ast::ast::Expression::StaticMemberExpression(mem) = peeled else {
        return None;
    };
    let root = crate::extract::fold::member_root_name(mem)?;
    // An empty import bag: member inits resolve table-locally only, exactly
    // like aliases, so imports and unbound roots stay valueless here.
    let empty = LocalConstants::default();
    let chain = ScopeChain::new(&collector.table, ImportLookup::ProjectBag(&empty));
    let scoped = chain.at(collector.current());
    let leaves = crate::extract::fold::member_path_leaves(mem, scoped);
    if leaves.is_empty() {
        return Some((None, Vec::new()));
    }
    let (src_scope, _) = collector.table.resolve_from(root, collector.current())?;
    Some((
        Some(BindingInit::Scalars(leaves)),
        vec![Dep {
            scope: collector.current(),
            name: name.to_string(),
            key: DepKey::Whole,
            src_scope,
            src_name: root.to_string(),
            src_key: None,
        }],
    ))
}

/// A factory-call init resolves to the declared name, pending verification.
///
/// `const spin = keyframes({...})` carries `'spin'` — the keyframe name the
/// factory registers under. Any identifier callee with a single object arg
/// records optimistically (aliases included); the import binding is verified
/// after the visit, so forward imports and shadowing both answer correctly
/// and non-factory calls clear. The definition contents are unchecked
/// (product codegen is out of axis). `viewTransition` clears in the
/// post-pass: v2 refuses it as a value too, and the use site warns.
fn factory_init(
    collector: &mut ScopeCollector,
    init: &oxc_ast::ast::Expression<'_>,
    name: &str,
) -> Option<(Option<BindingInit>, Vec<Dep>)> {
    let peeled = value::peel(init);
    let oxc_ast::ast::Expression::CallExpression(call) = peeled else {
        return None;
    };
    let oxc_ast::ast::Expression::Identifier(callee) = &call.callee else {
        return None;
    };
    if !is_single_object_arg(call) {
        return None;
    }
    collector.factory.push(FactoryWait {
        scope: collector.current(),
        name: name.to_string(),
        callee: callee.name.to_string(),
    });
    Some((
        Some(BindingInit::Scalars(vec![AtomValue::String(
            name.to_string().into_boxed_str(),
        )])),
        Vec::new(),
    ))
}

/// True when a factory call takes exactly one inline object definition.
fn is_single_object_arg(call: &oxc_ast::ast::CallExpression<'_>) -> bool {
    if call.arguments.len() != 1 {
        return false;
    }
    matches!(
        call.arguments[0].as_expression(),
        Some(oxc_ast::ast::Expression::ObjectExpression(_))
    )
}

/// A bare-identifier init clones the target's recorded init, transitively.
///
/// `const b = a` copies whatever `a` already recorded (scalars, object,
/// array), so chains resolve in declaration order; a forward, missing, or
/// valueless target stays valueless, matching runtime TDZ. The copy carries
/// a whole-binding dep so a later write to the source strips it (SPEC-V2-34).
fn alias_init(
    collector: &ScopeCollector,
    init: &oxc_ast::ast::Expression<'_>,
    name: &str,
) -> Option<(Option<BindingInit>, Vec<Dep>)> {
    let peeled = value::peel(init);
    let oxc_ast::ast::Expression::Identifier(target) = peeled else {
        return None;
    };
    if target.name.as_str() == name {
        // const b = b  — the declarator shadows its own scope, so the
        // target is always TDZ-dead at runtime; never resolve outward.
        return Some((None, Vec::new()));
    }
    let scope = collector.current();
    let (src_scope, binding) = collector.table.resolve_from(target.name.as_str(), scope)?;
    let cloned = binding.init.clone()?;
    Some((
        Some(cloned),
        vec![Dep {
            scope,
            name: name.to_string(),
            key: DepKey::Whole,
            src_scope,
            src_name: target.name.to_string(),
            src_key: None,
        }],
    ))
}

/// Record one function parameter: a folding `TSTypeLiteral` annotation
/// carries its object (or the destructured members); anything else binds
/// every name to shadow with no value (SPEC-V2-46).
fn record_param(collector: &mut ScopeCollector, param: &oxc_ast::ast::FormalParameter<'_>) {
    // function paint(props: { color: 'red' })
    let Some(entries) = super::types::param_type_object(param) else {
        declare_pattern(collector, &param.pattern, BindingKind::Param);
        return;
    };
    if let BindingPattern::BindingIdentifier(ident) = &param.pattern {
        collector.declare_current(
            ident.name.as_str(),
            Binding {
                kind: BindingKind::Param,
                init: Some(BindingInit::Object(entries)),
                span: ident.span,
            },
        );
        return;
    }
    // function paint({ color }: { color: 'red' })
    let scope = collector.current();
    let bound = super::types::bind_param_pattern(&param.pattern, &entries, &collector.table, scope);
    let Some(bound) = bound else {
        declare_pattern(collector, &param.pattern, BindingKind::Param);
        return;
    };
    for (name, span, init) in bound {
        collector.declare_current(
            &name,
            Binding {
                kind: BindingKind::Param,
                init,
                span,
            },
        );
    }
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

/// Clear call inits whose callee is not a Reference import.
///
/// Runs after the visit so forward imports resolve; shadowed, unbound, and
/// foreign-package callees clear. Dependents that cloned a cleared init —
/// alias chains, object entries — clear too, to a fixpoint, so no stale
/// name survives through a copy.
fn clear_unbound_calls(
    table: &mut ScopeTable,
    deps: &[Dep],
    factory: &[FactoryWait],
    token_waits: &[TokenWait],
) {
    let mut cleared = initial_factory_clears(table, factory);
    cleared.extend(initial_token_clears(table, token_waits));
    while cascade_call_clears(table, deps, &mut cleared) {}
}

/// Clear every factory init without a Reference factory import behind it.
fn initial_factory_clears(table: &mut ScopeTable, waits: &[FactoryWait]) -> Vec<(ScopeId, String)> {
    let mut cleared = Vec::new();
    for wait in waits {
        if factory_import_bound(table, wait) {
            continue;
        }
        table.clear_init(wait.scope, &wait.name);
        cleared.push((wait.scope, wait.name.clone()));
    }
    cleared
}

/// Clear every `token()` init without a Reference `token` import behind it.
fn initial_token_clears(table: &mut ScopeTable, waits: &[TokenWait]) -> Vec<(ScopeId, String)> {
    let mut cleared = Vec::new();
    for wait in waits {
        if token_import_bound(table, wait) {
            continue;
        }
        table.clear_init(wait.scope, &wait.name);
        cleared.push((wait.scope, wait.name.clone()));
    }
    cleared
}

/// True when a token callee resolves to a `token` import from Reference.
fn token_import_bound(table: &ScopeTable, wait: &TokenWait) -> bool {
    let Some((_, binding)) = table.resolve_from(&wait.callee, wait.scope) else {
        return false;
    };
    let BindingKind::Import(imp) = &binding.kind else {
        return false;
    };
    crate::extract::fold::is_token_import(imp)
}

/// One cascade pass: clear dependents of cleared inits. True when it cleared.
fn cascade_call_clears(
    table: &mut ScopeTable,
    deps: &[Dep],
    cleared: &mut Vec<(ScopeId, String)>,
) -> bool {
    let mut grew = false;
    for dep in deps {
        if !cleared_source(cleared, dep) || is_cleared(cleared, dep.scope, &dep.name) {
            continue;
        }
        match &dep.key {
            DepKey::Whole => table.clear_init(dep.scope, &dep.name),
            DepKey::ObjectKey(key) => table.remove_object_key(dep.scope, &dep.name, key),
        }
        cleared.push((dep.scope, dep.name.clone()));
        grew = true;
    }
    grew
}

/// True when a dep's source binding already cleared.
fn cleared_source(cleared: &[(ScopeId, String)], dep: &Dep) -> bool {
    cleared
        .iter()
        .any(|(s, n)| *s == dep.src_scope && *n == dep.src_name)
}

/// True when a binding already cleared.
fn is_cleared(cleared: &[(ScopeId, String)], scope: ScopeId, name: &str) -> bool {
    cleared.iter().any(|(s, n)| *s == scope && n == name)
}

/// True when a factory callee resolves to a `keyframes`/`positionTry` import
/// from a Reference package. Aliases answer by imported name; locals,
/// unbound names, and foreign packages refuse.
fn factory_import_bound(table: &ScopeTable, wait: &FactoryWait) -> bool {
    let Some((_, binding)) = table.resolve_from(&wait.callee, wait.scope) else {
        return false;
    };
    let BindingKind::Import(imp) = &binding.kind else {
        return false;
    };
    (imp.imported.as_ref() == "keyframes" || imp.imported.as_ref() == "positionTry")
        && imp.specifier.as_ref().starts_with("@reference-ui/")
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
