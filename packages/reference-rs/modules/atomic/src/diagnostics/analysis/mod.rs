//! Independent AST analysis entry: what exact plans will runtime request?
//!
//! Diagnostics borrows the compiler's parsed programs (no second parse) and
//! the resolved host surface, then predicts the exact runtime queries implied
//! by source; proof later compares those expectations against what the
//! compiler actually emitted. It never infers success from extraction's
//! wants. The `css()` and JSX surfaces walk here; conditions, values, and
//! blocks are the shared helpers both surfaces consult.

pub mod block;
pub mod conditions;
pub mod const_values;
pub mod css;
pub mod gate;
pub mod imports;
pub mod jsx;
pub mod jsx_attrs;
pub mod object;
pub mod structured;
#[cfg(test)]
pub(crate) mod support;
pub mod values;

use std::collections::{BTreeMap, BTreeSet, HashSet};

use crate::diagnostics::DiagnosticFact;
use crate::diagnostics::SourceId;
use crate::extract::constants::LocalConstants;
use crate::hosts::ResolvedHosts;

/// One compile input offered to analysis: path, text, and the borrowed parse
/// owned by `atomic::compile`, plus the resolved host surface, the shared
/// const values, and the compiling system name for expected keys.
pub struct AnalysisInput<'a> {
    pub sources: Vec<AnalyzedSource<'a>>,
    pub hosts: &'a ResolvedHosts,
    pub constants: &'a LocalConstants,
    pub system: &'a str,
}

/// The borrowed compile inputs analysis walks: collected sources plus
/// their parses, in matching order.
pub struct CompileParse<'a> {
    pub sources: &'a [(String, String)],
    pub parsed: &'a [oxc_parser::ParserReturn<'a>],
}

impl<'a> AnalysisInput<'a> {
    /// Build the analysis input for one compile: every unpanicked source
    /// becomes an analyzed source in input order. No source is reparsed.
    pub fn for_compile(
        parse: &CompileParse<'a>,
        hosts: &'a ResolvedHosts,
        constants: &'a LocalConstants,
        system: &'a str,
    ) -> Self {
        let analyzed = parse
            .sources
            .iter()
            .zip(parse.parsed.iter())
            .filter(|(_, ret)| !ret.panicked)
            .map(|((path, content), ret)| AnalyzedSource {
                path,
                content,
                program: &ret.program,
            })
            .collect();
        Self {
            sources: analyzed,
            hosts,
            constants,
            system,
        }
    }
}

/// A single parsed source within an [`AnalysisInput`].
pub struct AnalyzedSource<'a> {
    pub path: &'a str,
    pub content: &'a str,
    pub program: &'a oxc_ast::ast::Program<'a>,
}

/// The per-compile context both surfaces share: host names, host-owned
/// props, const values, the system name, and the exact runtime style-prop
/// set that decides responsive-value vs condition positions.
pub struct AnalysisCtx<'a> {
    pub hosts: HashSet<String>,
    pub owned_props: &'a BTreeMap<String, BTreeSet<String>>,
    pub constants: &'a LocalConstants,
    pub system: &'a str,
    pub style_props: HashSet<String>,
}

/// Predict exact expected lookups plus dynamic-shape facts for every source.
/// Sources keep their input order and each becomes one [`SourceId`] by index.
pub fn analyze(input: &AnalysisInput<'_>) -> Vec<DiagnosticFact> {
    let mut hosts = HashSet::new();
    hosts.extend(input.hosts.traced.iter().cloned());
    hosts.extend(input.hosts.configured.iter().cloned());
    let ctx = AnalysisCtx {
        hosts,
        owned_props: &input.hosts.owned_props,
        constants: input.constants,
        system: input.system,
        style_props: crate::runtime::get_style_prop_names().into_iter().collect(),
    };
    let mut facts = Vec::new();
    for (index, source) in input.sources.iter().enumerate() {
        let source_id = SourceId(index as u32);
        facts.extend(css::expectations(&ctx, source_id, source));
        facts.extend(jsx::expectations(&ctx, source_id, source));
    }
    facts
}

/// True when any enclosing scope declares `name`. Both surface visitors
/// share this shadow test so gating agrees everywhere.
pub fn is_shadowed(shadows: &[HashSet<String>], name: &str) -> bool {
    shadows.iter().any(|scope| scope.contains(name))
}

