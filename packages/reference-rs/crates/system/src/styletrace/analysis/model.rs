//! Internal graph and binding structures for styletrace wrapper analysis.

use std::collections::{BTreeSet, HashMap};

use oxc_ast::ast::Expression;

#[derive(Clone)]
pub(super) struct TraceModule {
    pub(super) components: HashMap<String, TraceComponent>,
    pub(super) component_factories: HashMap<String, FactoryTarget>,
    pub(super) factories: HashMap<String, TraceFactory>,
    pub(super) exports: HashMap<String, ExportTarget>,
    pub(super) export_all_sources: Vec<String>,
}

#[derive(Clone)]
pub(super) enum FactoryTarget {
    Local(String),
    Imported {
        source: String,
        imported_name: String,
    },
}

#[derive(Clone)]
pub(super) struct TraceFactory {
    pub(super) component: TraceComponent,
}

#[derive(Clone)]
pub(super) struct TraceImport {
    pub(super) source: String,
    pub(super) imported_name: String,
    pub(super) is_namespace: bool,
}

#[derive(Clone)]
pub(super) enum ExportTarget {
    Local(String),
    Imported {
        source: String,
        imported_name: String,
    },
}

#[derive(Clone)]
pub(super) struct TraceComponent {
    pub(super) exposes_style_props: bool,
    pub(super) uses_style_pipeline: bool,
    pub(super) edges: Vec<ComponentEdge>,
}

#[derive(Clone)]
pub(super) struct ComponentEdge {
    pub(super) target: EdgeTarget,
}

#[derive(Clone)]
pub(super) enum EdgeTarget {
    Primitive(String),
    Local(String),
    Imported {
        source: String,
        imported_name: String,
    },
}

#[derive(Default)]
pub(super) struct PropBindings {
    pub(super) direct_style_bindings: BTreeSet<String>,
    pub(super) props_object_bindings: BTreeSet<String>,
    pub(super) spread_bindings: BTreeSet<String>,
}

impl PropBindings {
    pub(super) fn exposes_style_props(&self) -> bool {
        !self.direct_style_bindings.is_empty()
            || !self.props_object_bindings.is_empty()
            || !self.spread_bindings.is_empty()
    }

    pub(super) fn expression_reads_style_prop(&self, expression: &Expression<'_>) -> bool {
        match expression {
            Expression::Identifier(identifier) => {
                self.direct_style_bindings
                    .contains(identifier.name.as_str())
                    || self.spread_bindings.contains(identifier.name.as_str())
            }
            Expression::StaticMemberExpression(member) => {
                if let Expression::Identifier(identifier) = &member.object {
                    return self
                        .props_object_bindings
                        .contains(identifier.name.as_str())
                        || self.spread_bindings.contains(identifier.name.as_str());
                }
                self.expression_reads_style_prop(&member.object)
            }
            Expression::ComputedMemberExpression(member) => {
                self.expression_reads_style_prop(&member.object)
                    || self.expression_reads_style_prop(&member.expression)
            }
            Expression::ParenthesizedExpression(parenthesized) => {
                self.expression_reads_style_prop(&parenthesized.expression)
            }
            Expression::TSAsExpression(asserted) => {
                self.expression_reads_style_prop(&asserted.expression)
            }
            Expression::TSSatisfiesExpression(asserted) => {
                self.expression_reads_style_prop(&asserted.expression)
            }
            Expression::TSTypeAssertion(asserted) => {
                self.expression_reads_style_prop(&asserted.expression)
            }
            Expression::TSNonNullExpression(asserted) => {
                self.expression_reads_style_prop(&asserted.expression)
            }
            _ => false,
        }
    }
}

#[derive(Clone)]
pub(super) struct ObjectPatternBinding {
    pub(super) prop_name: String,
    pub(super) local_name: String,
}
