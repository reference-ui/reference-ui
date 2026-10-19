//! Traced JSX style surface analysis. Finds StyleProps hosts through the
//! file-local component imports plus the traced and configured host names,
//! gated by extraction's own `HostGate` over the file's shared provenance, so
//! a package-bound root is never an own host here either. It then lowers
//! every style-bearing attribute: literals predict exact lookups, `css` and
//! condition blocks walk, and dynamic shapes become dynamic-slot facts. A
//! capitalized non-host tag lowers under the systems extraction's own
//! [`Composed`] decision names for it, and its exact keys target exactly those
//! systems (own for a project or unbound component nobody traces or publishes,
//! none for an unbacked package tag; a foreign package's tag predicts
//! nothing), unless it is a same-file wrapper threading `css` into a host,
//! whose `css` predicts own as extraction lowers it. Native `style` is
//! excluded; lowercase DOM tags and attributes emit nothing.

use rustc_hash::{FxHashMap, FxHashSet};

use oxc_ast::ast::{
    Expression, JSXAttribute, JSXAttributeItem, JSXAttributeValue, JSXOpeningElement,
    VariableDeclarationKind,
};
use oxc_ast_visit::Visit;
use oxc_span::Span;

use super::gate::{is_style_attr, AttrGate};
use super::imports::FileBindings;
use super::jsx_attrs::{
    format_attribute_name, format_element_name, walk_attr_input, walk_bag_object, walk_const_attrs,
    AttrInput,
};
use super::object::{Site, WalkCtx};
use super::{is_shadowed, AnalysisCtx, AnalyzedSource};
use crate::atom::Backing;
use crate::diagnostics::{DiagnosticFact, DynamicShape, SourceId, StyleSurfaceKind};
use crate::extract::constants::LocalConstants;
use crate::extract::provenance::{classify, tag_root};
use crate::extract::wrapper_thread::WrapperThreads;
use crate::extract::{Composed, ExtractBindings, HostGate, JsxHosts, OwnedProps, TagProvenance};

use self::aliases::collect_ident_aliases;
use self::threaded::collect_threads;

mod aliases;
mod backing;
mod threaded;
mod visit;

/// Expectations for the traced JSX surface: one walk per source. The import
/// bindings arrive scanned (both surfaces share one scan per source), and
/// the tag provenance is the source's, collected once with extraction.
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
        composed: ctx.composed,
        style_props: &ctx.style_props,
        constants: ctx.constants,
        hosts: &ctx.hosts,
        owned: OwnedProps::for_file(ctx.owned_props, ctx.local_owned, source.path),
        shadows: Vec::new(),
        opaque: Vec::new(),
        decl_kind: VariableDeclarationKind::Var,
        bindings,
        provenance: source.bindings,
        aliases: collect_ident_aliases(source.program),
        threads: collect_threads(ctx, source),
    };
    visitor.visit_program(source.program);
    visitor.facts
}

/// One source's JSX walk: file-local imports plus traced and configured
/// hosts gate the tags, and the shared attr walker lowers the attributes.
struct JsxVisitor<'a, 'b> {
    facts: Vec<DiagnosticFact>,
    source: SourceId,
    system: &'a str,
    composed: &'a Composed<'a>,
    style_props: &'a FxHashSet<String>,
    constants: &'a LocalConstants,
    hosts: &'a FxHashSet<String>,
    owned: OwnedProps<'a>,
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
    /// Where each import local ends, as extraction classified this file:
    /// the one classifier both gates read.
    provenance: &'b ExtractBindings,
    aliases: FxHashMap<String, String>,
    /// Same-file wrappers extraction threads `css` through.
    threads: WrapperThreads,
}

impl<'a, 'b> JsxVisitor<'a, 'b> {
    /// The shared walk context over this visitor's facts and name truth.
    /// `backing` is the per-block tag verdict: a JSX host is own, and a
    /// capitalized non-host lowers under the systems that render it.
    fn walk_ctx<'s>(&'s mut self, backing: &'s Backing) -> WalkCtx<'s> {
        WalkCtx {
            facts: &mut self.facts,
            source: self.source,
            surface: StyleSurfaceKind::JsxStyle,
            system: self.system,
            backing,
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
    /// after which membership decides. A root bound to an installed
    /// package is never a host, by the same provenance extraction reads.
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
        !self.binds_package(tag) && self.host_gate().names_host(tag)
    }

    /// Extraction's scope-free host gate over this file's Reference imports,
    /// the traced and configured hosts, and the shared provenance.
    fn host_gate(&self) -> HostGate<'_> {
        HostGate {
            hosts: JsxHosts {
                local: &self.bindings.jsx,
                global: self.hosts,
            },
            bindings: self.provenance,
        }
    }

