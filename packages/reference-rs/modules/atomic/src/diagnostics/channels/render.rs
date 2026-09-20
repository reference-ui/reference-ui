//! Per-fact rendering for the channel partition: one fact in, one line out.
//!
//! Partition asks policy to classify each fact, then renders the compiler
//! ones here by reconstructing the report each family reported from. The
//! re-derived sentence is byte-identical to the pushed legacy line, so the
//! strip matches by identity; analysis facts render fresh telemetry that
//! was never pushed. Anything without a channel sentence renders nothing.

use super::super::adapters::extract::ExtractReport;
use super::super::adapters::harvest::HarvestReport;
use super::super::adapters::resolve::ResolveReport;
use super::super::{
    DeclarationDetail, Diagnostic, DiagnosticFact, ExtractOutcome, Policy, ResolveDetail,
    ResolveOutcome, SourceCatalog, ValueDetail,
};

/// Render one compiler-classified fact to its channel line, if it has one.
pub(super) fn render_fact(
    fact: &DiagnosticFact,
    catalog: &SourceCatalog,
) -> Option<Diagnostic> {
    if let Some(line) = render_analysis(fact, catalog) {
        return Some(line);
    }
    if let Some(line) = render_producer(fact) {
        return Some(line);
    }
    render_resolve_refusal(fact)
}

/// Render one analysis observation through the source catalog.
fn render_analysis(fact: &DiagnosticFact, catalog: &SourceCatalog) -> Option<Diagnostic> {
    match fact {
        DiagnosticFact::ExactLookupExpected { site, key } => {
            let location = catalog.locate(site.source, site.span);
            Some(Policy::render_expected(key, &location))
        }
        DiagnosticFact::DynamicSlot { site, shape } => {
            let location = catalog.locate(site.source, site.span);
            Some(Policy::render_dynamic(&site.prop, *shape, &location))
        }
        _ => None,
    }
}

/// Render one producer fact by reconstructing its policy report.
fn render_producer(fact: &DiagnosticFact) -> Option<Diagnostic> {
    match fact {
        DiagnosticFact::ExtractOutcome {
            location,
            prop,
            when,
            outcome,
        } => {
            let ExtractOutcome::Refused {
                code,
                detail,
                sink_recorded,
            } = outcome;
            Some(Policy::render_extract(&ExtractReport {
                location: location.clone(),
                prop: prop.clone(),
                when: when.clone(),
                code: *code,
                detail: detail.clone(),
                sink_recorded: *sink_recorded,
            }))
        }
        DiagnosticFact::ExtractNote {
            location,
            severity,
            code,
            message,
        } => Some(Diagnostic {
            severity: *severity,
            code: *code,
            message: message.to_string(),
            file: location.file.clone(),
            line: location.line,
            column: location.column,
        }),
        DiagnosticFact::HarvestOutcome {
            location,
            prop,
            when,
            minted,
            offered,
        } => Some(Policy::render_harvest(&HarvestReport {
            location: location.clone(),
            prop: prop.clone(),
            when: when.clone(),
            minted: *minted,
            offered: offered.clone(),
        })),
        _ => None,
    }
}

/// Render one hole-valued resolve refusal; every other resolve outcome
/// stays userspace and renders nothing here.
fn render_resolve_refusal(fact: &DiagnosticFact) -> Option<Diagnostic> {
    let DiagnosticFact::ResolveOutcome {
        location,
        key,
        outcome,
    } = fact
    else {
        return None;
    };
    if !is_false_refusal(outcome) {
        return None;
    }
    Some(Policy::render_resolve(&ResolveReport {
        location: location.clone(),
        key: key.clone(),
        outcome: outcome.clone(),
    }))
}

/// True for a refusal of the hole value `false`: runtime skips it without
/// querying (mirrors proof's join gate and policy's verdict table).
pub(super) fn is_false_refusal(outcome: &ResolveOutcome) -> bool {
    matches!(
        outcome,
        ResolveOutcome::Rejected {
            detail: ResolveDetail::Declaration(DeclarationDetail::Value(
                ValueDetail::InvalidValue { value, .. }
            )),
            ..
        } if value.as_ref() == "false"
    )
}