/// Record identifier params as shadows in the innermost scope. Destructured
/// params bind nothing here, exactly like the extraction walk.
pub fn record_param_shadows(
    shadows: &mut [HashSet<String>],
    params: &oxc_ast::ast::FormalParameters<'_>,
) {
    use oxc_ast::ast::BindingPattern;
    let Some(scope) = shadows.last_mut() else {
        return;
    };
    for param in &params.items {
        if let BindingPattern::BindingIdentifier(id) = &param.pattern {
            scope.insert(id.name.to_string());
        }
    }
}

/// Record an identifier declarator as a shadow in the innermost scope.
pub fn record_declarator_shadow(
    shadows: &mut [HashSet<String>],
    decl: &oxc_ast::ast::VariableDeclarator<'_>,
) {
    use oxc_ast::ast::BindingPattern;
    let Some(scope) = shadows.last_mut() else {
        return;
    };
    let BindingPattern::BindingIdentifier(id) = &decl.id else {
        return;
    };
    scope.insert(id.name.to_string());
}

#[cfg(test)]
mod tests {
    use super::support::{analyze_source, parse_for_test};
    use super::*;
    use crate::extract::constants::LocalConstants;

    #[test]
    fn analysis_predicts_nothing_for_no_sources() {
        let hosts = ResolvedHosts {
            traced: Vec::new(),
            configured: Vec::new(),
            owned_props: BTreeMap::new(),
        };
        let constants = LocalConstants::new();
        let input = AnalysisInput {
            sources: Vec::new(),
            hosts: &hosts,
            constants: &constants,
            system: "test",
        };
        assert!(analyze(&input).is_empty());
    }

    #[test]
    fn sources_keep_input_order_as_source_ids() {
        let allocator = oxc_allocator::Allocator::default();
        let first = parse_for_test(
            &allocator,
            "import { css } from '@reference-ui/react'; css({ color: 'red' })",
        );
        let second = parse_for_test(
            &allocator,
            "import { css } from '@reference-ui/react'; css({ color: 'blue' })",
        );
        let constants =
            crate::extract::constants::collect_local_constants(&first, "a.ts", Some("a"));
        let hosts = ResolvedHosts {
            traced: Vec::new(),
            configured: Vec::new(),
            owned_props: BTreeMap::new(),
        };
        let input = AnalysisInput {
            sources: vec![
                AnalyzedSource {
                    path: "a.ts",
                    content: "a",
                    program: &first,
                },
                AnalyzedSource {
                    path: "b.ts",
                    content: "b",
                    program: &second,
                },
            ],
            hosts: &hosts,
            constants: &constants,
            system: "test",
        };
        let ids: Vec<SourceId> = analyze(&input)
            .iter()
            .filter_map(|fact| match fact {
                DiagnosticFact::ExactLookupExpected { site, .. } => Some(site.source),
                _ => None,
            })
            .collect();
        assert_eq!(ids, vec![SourceId(0), SourceId(1)]);
    }

    #[test]
    fn for_compile_filters_panicked_sources() {
        let allocator = oxc_allocator::Allocator::default();
        let sources = vec![("a.ts".to_string(), "css({ color: 'red' })".to_string())];
        let parsed = vec![parse_raw(&allocator, &sources[0].1)];
        let hosts = ResolvedHosts {
            traced: Vec::new(),
            configured: Vec::new(),
            owned_props: BTreeMap::new(),
        };
        let constants = LocalConstants::new();
        let parse = CompileParse {
            sources: &sources,
            parsed: &parsed,
        };
        let input = AnalysisInput::for_compile(&parse, &hosts, &constants, "test");
        assert_eq!(input.sources.len(), 1);
        assert_eq!(input.sources[0].path, "a.ts");
    }

    #[cfg(test)]
    fn parse_raw<'a>(
        allocator: &'a oxc_allocator::Allocator,
        source: &'a str,
    ) -> oxc_parser::ParserReturn<'a> {
        use oxc_parser::Parser;
        use oxc_span::SourceType;
        Parser::new(allocator, source, SourceType::tsx()).parse()
    }

    #[test]
    fn end_to_end_fixture_predicts_both_surfaces() {
        let facts = analyze_source("import { css, Div } from '@reference-ui/react'; css({ color: 'red' }); const el = <Div mt=\"2r\" />;");
        assert_eq!(facts.len(), 2);
    }
}