    /// True when the tag's root is an unshadowed package-bound import, by
    /// the classifier extraction's `tag_provenance` calls.
    fn binds_package(&self, tag: &str) -> bool {
        matches!(
            classify(self.provenance, &self.shadows, tag_root(tag)),
            TagProvenance::Package(_)
        )
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
                return !is_shadowed(&self.shadows, current) && self.host_gate().admits(current);
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
        !is_shadowed(&self.shadows, value) && self.host_gate().admits(value)
    }

    /// Lower one opening element's attributes when the tag is admitted.
    fn handle_opening(&mut self, elem: &JSXOpeningElement<'_>) {
        let tag = format_element_name(&elem.name);
        if self.lowers_threaded(&tag, elem) {
            return;
        }
        let Some(backing) = self.tag_site(&tag) else {
            return;
        };
        for item in &elem.attributes {
            match item {
                JSXAttributeItem::Attribute(attr) => self.handle_attr(&tag, &backing, attr),
                JSXAttributeItem::SpreadAttribute(spread) => {
                    self.handle_spread(&tag, &backing, &spread.argument, spread.span);
                }
            }
        }
    }

    /// Lower one attribute when its name is a style position on this tag.
    fn handle_attr(&mut self, tag: &str, backing: &Backing, attr: &JSXAttribute<'_>) {
        let name = format_attribute_name(&attr.name);
        let gate = AttrGate {
            tag,
            owned: self.owned,
        };
        if is_style_attr(&gate, &name) {
            self.walk_attr_value(backing, &name, attr);
        }
    }

    /// Walk one admitted attribute's value as `name`: element values and
    /// empty containers emit nothing (they never query).
    fn walk_attr_value(&mut self, backing: &Backing, name: &str, attr: &JSXAttribute<'_>) {
        let Some(value) = &attr.value else {
            walk_attr_input(
                &mut self.walk_ctx(backing),
                name,
                AttrInput::Bare,
                attr.span,
            );
            return;
        };
        match value {
            JSXAttributeValue::StringLiteral(lit) => {
                walk_attr_input(
                    &mut self.walk_ctx(backing),
                    name,
                    AttrInput::Text(lit.value.as_str()),
                    lit.span,
                );
            }
            JSXAttributeValue::ExpressionContainer(container) => {
                if let Some(expr) = container.expression.as_expression() {
                    walk_attr_input(
                        &mut self.walk_ctx(backing),
                        name,
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
    fn handle_spread(&mut self, tag: &str, backing: &Backing, arg: &Expression<'_>, span: Span) {
        let gate = AttrGate {
            tag,
            owned: self.owned,
        };
        let arg = super::values::unwrap_value(arg);
        if let Expression::ObjectExpression(obj) = arg {
            walk_bag_object(&mut self.walk_ctx(backing), &gate, obj);
            return;
        }
        if let Expression::Identifier(ident) = arg {
            if self.handle_bag_ident(backing, &gate, ident.name.as_str(), span) {
                return;
            }
        }
        self.walk_ctx(backing)
            .dynamic(Site::bare(span, &[]), DynamicShape::Spread);
    }

    /// Lower one identifier spread from the const recording. True when the
    /// name resolved; false stays a dynamic spread.
    fn handle_bag_ident(
        &mut self,
        backing: &Backing,
        gate: &AttrGate<'_>,
        name: &str,
        span: Span,
    ) -> bool {
        if is_shadowed(&self.shadows, name) || self.constants.mutation(name).is_some() {
            return false;
        }
        if let Some(obj) = self.constants.get_object(name) {
            walk_const_attrs(
                &mut self.walk_ctx(backing),
                gate,
                obj,
                Site::bare(span, &[]),
            );
            return true;
        }
        if self.constants.get_array(name).is_some() {
            return true;
        }
        !self.constants.scalar_leaves(name).is_empty()
    }
}

#[cfg(test)]
mod tests;
