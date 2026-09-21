//! Recursive collector for style expressions.
//!
//! Traverses AST expressions to extract literal style values into `Want` declarations.
//! Open ternaries scoop both branches and open logicals scoop both operands,
//! preserving responsive array ordering and condition scopes; folded tests
//! and all-literal short-circuits compile only the live value with an info
//! naming the dead arm. Nothing here evaluates runtime JavaScript.

pub(crate) mod branch;
pub(crate) mod call;
pub(crate) mod leaf;
pub(crate) mod member;
pub(crate) mod util;

pub(crate) use branch::is_guard_expression;
pub(crate) use util::{block_value_kind, is_silent_block_value, unwrap_wrapper_target};

use oxc_ast::ast::Expression;
use oxc_span::{GetSpan, Span};
use smallvec::SmallVec;

use super::literal::{
    extract_template_literal, push_bool_want, push_number_want, push_string_want,
};
use crate::atom::{AtomValue, Want};
use crate::diagnostics::adapters::extract::{extract_note, ExtractReport};
use crate::diagnostics::{
    line_col, Diagnostic, DiagnosticCode, DiagnosticFact, DiagnosticLocation, DiagnosticSeverity,
    DiagnosticSink, DiagnosticsSession, ExtractDetail, LineIndex, Policy,
};
use crate::extract::harvest::{is_sink_code, Sink, SinkSite};
use crate::extract::scope::Scoped;
use base_system::BreakpointScale;

/// Context for traversing an expression tree to extract style leaf values.
pub struct ExpressionWalk<'a> {
    pub prop: &'a str,
    pub origin: Option<&'a str>,
    pub important: bool,
    pub file: &'a str,
    pub source: Option<&'a str>,
    pub line_index: Option<&'a LineIndex>,
    pub scopes: Scoped<'a>,
    pub breakpoints: &'a BreakpointScale,
    pub wants: &'a mut Vec<Want>,
    pub diagnostics: &'a mut Vec<Diagnostic>,
    pub sinks: &'a mut Vec<Sink>,
    pub session: &'a mut DiagnosticsSession,
}

/// One refused dynamic value position: structured detail policy renders
/// plus the harvest sink it records. Bundled so the hook stays under the
/// arg cap. Callers pass data, never sentences.
pub struct DynamicRefusal<'w> {
    pub span: Span,
    pub code: DiagnosticCode,
    pub detail: ExtractDetail,
    pub when: &'w SmallVec<[Box<str>; 2]>,
}

impl<'a> ExpressionWalk<'a> {
    /// Return the breakpoint condition name for a responsive array index.
    pub fn breakpoint_for_index(&self, index: usize) -> Option<&str> {
        // mt={['1r', '2r', '4r']}  →  0=base, 1=sm, 2=md
        self.breakpoints.breakpoint_for_index(index)
    }

    /// Push an extracted Want to the collection.
    pub fn push_want(
        &mut self,
        value: AtomValue,
        when: SmallVec<[Box<str>; 2]>,
        important: bool,
        span: Option<Span>,
    ) {
        let mut want = Want::new(self.prop, value)
            .with_when(when)
            .with_important(self.important || important)
            .with_origin(self.origin);
        want.file = Some(self.file.into());
        if let Some(position) = self.span_position(span) {
            want.line = Some(position.0);
            want.column = Some(position.1);
        }
        self.wants.push(want);
    }

    /// 1-based line/column for a literal span, or None without source text.
    fn span_position(&self, span: Option<Span>) -> Option<(u32, u32)> {
        let source = self.source?;
        let start = span?.start;
        match self.line_index {
            Some(index) => index.line_col(source, start),
            None => line_col(source, start),
        }
    }

    /// Report a diagnostic warning at the offending node's span.
    pub fn warn(&mut self, span: Span, code: DiagnosticCode, message: impl Into<String>) {
        let message: String = message.into();
        let (line, column) = self.span_position(Some(span)).unzip();
        let location = DiagnosticLocation {
            file: Some(self.file.to_string()),
            line,
            column,
        };
        self.diagnostics
            .push(location.warning(code, message.clone()));
        self.session
            .report(extract_note(location, DiagnosticSeverity::Warning, code, message));
    }

