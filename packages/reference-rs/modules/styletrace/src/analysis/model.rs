//! Defines the internal graph representations and binding structures used in styletrace wrapper analysis.
//! It takes parsed JSX elements, component definitions, and import bindings from the AST.
//! Organizes these elements into nodes and edges representing the component hierarchy and data flow.
//! Emits structural models that the analyzer uses to resolve style trace paths across modules.

use std::collections::{BTreeMap, BTreeSet, HashMap};

use oxc_ast::ast::Expression;
use rustc_hash::FxHashMap;

#[derive(
    Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, serde::Serialize, serde::Deserialize,
)]
pub struct TracedBinding {
    pub module: String,
    pub name: String,
}

impl TracedBinding {
    pub fn new(module: impl Into<String>, name: impl Into<String>) -> Self {
        Self {
            module: module.into(),
            name: name.into(),
        }
    }
}

#[derive(Clone)]
pub struct TraceModule {
    pub(super) components: FxHashMap<String, TraceComponent>,
    pub(super) component_factories: FxHashMap<String, FactoryCall>,
    pub(super) factories: FxHashMap<String, TraceFactory>,
    pub(super) exports: HashMap<String, ExportTarget>,
    pub(super) export_all_sources: Vec<String>,
    pub(super) namespace_exports: Vec<NamespaceExport>,
    pub(super) class_components: Vec<String>,
    pub(super) imports: FxHashMap<String, TraceImport>,
    pub(super) member_aliases: Vec<MemberAlias>,
    pub(super) identifier_aliases: FxHashMap<String, String>,
}

impl TraceModule {
    /// Empty module standing in for an edge target that failed to parse.
    /// The failure is recorded as a diagnostic; the edge contributes nothing.
    pub(super) fn empty() -> Self {
        Self {
            components: FxHashMap::default(),
            component_factories: FxHashMap::default(),
            factories: FxHashMap::default(),
            exports: HashMap::new(),
            export_all_sources: Vec::new(),
            namespace_exports: Vec::new(),
            class_components: Vec::new(),
            imports: FxHashMap::default(),
            member_aliases: Vec::new(),
            identifier_aliases: FxHashMap::default(),
        }
    }
}

/// One `export * as Name from 'source'`: every traced name `source` exposes mints as `Name.<name>`.
#[derive(Clone)]
pub(super) struct NamespaceExport {
    pub(super) namespace: String,
    pub(super) source: String,
}

/// One compound-member assignment (`Tabs.Panel = TabPanel`): the dotted
/// use-site spelling (`namespace.prop`) for a traced wrapper `target`.
#[derive(Clone)]
pub(super) struct MemberAlias {
    pub(super) namespace: String,
    pub(super) prop: String,
    pub(super) target: String,
}

impl MemberAlias {
    /// The dotted host the consumer spells (`Tabs.Panel`).
    pub(super) fn host(&self) -> String {
        format!("{}.{}", self.namespace, self.prop)
    }
}

#[derive(Clone)]
pub(super) enum FactoryTarget {
    Local(String),
    Imported {
        source: String,
        imported_name: String,
    },
}

/// One factory call site (`export const Fancy = withPad(Box)`): the callee plus each argument.
/// An argument naming a component resolves to an edge target in the calling module; `None` marks
/// an argument that names no component, such as a call, a spread or a literal.
#[derive(Clone)]
pub(super) struct FactoryCall {
    pub(super) target: FactoryTarget,
    pub(super) args: Vec<Option<EdgeTarget>>,
}

#[derive(Clone)]
pub(super) struct TraceFactory {
    pub(super) component: TraceComponent,
}

impl TraceFactory {
    /// True when the product forwards style props into one of the factory's own parameters, which
    /// makes the factory a higher-order component whose verdict depends on its call's arguments.
    pub(super) fn forwards_params(&self) -> bool {
        self.component
            .edges
            .iter()
            .any(|edge| matches!(edge.target, EdgeTarget::Parameter(_)))
    }
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
    pub(super) owned_props: BTreeSet<String>,
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
    /// A parameter of the higher-order component that produced the edge's component. It takes
    /// the verdict of the argument the call site passes in that position.
    Parameter(usize),
}

/// The props a wrapper's type argument declares (`forwardRef<Ref, Props>`): the StyleProps names it
/// exposes and the names its own declaration owns. The wrapped function is often unannotated, so
/// the generic is the only place its declared names exist.
#[derive(Clone, Default)]
pub(super) struct WrapperProps {
    pub(super) style_props: BTreeSet<String>,
    pub(super) owned_props: BTreeSet<String>,
}

#[derive(Default)]
pub(super) struct PropBindings {
    pub(super) direct_style_bindings: BTreeSet<String>,
    pub(super) props_object_bindings: BTreeSet<String>,
    pub(super) spread_bindings: BTreeSet<String>,
    pub(super) owned_props: BTreeSet<String>,
    /// Prop names pulled out of the props object (param or top-level body
    /// destructure). The §14 shadow keeps only these: names riding the
    /// props/rest spread into the primitive are forwarded styles, and the
    /// call site mints them.
    pub(super) destructured_prop_names: BTreeSet<String>,
    /// Local name to prop name for each of those pulls, renames included
    /// (`{ id: ident }` maps `ident` to `id`). The body walk reads it to see
    /// which props reach an element under their own name: a prop passed on
    /// is not kept.
    pub(super) destructured_locals: BTreeMap<String, String>,
}

impl PropBindings {
    /// Records every pulled-out prop, style or not: the §14 shadow keeps only
    /// these, and the walk maps each local back to its prop to see what the
    /// body passes on. Quoted keys normalize like the type side does.
    pub(super) fn record_destructured(&mut self, destructured: &[ObjectPatternBinding]) {
        for binding in destructured {
            let prop_name = binding.prop_name.trim_matches(['"', '\'']).to_string();
            self.destructured_locals
                .insert(binding.local_name.clone(), prop_name.clone());
            self.destructured_prop_names.insert(prop_name);
        }
    }

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
            Expression::LogicalExpression(logical) => {
                self.expression_reads_style_prop(&logical.left)
                    || self.expression_reads_style_prop(&logical.right)
            }
            Expression::ConditionalExpression(conditional) => {
                // Value positions only: the test gates the branch taken but
                // its value never reaches the sink, so it must not count.
                self.expression_reads_style_prop(&conditional.consequent)
                    || self.expression_reads_style_prop(&conditional.alternate)
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
