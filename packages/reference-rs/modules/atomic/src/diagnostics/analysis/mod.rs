//! Independent AST analysis entry: what exact plans will runtime request?
//!
//! Diagnostics borrows the compiler's parsed programs (no second parse), each
//! file's import provenance (collected once, shared with extraction), and the
//! resolved host surface, then predicts the exact runtime queries implied by
//! source; proof later compares those expectations against what the compiler
//! actually emitted. It never infers success from extraction's wants. The
//! `css()` and JSX surfaces walk here; conditions, values, and blocks are the
//! shared helpers both surfaces consult.

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

use std::collections::{BTreeMap, BTreeSet};

use rustc_hash::FxHashSet;

use crate::diagnostics::DiagnosticFact;
use crate::diagnostics::SourceId;
use crate::extract::constants::LocalConstants;
use crate::extract::{Composed, ExtractBindings, LocalOwned};
use crate::hosts::ResolvedHosts;

/// One compile input offered to analysis: path, text, and the borrowed parse
/// owned by `atomic::compile`, plus the resolved host surface, the shared
/// const values, the compiling system name for expected keys, and what the
/// compile composes, which decides the systems a non-own tag's keys target.
pub struct AnalysisInput<'a> {
    pub sources: Vec<AnalyzedSource<'a>>,
    pub hosts: &'a ResolvedHosts,
    pub constants: &'a LocalConstants,
    pub system: &'a str,
    pub composed: &'a Composed<'a>,
}

/// The borrowed compile inputs analysis walks: collected sources, their
/// parses, and each file's collected bindings, in matching order.
pub struct CompileParse<'a> {
    pub sources: &'a [(String, String)],
    pub parsed: &'a [oxc_parser::ParserReturn<'a>],
    pub bindings: &'a [ExtractBindings],
}

/// The per-compile frame `AnalysisInput::for_compile` borrows beside the parses:
/// host resolution, const values, the compiling system name and what it composes.
pub struct AnalysisScope<'a> {
    hosts: &'a ResolvedHosts,
    constants: &'a LocalConstants,
    system: &'a str,
    composed: &'a Composed<'a>,
}

impl<'a> AnalysisScope<'a> {
    pub fn new(
        hosts: &'a ResolvedHosts,
        constants: &'a LocalConstants,
        system: &'a str,
        composed: &'a Composed<'a>,
    ) -> Self {
        Self {
            hosts,
            constants,
            system,
            composed,
        }
    }
}

impl<'a> AnalysisInput<'a> {
    /// Build the analysis input for one compile: every unpanicked source
    /// becomes an analyzed source in input order. No source is reparsed.
    pub fn for_compile(parse: &CompileParse<'a>, scope: AnalysisScope<'a>) -> Self {
        let analyzed = parse
            .sources
            .iter()
            .zip(parse.parsed.iter())
            .zip(parse.bindings.iter())
            .filter(|((_, ret), _)| !ret.panicked)
            .map(|(((path, content), ret), bindings)| AnalyzedSource {
                path,
                content,
                program: &ret.program,
                bindings,
            })
            .collect();
        Self {
            sources: analyzed,
            hosts: scope.hosts,
            constants: scope.constants,
            system: scope.system,
            composed: scope.composed,
        }
    }
}

/// A single parsed source within an [`AnalysisInput`], with the bindings
/// extraction collected for the same program: the JSX gate reads their
/// provenance, so analysis and extraction classify every tag root alike.
pub struct AnalyzedSource<'a> {
    pub path: &'a str,
    pub content: &'a str,
    pub program: &'a oxc_ast::ast::Program<'a>,
    pub bindings: &'a ExtractBindings,
}

/// The per-compile context both surfaces share: host names, host-owned
/// props (exported, and each file's own components by path), const values, the system name, what
/// the compile composes, and the exact runtime style-prop set that decides responsive-value vs
/// condition positions.
pub struct AnalysisCtx<'a> {
    pub hosts: FxHashSet<String>,
    pub owned_props: &'a BTreeMap<String, BTreeSet<String>>,
    pub local_owned: &'a LocalOwned,
    pub constants: &'a LocalConstants,
    pub system: &'a str,
    pub composed: &'a Composed<'a>,
    pub style_props: FxHashSet<String>,
}

/// Predict exact expected lookups plus dynamic-shape facts for every source.
/// Sources keep their input order and each becomes one [`SourceId`] by index.
pub fn analyze(input: &AnalysisInput<'_>) -> Vec<DiagnosticFact> {
    let ctx = context(input.hosts, input.constants, input.system, input.composed);
    let mut facts = Vec::new();
    for (index, source) in input.sources.iter().enumerate() {
        let source_id = SourceId(index as u32);
        // Entries keep their slots (SourceId is positional): only the per-file
        // walks skip, never the vec. A styling-free file predicts no facts.
        if crate::styling_skip(source.content) {
            continue;
        }
        facts.extend(source_facts(&ctx, source_id, source));
    }
    facts
}