    /// Report a userspace-visible warning at the offending node's span.
    /// Unlike `warn`, this pushes the line directly with no session fact,
    /// so the partition keeps it on default (the static/global pattern).
    /// Reserved for static refusals whose author must act without opting
    /// into the compiler channel; dynamic value positions keep the funnel.
    pub fn warn_default(&mut self, span: Span, code: DiagnosticCode, message: impl Into<String>) {
        let message: String = message.into();
        let (line, column) = self.span_position(Some(span)).unzip();
        let location = DiagnosticLocation {
            file: Some(self.file.to_string()),
            line,
            column,
        };
        self.diagnostics.push(location.warning(code, message));
    }

    /// Report an info diagnostic at the offending node's span.
    pub fn info(&mut self, span: Span, code: DiagnosticCode, message: impl Into<String>) {
        let message: String = message.into();
        let (line, column) = self.span_position(Some(span)).unzip();
        let location = DiagnosticLocation {
            file: Some(self.file.to_string()),
            line,
            column,
        };
        self.diagnostics.push(location.info(code, message.clone()));
        self.session
            .report(extract_note(location, DiagnosticSeverity::Info, code, message));
    }

    /// Warn a dynamic refusal in value position, recording its harvest sink.
    /// This is the one sink hook: every Dynamic* call site in value
    /// position funnels through here, so sinks stay exactly the refused
    /// value positions. Non-dynamic codes (a mutated element base) warn
    /// without recording. Spread-position call refusals (object/spread.rs)
    /// are the explicit exception (Slice 3 Q5b): a spread names no prop,
    /// so the refused fragment is not a mintable value position and warns
    /// without a sink — recording one would mint pool values onto a
    /// position the author never refused.
    pub fn warn_dynamic(&mut self, refusal: DynamicRefusal<'_>) {
        let DynamicRefusal {
            span,
            code,
            detail,
            when,
        } = refusal;
        let (line, column) = self.span_position(Some(span)).unzip();
        let mut sink_recorded = false;
        if is_sink_code(code) {
            if let Some(sink) = Sink::for_site(SinkSite {
                prop: self.prop,
                when,
                file: self.file,
                line,
                column,
            }) {
                self.sinks.push(sink);
                sink_recorded = true;
            }
        }
        let report = ExtractReport {
            location: DiagnosticLocation {
                file: Some(self.file.to_string()),
                line,
                column,
            },
            prop: self.prop.into(),
            when: when.iter().cloned().collect(),
            code,
            detail,
            sink_recorded,
        };
        let diagnostic = Policy::render_extract(&report);
        self.session.report(DiagnosticFact::from(report));
        self.diagnostics.push(diagnostic);
    }
}

/// Recursively collect style leaves from an expression into Wants.
pub fn walk_expression(
    ctx: &mut ExpressionWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // bg={on ? 'n300' : 'n100'}  /  mt="2r"  /  mt={['1r', '2r']}
    if walk_literal(ctx, expr, when) {
        return;
    }
    if walk_wrapper(ctx, expr, when) {
        return;
    }
    if branch::walk_branching(ctx, expr, when) {
        return;
    }
    walk_fallback(ctx, expr, when);
}

fn walk_literal(
    ctx: &mut ExpressionWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) -> bool {
    match expr {
        Expression::StringLiteral(lit) => {
            // '2r' / "blue.600"
            push_string_want(ctx, lit, when);
            true
        }
        Expression::NumericLiteral(lit) => {
            // opacity={0.5}
            push_number_want(ctx, lit, when);
            true
        }
        Expression::BooleanLiteral(lit) => {
            // truncate={false}
            push_bool_want(ctx, lit, when);
            true
        }
        Expression::NullLiteral(_) => {
            // bg={on ? 'n300' : null}  — omit
            true
        }
        _ => false,
    }
}

fn walk_wrapper(
    ctx: &mut ExpressionWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) -> bool {
    let Some(target) = util::unwrap_wrapper_target(expr) else {
        return false;
    };
    walk_expression(ctx, target, when);
    true
}

