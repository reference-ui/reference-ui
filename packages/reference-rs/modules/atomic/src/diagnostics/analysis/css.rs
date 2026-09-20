//! Imported `css()` surface analysis. Finds live `css()` calls through the
//! file-local import bindings plus a shadow stack, then walks every argument
//! as a style block: static objects predict exact expected lookups and
//! dynamic shapes become dynamic-slot facts. Unknown or shadowed `css` is
//! not a site, and scalar arguments are not blocks — runtime drops them.

use std::cell::Cell;
use std::collections::HashSet;

use oxc_ast::ast::{Argument, CallExpression, Expression, FormalParameters, VariableDeclarator};
use oxc_ast_visit::{walk, Visit};
use oxc_syntax::scope::ScopeFlags;
use oxc_syntax::scope::ScopeId as OxcScopeId;

use super::block::walk_block;
use super::imports::{scan_imports, FileBindings};
use super::object::{Site, WalkCtx};
use super::{
    is_shadowed, record_declarator_shadow, record_param_shadows, AnalysisCtx, AnalyzedSource,
};
use crate::diagnostics::{DiagnosticFact, DynamicShape, SourceId, StyleSurfaceKind};
use crate::extract::constants::LocalConstants;

/// Expectations for the `css()` surface: one walk per source.
pub fn expectations(
    ctx: &AnalysisCtx<'_>,
    source_id: SourceId,
    source: &AnalyzedSource<'_>,
) -> Vec<DiagnosticFact> {
    let mut visitor = CssVisitor {
        facts: Vec::new(),
        source: source_id,
        system: ctx.system,
        style_props: &ctx.style_props,
        constants: ctx.constants,
        shadows: Vec::new(),
        bindings: scan_imports(source.program),
    };
    visitor.visit_program(source.program);
    visitor.facts
}

/// One source's `css()` walk: bindings gate the calls, shadows disqualify
/// them, and the shared walker lowers the arguments.
struct CssVisitor<'a> {
    facts: Vec<DiagnosticFact>,
    source: SourceId,
    system: &'a str,
    style_props: &'a HashSet<String>,
    constants: &'a LocalConstants,
    shadows: Vec<HashSet<String>>,
    bindings: FileBindings,
}

impl<'a> CssVisitor<'a> {
    /// The shared walk context over this visitor's facts and name truth.
    fn walk_ctx(&mut self) -> WalkCtx<'_> {
        WalkCtx {
            facts: &mut self.facts,
            source: self.source,
            surface: StyleSurfaceKind::Css,
            system: self.system,
            style_props: self.style_props,
            constants: self.constants,
            shadows: &self.shadows,
        }
    }

    /// True when `callee` spells a live Reference `css`: a plain import, a
    /// namespace member, or `css.object`. Reserved aliases stay live.
    fn is_live_css(&self, callee: &Expression<'_>) -> bool {
        match callee {
            Expression::Identifier(ident) => self.is_live_css_name(ident.name.as_str()),
            Expression::StaticMemberExpression(member) => self.is_live_css_member(member),
            _ => false,
        }
    }

    /// True when `name` is a live `css` binding: never shadowed, always
    /// imported — except the reserved alias, which is live by contract.
    fn is_live_css_name(&self, name: &str) -> bool {
        if name == "__reference_ui_css" {
            return true;
        }
        !is_shadowed(&self.shadows, name) && self.bindings.css.contains(name)
    }

    /// True for `ns.css` on a live Reference namespace and `css.object`
    /// on a `css` binding. Shadowed objects disqualify both spellings.
    fn is_live_css_member(&self, member: &oxc_ast::ast::StaticMemberExpression<'_>) -> bool {
        let Expression::Identifier(object) = &member.object else {
            return false;
        };
        let object_name = object.name.as_str();
        if is_shadowed(&self.shadows, object_name) {
            return false;
        }
        match member.property.name.as_str() {
            "css" => self.bindings.namespaces.contains(object_name),
            "object" => {
                object_name == "__reference_ui_css" || self.bindings.css.contains(object_name)
            }
            _ => false,
        }
    }

    /// Lower one live `css()` call: every argument walks as a style block
    /// and spread arguments stay dynamic spreads.
    fn handle_call(&mut self, call: &CallExpression<'_>) {
        if !self.is_live_css(&call.callee) {
            return;
        }
        for arg in &call.arguments {
            self.handle_arg(arg);
        }
    }

    /// Lower one call argument as a style block, or a dynamic spread.
    fn handle_arg(&mut self, arg: &Argument<'_>) {
        match arg {
            Argument::SpreadElement(spread) => {
                self.walk_ctx()
                    .dynamic(Site::bare(spread.span, &[]), DynamicShape::Spread);
            }
            _ => {
                if let Some(expr) = arg.as_expression() {
                    walk_block(&mut self.walk_ctx(), expr, &[]);
                }
            }
        }
    }
}

impl<'a> Visit<'a> for CssVisitor<'a> {
    fn enter_scope(&mut self, _flags: ScopeFlags, _scope_id: &Cell<Option<OxcScopeId>>) {
        self.shadows.push(HashSet::new());
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

    fn visit_call_expression(&mut self, call: &CallExpression<'a>) {
        self.handle_call(call);
        walk::walk_call_expression(self, call);
    }
}

