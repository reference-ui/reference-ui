//! Traced JSX style surface analysis. Finds StyleProps hosts through the
//! file-local component imports plus the traced and configured host names,
//! then lowers every style-bearing attribute: literals predict exact lookups,
//! `css` and condition blocks walk, and dynamic shapes become dynamic-slot
//! facts. Native `style` is excluded: it never uses the runtime style-plan
//! lookup. Unknown tags and DOM attributes emit nothing.

use std::cell::Cell;
use std::collections::{BTreeMap, BTreeSet};

use rustc_hash::FxHashSet;

use oxc_ast::ast::{
    Expression, FormalParameters, JSXAttributeItem, JSXAttributeValue, JSXOpeningElement,
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
        bindings,
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
    style_props: &'a FxHashSet<String>,
    constants: &'a LocalConstants,
    hosts: &'a FxHashSet<String>,
    owned: &'a BTreeMap<String, BTreeSet<String>>,
    shadows: Vec<FxHashSet<String>>,
    bindings: &'b FileBindings,
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
    /// Member tags match concatenated hosts, the discovery spelling.
    fn allows_tag(&self, tag: &str) -> bool {
        if is_shadowed(&self.shadows, tag) {
            return false;
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
    }

    fn leave_scope(&mut self) {
        self.shadows.pop();
    }

    fn visit_formal_parameters(&mut self, params: &FormalParameters<'a>) {
        record_param_shadows(&mut self.shadows, params);
        walk::walk_formal_parameters(self, params);
    }

    fn visit_variable_declarator(&mut self, decl: &VariableDeclarator<'a>) {
        walk::walk_variable_declarator(self, decl);
        record_declarator_shadow(&mut self.shadows, decl);
    }

    fn visit_jsx_opening_element(&mut self, elem: &JSXOpeningElement<'a>) {
        self.handle_opening(elem);
        walk::walk_jsx_opening_element(self, elem);
    }
}

#[cfg(test)]
mod tests {
    use super::super::support::{analyze_source, dynamic_count, exact_keys};

    const IMPORT: &str = "import { Div } from '@reference-ui/react';";

    #[test]
    fn traced_hosts_predict_literal_attrs() {
        let facts = analyze_source(&format!("{IMPORT} const el = <Div mt=\"2r\" />;"));
        assert_eq!(
            exact_keys(&facts),
            vec![r#"["test",[],"mt","2r",false]"#.to_string()]
        );
        let facts = analyze_source(&format!("{IMPORT} const el = <Div mt={{'2r'}} />;"));
        assert_eq!(exact_keys(&facts).len(), 1);
        let facts = analyze_source(&format!("{IMPORT} const el = <Div truncate />;"));
        assert_eq!(
            exact_keys(&facts),
            vec![r#"["test",[],"truncate",true,false]"#.to_string()]
        );
    }

    #[test]
    fn css_and_condition_blocks_walk() {
        let facts = analyze_source(&format!(
            "{IMPORT} const el = <Div css={{{{ color: 'red' }}}} />;"
        ));
        assert_eq!(exact_keys(&facts).len(), 1);
        let facts = analyze_source(&format!(
            "{IMPORT} const el = <Div _hover={{{{ color: 'red' }}}} />;"
        ));
        assert_eq!(
            exact_keys(&facts),
            vec![r#"["test",["_hover"],"color","red",false]"#.to_string()]
        );
        let facts = analyze_source(&format!("{IMPORT} const el = <Div r={{{{ md: 'x' }}}} />;"));
        assert!(exact_keys(&facts).is_empty());
        assert_eq!(dynamic_count(&facts), 1);
    }

    #[test]
    fn native_style_and_unknown_tags_emit_nothing() {
        let facts = analyze_source("const el = <div style={{ padding: '99px' }}>x</div>;");
        assert!(facts.is_empty());
        let facts = analyze_source(&format!(
            "{IMPORT} const el = <Div style={{{{ padding: '99px' }}}} />;"
        ));
        assert!(facts.is_empty());
        let facts = analyze_source(&format!("{IMPORT} const el = <span mt=\"2r\" />;"));
        assert!(facts.is_empty());
        let facts = analyze_source(&format!(
            "{IMPORT} const el = <Div id=\"x\" data-y={{1}} />;"
        ));
        assert!(facts.is_empty());
    }

    #[test]
    fn css_and_jsx_surfaces_predict_identical_keys() {
        let css = analyze_source("import { css } from '@reference-ui/react'; css({ mt: '2r' })");
        let jsx = analyze_source(&format!("{IMPORT} const el = <Div mt=\"2r\" />;"));
        assert_eq!(exact_keys(&css), exact_keys(&jsx));
        assert_eq!(exact_keys(&jsx).len(), 1);
    }

    #[test]
    fn spread_bags_walk_entries_as_attrs() {
        let facts = analyze_source(&format!(
            "{IMPORT} const el = <Div {{...{{ mt: '2r' }}}} />;"
        ));
        assert_eq!(exact_keys(&facts).len(), 1);
        let facts = analyze_source(&format!("{IMPORT} const el = <Div {{...bag}} />;"));
        assert!(exact_keys(&facts).is_empty());
        assert_eq!(dynamic_count(&facts), 1);
    }

    #[test]
    fn shadowed_and_variant_attrs_emit_nothing() {
        let facts = analyze_source(&format!(
            "{IMPORT} function f(Div) {{ return <Div mt=\"2r\" />; }}"
        ));
        assert!(facts.is_empty());
        let facts = analyze_source(&format!("{IMPORT} const el = <Div variant=\"primary\" />;"));
        assert!(facts.is_empty());
        let facts = analyze_source(&format!("{IMPORT} const el = <Div colorMode=\"dark\" />;"));
        assert!(facts.is_empty());
    }
}