fn walk_fallback(
    ctx: &mut ExpressionWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    match expr {
        Expression::TemplateLiteral(lit) => {
            // `2r`  /  `2${n}r`
            extract_template_literal(ctx, lit, when);
        }
        Expression::Identifier(ident) => {
            // mt={space}  where  const space = '2r'
            leaf::handle_identifier_fallback(ctx, ident.name.as_str(), when, ident.span);
        }
        Expression::StaticMemberExpression(mem) => {
            // color={theme.primary}  where  const theme = { primary: 'n300' }
            member::handle_static_member(ctx, mem, when);
        }
        Expression::ComputedMemberExpression(mem) => {
            // color={colors['red']}  /  margin={sizes[1]}
            member::handle_computed_member(ctx, mem, when);
        }
        Expression::ChainExpression(chain) => {
            // margin={sizes?.[k]}  — computed chains fold; member chains stay dynamic (SITE-34)
            member::handle_chain(ctx, chain, when);
        }
        Expression::UnaryExpression(unary) => {
            // left={-2}  /  void 0
            leaf::handle_unary(ctx, unary, when);
        }
        Expression::BinaryExpression(binary) => {
            // width={1 + 'px'}  /  order={2 * 3}  /  zIndex={n > 1}
            leaf::handle_binary(ctx, binary, when);
        }
        Expression::CallExpression(call) => {
            // color={token('colors.red.500')}  — the token surface folds it
            call::handle_token_call(ctx, call, when);
        }
        _ => {
            // width={props.w}  — dynamic, warn, keep siblings
            call::warn_dynamic_expression(ctx, expr.span(), when);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::diagnostics::{DiagnosticFact, ExtractOutcome, LeafDetail};
    use oxc_allocator::Allocator;
    use oxc_parser::Parser;

    /// Drive the sink hook directly: Q5a pins that a mutated base warns
    /// without recording, and the fact records no sink.
    #[test]
    fn mutated_binding_warns_without_sink_and_records_no_sink() {
        let code = "const sizes = ['1r'];\n";
        let allocator = Allocator::default();
        let source_type =
            oxc_span::SourceType::from_path(std::path::Path::new("t.ts")).unwrap_or_default();
        let parsed = Parser::new(&allocator, code, source_type).parse();
        assert!(!parsed.panicked);
        let bag = crate::extract::constants::collect_local_constants(&parsed.program, "t.ts", None);
        let table = crate::extract::scope::collect(&parsed.program, &bag);
        let stub = crate::extract::scope::ImportLookup::ProjectBag(&bag);
        let chain = crate::extract::scope::ScopeChain::new(&table, stub);
        let breakpoints = BreakpointScale::default();
        let mut wants = Vec::new();
        let mut diagnostics = Vec::new();
        let mut sinks = Vec::new();
        let mut session = DiagnosticsSession::new();
        {
            let mut ctx = ExpressionWalk {
                prop: "mt",
                origin: None,
                important: false,
                file: "t.ts",
                source: Some(code),
                line_index: None,
                scopes: chain.at(crate::extract::scope::ROOT_SCOPE),
                breakpoints: &breakpoints,
                wants: &mut wants,
                diagnostics: &mut diagnostics,
                sinks: &mut sinks,
                session: &mut session,
            };
            ctx.warn_dynamic(DynamicRefusal {
                span: Span::new(0, 5),
                code: DiagnosticCode::MutatedBinding,
                detail: ExtractDetail::Leaf(LeafDetail::Generic),
                when: &SmallVec::new(),
            });
            ctx.warn_dynamic(DynamicRefusal {
                span: Span::new(0, 5),
                code: DiagnosticCode::DynamicIdentifier,
                detail: ExtractDetail::Leaf(LeafDetail::Identifier { name: "k".into() }),
                when: &SmallVec::new(),
            });
        }
        assert_eq!(diagnostics.len(), 2);
        assert_eq!(diagnostics[0].code, DiagnosticCode::MutatedBinding);
        assert_eq!(sinks.len(), 1);
        let facts = session.take_facts();
        assert_eq!(facts.len(), 2);
        let unrecorded = matches!(
            facts[0],
            DiagnosticFact::ExtractOutcome {
                outcome: ExtractOutcome::Refused {
                    sink_recorded: false,
                    ..
                },
                ..
            }
        );
        let recorded = matches!(
            facts[1],
            DiagnosticFact::ExtractOutcome {
                outcome: ExtractOutcome::Refused {
                    sink_recorded: true,
                    ..
                },
                ..
            }
        );
        assert!(unrecorded, "mutated fact records no sink");
        assert!(recorded, "identifier fact records its sink");
    }
}