#[cfg(test)]
mod tests {
    use super::super::support::{analyze_source, dynamic_count, exact_keys};

    const IMPORT: &str = "import { css } from '@reference-ui/react';";

    #[test]
    fn static_call_predicts_its_exact_key() {
        let facts = analyze_source(&format!("{IMPORT} css({{ color: 'red' }})"));
        assert_eq!(
            exact_keys(&facts),
            vec![r#"["test",[],"color","red",false]"#.to_string()]
        );
        assert_eq!(dynamic_count(&facts), 0);
    }

    #[test]
    fn destructured_params_shadow_same_named_consts() {
        // SITE-53's SPEC-V2-75 ghost: the param shadows the cross-file
        // const, so the use is dynamic, never the const's exact key.
        for params in [
            "{ color }",
            "{ primary: color }",
            "{ color = 'red' }",
            "[color]",
            "{ ...color }",
        ] {
            let facts = analyze_source(&format!(
                "{IMPORT} const color = 'amber.500'; \
                 function Card({params}) {{ return css({{ color }}); }}"
            ));
            assert!(exact_keys(&facts).is_empty(), "params: {params}");
            assert_eq!(dynamic_count(&facts), 1, "params: {params}");
        }
    }

    #[test]
    fn unknown_and_shadowed_css_are_not_sites() {
        let facts = analyze_source("css({ color: 'red' })");
        assert!(facts.is_empty());
        let facts = analyze_source(&format!("{IMPORT} css2({{ color: 'red' }})"));
        assert!(facts.is_empty());
        let facts = analyze_source(&format!(
            "{IMPORT} function f(css) {{ return css({{ color: 'red' }}); }}"
        ));
        assert!(facts.is_empty());
        let facts = analyze_source(&format!(
            "{IMPORT} function f() {{ const css = other; return css({{ color: 'red' }}); }}"
        ));
        assert!(facts.is_empty());
    }

    #[test]
    fn namespace_and_object_spellings_are_sites() {
        let facts =
            analyze_source("import * as ui from '@reference-ui/react'; ui.css({ color: 'red' })");
        assert_eq!(exact_keys(&facts).len(), 1);
        let facts = analyze_source(&format!("{IMPORT} css.object({{ color: 'red' }})"));
        assert_eq!(exact_keys(&facts).len(), 1);
    }

    #[test]
    fn nested_conditions_responsive_values_important_and_aliases() {
        let facts = analyze_source(&format!(
            "{IMPORT} css({{ _hover: {{ md: {{ color: 'red' }} }} }})"
        ));
        assert_eq!(
            exact_keys(&facts),
            vec![r#"["test",["_hover","md"],"color","red",false]"#.to_string()]
        );
        let facts = analyze_source(&format!("{IMPORT} css({{ padding: ['1', null, '4'] }})"));
        assert_eq!(
            exact_keys(&facts),
            vec![r#"["test",[],"padding",["1",null,"4"],false]"#.to_string()]
        );
        let facts = analyze_source(&format!(
            "{IMPORT} css({{ width: {{ md: '60px', base: '50px' }} }})"
        ));
        assert_eq!(
            exact_keys(&facts),
            vec![r#"["test",[],"width",{"base":"50px","md":"60px"},false]"#.to_string()]
        );
        let facts = analyze_source(&format!(
            "{IMPORT} css({{ color: 'red!', mt: '2r !important' }})"
        ));
        assert_eq!(
            exact_keys(&facts),
            vec![
                r#"["test",[],"color","red",true]"#.to_string(),
                r#"["test",[],"mt","2r",true]"#.to_string(),
            ]
        );
        let facts = analyze_source(&format!("{IMPORT} css({{ p: '2' }})"));
        assert_eq!(
            exact_keys(&facts),
            vec![r#"["test",[],"p","2",false]"#.to_string()]
        );
    }

    #[test]
    fn top_level_const_use_stays_dynamic_end_to_end() {
        // F-S4a (O7 R6): the const bag is scope-flattened, so the visitor
        // shadows every declarator and a top-level const use stays dynamic
        // end to end — never a wrong Exact, only a silence-safe
        // completeness gap until provenance-per-entry lands.
        let facts = analyze_source(&format!("{IMPORT} const C = 'red'; css({{ color: C }})"));
        assert!(exact_keys(&facts).is_empty());
        assert_eq!(dynamic_count(&facts), 1);
    }

    #[test]
    fn unknowns_fixture_classifies_seven_dynamic_plus_static() {
        let facts = analyze_source(&format!(
            "{IMPORT} css({{ color: themeColor, width: props.w, height: `${{n}}px`, \
             padding: `${{color}}`, margin: maybeMargin(), borderWidth: a + b, \
             ...spreadMe, mt: '2r' }})"
        ));
        assert_eq!(
            exact_keys(&facts),
            vec![r#"["test",[],"mt","2r",false]"#.to_string()]
        );
        assert_eq!(dynamic_count(&facts), 7);
    }
}
