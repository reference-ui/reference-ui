//! Traced JSX style surface analysis. Finds StyleProps hosts through the
//! file-local component imports plus the traced and configured host names,
//! then lowers every style-bearing attribute: literals predict exact lookups,
//! `css` and condition blocks walk, and dynamic shapes become dynamic-slot
//! facts. Native `style` is excluded: it never uses the runtime style-plan
//! lookup. Unknown tags and DOM attributes emit nothing.

use std::cell::Cell;
use std::collections::{BTreeMap, BTreeSet};

use rustc_hash::{FxHashMap, FxHashSet};

use oxc_ast::ast::{
    BindingPattern, Class, Expression, FormalParameters, Function, JSXAttributeItem,
    JSXAttributeValue, JSXOpeningElement, Program, VariableDeclaration, VariableDeclarationKind,
    VariableDeclarator,
};
use oxc_ast_visit::{walk, Visit};
use oxc_span::Span;
use oxc_syntax::scope::ScopeFlags;
use oxc_syntax::scope::ScopeId as OxcScopeId;

use super::gate::{is_style_attr, AttrGate};
use super::imports::FileBindings;
use super::jsx_attrs::{
    format_attribute_name, format_element_name, walk_attr_input, walk_bag_object, walk_const_attrs,
    AttrInput,
};
use super::object::{Site, WalkCtx};
use super::{
    is_shadowed, record_declarator_shadow, record_param_shadows, AnalysisCtx, AnalyzedSource,
};
use crate::diagnostics::{DiagnosticFact, DynamicShape, SourceId, StyleSurfaceKind};
use crate::extract::constants::LocalConstants;
use crate::extract::scope::peel;

/// Expectations for the traced JSX surface: one walk per source. The import
/// bindings arrive scanned: both surfaces share one scan per source.
pub fn expectations(
    ctx: &AnalysisCtx<'_>,
    source_id: SourceId,
    source: &AnalyzedSource<'_>,
    bindings: &FileBindings,
) -> Vec<DiagnosticFact> {
    let mut visitor = JsxVisitor {
        facts: Vec::new(),
        source: source_id,
        system: ctx.system,
        style_props: &ctx.style_props,
        constants: ctx.constants,
        hosts: &ctx.hosts,
        owned: ctx.owned_props,
        shadows: Vec::new(),
        opaque: Vec::new(),
        decl_kind: VariableDeclarationKind::Var,
        bindings,
        aliases: collect_ident_aliases(source.program),
    };
    visitor.visit_program(source.program);
    visitor.facts
}