/// Hosts, constants, system name, and the composed facts shared by every
/// per-file analysis.
pub(crate) fn context<'a>(
    hosts: &'a ResolvedHosts,
    constants: &'a LocalConstants,
    system: &'a str,
    composed: &'a Composed<'a>,
) -> AnalysisCtx<'a> {
    let mut names = FxHashSet::default();
    names.extend(hosts.traced.iter().cloned());
    names.extend(hosts.configured.iter().cloned());
    AnalysisCtx {
        hosts: names,
        owned_props: &hosts.owned_props,
        local_owned: &hosts.local_owned,
        constants,
        system,
        composed,
        style_props: crate::runtime::get_style_prop_names().into_iter().collect(),
    }
}

/// The facts one unskipped source predicts: each surface runs only when
/// its bytes are present, and the import scan runs once for both. The JSX
/// surface also reads the source's shared provenance.
pub(crate) fn source_facts(
    ctx: &AnalysisCtx<'_>,
    source_id: SourceId,
    source: &AnalyzedSource<'_>,
) -> Vec<DiagnosticFact> {
    let mut facts = Vec::new();
    let run_css = !css_walk_skip(source.content);
    let run_jsx = !jsx_walk_skip(source.content);
    if !run_css && !run_jsx {
        return facts;
    }
    let bindings = imports::scan_imports(source.program);
    if run_css {
        facts.extend(css::expectations(ctx, source_id, source, &bindings));
    }
    if run_jsx {
        facts.extend(jsx::expectations(ctx, source_id, source, &bindings));
    }
    facts
}

/// True when the `css()` walk can skip this file: every live `css` site
/// needs `css` bytes in the content — the imported name (`css`,
/// `__reference_ui_css`), the reserved alias, or a `.css` member — so
/// `css`-free bytes hold no site. Aliased calls still carry the bytes in
/// their import; shadows and the import scan itself emit no facts.
pub(crate) fn css_walk_skip(content: &str) -> bool {
    !content.contains("css")
}

/// True when the JSX walk can skip this file: every JSX element needs a
/// `<` byte, so `<`-free bytes parse to no JSX nodes and the walk predicts
/// nothing. Comparisons and generics keep the walk (conservative); the
/// shadow stack and the import scan emit no facts on their own.
pub(crate) fn jsx_walk_skip(content: &str) -> bool {
    !content.contains('<')
}

/// True when any enclosing scope declares `name`. Both surface visitors
/// share this shadow test so gating agrees everywhere.
pub fn is_shadowed(shadows: &[FxHashSet<String>], name: &str) -> bool {
    shadows.iter().any(|scope| scope.contains(name))
}

/// Record param-bound names as shadows in the innermost scope. Every
/// identifier a pattern binds shadows the project bag — plain, renamed,
/// defaulted, nested, and rest elements alike — exactly like extraction's
/// scope table, which binds destructured params as params (scope/collect).
/// Missing a binding lets a param resolve to a cross-file same-named const,
/// a false exact (SITE-53's ghost).
pub fn record_param_shadows(
    shadows: &mut [FxHashSet<String>],
    params: &oxc_ast::ast::FormalParameters<'_>,
) {
    let Some(scope) = shadows.last_mut() else {
        return;
    };
    for param in &params.items {
        bind_pattern_names(&param.pattern, scope);
    }
}

/// Every identifier one binding pattern declares, however nested.
fn bind_pattern_names(pattern: &oxc_ast::ast::BindingPattern<'_>, scope: &mut FxHashSet<String>) {
    use oxc_ast::ast::BindingPattern;
    match pattern {
        BindingPattern::BindingIdentifier(id) => {
            scope.insert(id.name.to_string());
        }
        BindingPattern::ObjectPattern(obj) => bind_object_pattern_names(obj, scope),
        BindingPattern::ArrayPattern(arr) => bind_array_pattern_names(arr, scope),
        BindingPattern::AssignmentPattern(assign) => bind_pattern_names(&assign.left, scope),
    }
}

/// Every identifier an object pattern declares: listed values plus rest.
fn bind_object_pattern_names(obj: &oxc_ast::ast::ObjectPattern<'_>, scope: &mut FxHashSet<String>) {
    for prop in &obj.properties {
        bind_pattern_names(&prop.value, scope);
    }
    if let Some(rest) = &obj.rest {
        bind_pattern_names(&rest.argument, scope);
    }
}

/// Every identifier an array pattern declares: elements plus rest.
fn bind_array_pattern_names(arr: &oxc_ast::ast::ArrayPattern<'_>, scope: &mut FxHashSet<String>) {
    for element in arr.elements.iter().flatten() {
        bind_pattern_names(element, scope);
    }
    if let Some(rest) = &arr.rest {
        bind_pattern_names(&rest.argument, scope);
    }
}

/// Record an identifier declarator as a shadow in the innermost scope.
/// Silence gap (F-G1b, kept deliberately): the const's own declaration
/// self-shadows, so no const-driven exact arises end-to-end — uses stay
/// dynamic, never wrong. Skipping bag-member names would be unsound: the
/// bag is scope-flattened, so an inner `let`/unrecorded-`const` redeclare
/// of the same name would falsely resolve to the outer const. The sound
/// fix needs declaration provenance per bag entry; until then legacy
/// resolve lines still warn const-driven drops, just unnamed by proof.
pub fn record_declarator_shadow(
    shadows: &mut [FxHashSet<String>],
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
mod tests;