/// One source's const ident alias edges (`const X = Y`, transparent
/// wrappers peeled through the extract's own `peel`): the mirror's flat
/// counterpart to the scope table's alias map. Scope-flattened like every
/// mirror read (F-G1b): repeated bindings keep the last edge, matching
/// runtime last-wins in one scope and approximating shadowing across
/// scopes. The shared peel keeps both paths classifying `as`/parens/
/// `!` inits identically; the use-site kind gate below covers shadowing.
fn collect_ident_aliases(program: &Program<'_>) -> FxHashMap<String, String> {
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
fn is_const_kind(kind: VariableDeclarationKind) -> bool {
    matches!(
        kind,
        VariableDeclarationKind::Const
            | VariableDeclarationKind::Using
            | VariableDeclarationKind::AwaitUsing
    )
}

/// One source's JSX walk: file-local imports plus traced and configured
/// hosts gate the tags, and the shared attr walker lowers the attributes.
struct JsxVisitor<'a, 'b> {
    facts: Vec<DiagnosticFact>,
    source: SourceId,
    system: &'a str,
    style_props: &'a FxHashSet<String>,
    constants: &'a LocalConstants,
    hosts: &'a FxHashSet<String>,
    owned: &'a BTreeMap<String, BTreeSet<String>>,
    shadows: Vec<FxHashSet<String>>,
    /// Per-scope names bound by anything but a const declarator: params,
    /// `let`/`var` declarators, and function/class declarations. The alias
    /// gate reads this beside `shadows` so an opaque innermost binding
    /// vetoes the flat edge exactly like the extract's `Const` check.
    opaque: Vec<FxHashSet<String>>,
    /// Innermost declaration keyword at the visit position, for the
    /// opaque/const split of identifier declarators.
    decl_kind: VariableDeclarationKind,
    bindings: &'b FileBindings,
    aliases: FxHashMap<String, String>,
}

impl<'a, 'b> JsxVisitor<'a, 'b> {
    /// The shared walk context over this visitor's facts and name truth.
    fn walk_ctx(&mut self) -> WalkCtx<'_> {
        WalkCtx {
            facts: &mut self.facts,
            source: self.source,
            surface: StyleSurfaceKind::JsxStyle,
            system: self.system,
            style_props: self.style_props,
            constants: self.constants,
            shadows: &self.shadows,
        }
    }

    /// True when this tag is a StyleProps host: a file-local Reference
    /// import, a traced name, or a configured name — never shadowed.
    /// Member tags match concatenated hosts, the discovery spelling. A
    /// member tag resolves through its root, so a locally bound root
    /// rebinds every use and gates it, mirroring the extract gate —
    /// unless the root re-admits through its own const object literal,
    /// after which membership decides.
    fn allows_tag(&self, tag: &str) -> bool {
        if is_shadowed(&self.shadows, tag) {
            // A shadowed plain tag predicts only through its alias chain;
            // the chain verdict replaces membership below, mirroring the
            // extract gate. Dotted names never shadow.
            return self.shadowed_plain_admitted(tag);
        }
        if let Some((root, member)) = tag.split_once('.') {
            if is_shadowed(&self.shadows, root) && !self.shadowed_member_admitted(root, member) {
                return false;
            }
        }
        if self.bindings.jsx.contains(tag) || self.hosts.contains(tag) {
            return true;
        }
        if !tag.contains('.') {
            return false;
        }
        let flat = tag.replace('.', "");
        self.bindings.jsx.contains(&flat) || self.hosts.contains(&flat)
    }

    /// True when a shadowed plain tag re-admits through the flat alias
    /// map, mirroring the extract gate: `const IconShell = Div` re-admits
    /// `<IconShell>` exactly when the chain ends at an admitted,
    /// unshadowed host tag. Cycles stay silent, and so does a tag whose
    /// innermost binding is opaque (a param or rebind shadowing the alias).
    fn shadowed_plain_admitted(&self, tag: &str) -> bool {
        if tag.contains('.') {
            return false;
        }
        if !self.alias_binding_is_const(tag) {
            return false;
        }
        let mut seen = FxHashSet::default();
        let mut current = tag;
        loop {
            if !seen.insert(current.to_string()) {
                return false;
            }
            let Some(target) = self.aliases.get(current) else {
                return !is_shadowed(&self.shadows, current)
                    && (self.bindings.jsx.contains(current) || self.hosts.contains(current));
            };
            current = target;
        }
    }

    /// True when the innermost visible binding of `tag` is the const alias
    /// itself rather than an opaque shadow. The first scope mentioning the
    /// name decides, so an inner param vetoes an outer alias while an inner
    /// const re-admits under an outer param — the flat counterpart to the
    /// extract gate's lexical `Const` check.
    fn alias_binding_is_const(&self, tag: &str) -> bool {
        for (shadowed, opaque) in self.shadows.iter().zip(self.opaque.iter()).rev() {
            if opaque.contains(tag) {
                return false;
            }
            if shadowed.contains(tag) {
                return true;
            }
        }
        true
    }

    /// True when a shadowed member root re-admits through the const bag:
    /// `const NS = { Panel: Div }` re-admits `NS.Panel` exactly when the
    /// statically matched member value is itself an admitted host tag. The
    /// bag records const-literal references only, so opaque bindings never
    /// re-admit; like every mirror read it is scope-flattened (F-G1b).
    fn shadowed_member_admitted(&self, root: &str, member: &str) -> bool {
        if self.constants.mutation(root).is_some() {
            return false;
        }
        let Some(value) = self
            .constants
            .get_object_prop(root, member)
            .and_then(|prop| prop.ident.as_deref())
        else {
            return false;
        };
        if is_shadowed(&self.shadows, value) {
            return false;
        }
        self.bindings.jsx.contains(value) || self.hosts.contains(value)
    }

    /// Lower one opening element's attributes when the tag is a host.
    fn handle_opening(&mut self, elem: &JSXOpeningElement<'_>) {
        let tag = format_element_name(&elem.name);
        if !self.allows_tag(&tag) {
            return;
        }
        for item in &elem.attributes {
            match item {
                JSXAttributeItem::Attribute(attr) => self.handle_attr(&tag, attr),
                JSXAttributeItem::SpreadAttribute(spread) => {
                    self.handle_spread(&tag, &spread.argument, spread.span);
                }
            }
        }
    }

    /// Lower one attribute: gated names map to inputs, element values and
    /// empty containers emit nothing (they never query).
    fn handle_attr(&mut self, tag: &str, attr: &oxc_ast::ast::JSXAttribute<'_>) {
        let name = format_attribute_name(&attr.name);
        let gate = AttrGate {
            tag,
            owned: self.owned,
        };
        if !is_style_attr(&gate, &name) {
            return;
        }
        let Some(value) = &attr.value else {
            walk_attr_input(&mut self.walk_ctx(), &name, AttrInput::Bare, attr.span);
            return;
        };
        match value {
            JSXAttributeValue::StringLiteral(lit) => {
                walk_attr_input(
                    &mut self.walk_ctx(),
                    &name,
                    AttrInput::Text(lit.value.as_str()),
                    lit.span,
                );
            }
            JSXAttributeValue::ExpressionContainer(container) => {
                if let Some(expr) = container.expression.as_expression() {
                    walk_attr_input(
                        &mut self.walk_ctx(),
                        &name,
                        AttrInput::Expr(expr),
                        container.span,
                    );
                }
            }
            _ => {}
        }
    }

    /// Lower one spread attribute: inline objects walk as bags, const
    /// objects unfold, const scalars and arrays vanish, and anything else
    /// stays a dynamic spread.
    fn handle_spread(&mut self, tag: &str, arg: &Expression<'_>, span: Span) {
        let gate = AttrGate {
            tag,
            owned: self.owned,
        };
        let arg = super::values::unwrap_value(arg);
        if let Expression::ObjectExpression(obj) = arg {
            walk_bag_object(&mut self.walk_ctx(), &gate, obj);
            return;
        }
        if let Expression::Identifier(ident) = arg {
            if self.handle_bag_ident(&gate, ident.name.as_str(), span) {
                return;
            }
        }
        self.walk_ctx()
            .dynamic(Site::bare(span, &[]), DynamicShape::Spread);
    }

    /// Lower one identifier spread from the const recording. True when the
    /// name resolved; false stays a dynamic spread.
    fn handle_bag_ident(&mut self, gate: &AttrGate<'_>, name: &str, span: Span) -> bool {
        if is_shadowed(&self.shadows, name) || self.constants.mutation(name).is_some() {
            return false;
        }
        if let Some(obj) = self.constants.get_object(name) {
            walk_const_attrs(&mut self.walk_ctx(), gate, obj, Site::bare(span, &[]));
            return true;
        }
        if self.constants.get_array(name).is_some() {
            return true;
        }
        !self.constants.scalar_leaves(name).is_empty()
    }
}

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

#[cfg(test)]
mod tests;
