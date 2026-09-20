//! Join point for the `_` catalog and `&` selector application.
//! Lowers an authored `when` string once into `When`, which carries the class
//! segment and the wrap together. Named `_` keys ask `BaseSystem` first; presets
//! remain only for keys the utterance does not list. Named breakpoint tokens
//! lower to `@container (min-width: Npx)` from the scale. Unknown keys return
//! `LoweredWhen::Unknown` so resolve can warn and drop the want.

pub mod pseudoprops;
pub mod pseudoselectors;

use crate::atom::When;
use crate::diagnostics::adapters::resolve::ResolveReport;
use crate::diagnostics::{
    DeclarationDetail, DiagnosticCode, DiagnosticFact, DiagnosticLocation, DiagnosticSink,
    DiagnosticsSession, Policy, ResolveDetail, ResolveOutcome,
};
use base_system::BaseSystem;

/// Result of parsing one authored condition string.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LoweredWhen {
    /// `base` is not a prefix; skip it.
    Skip,
    /// Catalog, breakpoint, at-rule, or `&` selector.
    Known(When),
    /// Unrecognised `_` key or leftover token. Not a wrap. Not a name segment.
    Unknown,
}

/// Lower a `when` token into a `When`, or skip / refuse it.
pub fn lower_when(raw: &str, system: &BaseSystem) -> LoweredWhen {
    if raw == "base" {
        return LoweredWhen::Skip;
    }
    if let Some(when) = named_condition(raw, system) {
        return LoweredWhen::Known(when);
    }
    if let Some(when) = named_breakpoint(raw, system) {
        return LoweredWhen::Known(when);
    }
    if let Some(when) = breakpoint_range(raw, system) {
        return LoweredWhen::Known(when);
    }
    if let Some(when) = at_rule_or_ampersand(raw) {
        return LoweredWhen::Known(when);
    }
    LoweredWhen::Unknown
}

/// Check if any emitted atoms use @container conditions without a container root defined in globalCss.
pub fn check_container_root(
    system: &BaseSystem,
    atom_set: &crate::atom::AtomSet,
    diagnostics: &mut Vec<crate::diagnostics::Diagnostic>,
    sink: Option<&mut DiagnosticsSession>,
) {
    let has_cq = atom_set.iter().any(|atom| {
        atom.conditions
            .iter()
            .any(|w| matches!(w.wrap(), crate::atom::WhenKind::Container(_)))
    });
    if has_cq && !system.global_css.is_empty() && !has_container_root(system) {
        let report = ResolveReport {
            location: DiagnosticLocation::default(),
            key: None,
            outcome: ResolveOutcome::Advisory {
                code: DiagnosticCode::MissingContainerRoot,
                detail: ResolveDetail::Declaration(DeclarationDetail::ContainerRoot),
            },
        };
        let diagnostic = Policy::render_resolve(&report);
        if let Some(sink) = sink {
            sink.report(DiagnosticFact::from(report));
        }
        diagnostics.push(diagnostic);
    }
}

fn has_container_root(system: &BaseSystem) -> bool {
    system.global_css.iter().any(|frag| {
        frag.rules.iter().any(|(selector, node)| {
            (selector == ":root" || selector == "html" || selector == "body")
                && (node.contains_key("containerType")
                    || node.contains_key("container-type")
                    || node.contains_key("container"))
        })
    })
}

/// `@media` query for a globalCss breakpoint key: plain scale names plus the
/// `*Down` / `*Only` / `*To*` ranges. Bounds come from the `@container`
/// twins below with only the at-rule retargeted, so ranges agree on both
/// paths (utilities print `@container`, global CSS prints `@media`, RS-28).
pub fn breakpoint_media_query(key: &str, system: &BaseSystem) -> Option<String> {
    if key == "base" {
        return None;
    }
    if let Some(width) = system.breakpoints().width_px(key) {
        return Some(format!("@media (min-width: {width}px)"));
    }
    let when = breakpoint_range(key, system)?;
    match when.wrap() {
        crate::atom::WhenKind::Container(query) => Some(query.replacen("@container", "@media", 1)),
        _ => None,
    }
}

fn breakpoint_range(raw: &str, system: &BaseSystem) -> Option<When> {
    if let Some(bp) = raw.strip_suffix("Down") {
        return breakpoint_down(raw, bp, system);
    }
    if let Some(bp) = raw.strip_suffix("Only") {
        return breakpoint_only(raw, bp, system);
    }
    if let Some((from, to)) = raw.split_once("To") {
        return breakpoint_between(raw, from, to, system);
    }
    None
}

fn breakpoint_down(raw: &str, bp: &str, system: &BaseSystem) -> Option<When> {
    let scale = system.breakpoints();
    if bp == "base" || !scale.names().iter().any(|n| n == bp) {
        return None;
    }
    let width_str = scale.width_px(bp)?;
    let width: f64 = width_str.parse().ok()?;
    let max_px = width - 0.02;
    let query = format!("@container (max-width: {max_px:.2}px)");
    Some(When::breakpoint(raw.into(), query.into_boxed_str()))
}

fn breakpoint_only(raw: &str, bp: &str, system: &BaseSystem) -> Option<When> {
    let scale = system.breakpoints();
    if bp == "base" {
        return None;
    }
    let idx = scale.names().iter().position(|n| n == bp)?;
    let min_px = scale.width_px(bp)?;
    if idx + 1 < scale.names().len() {
        let next_bp = &scale.names()[idx + 1];
        let next_px: f64 = scale.width_px(next_bp)?.parse().ok()?;
        let max_px = next_px - 0.02;
        let query = format!("@container (min-width: {min_px}px) and (max-width: {max_px:.2}px)");
        Some(When::breakpoint(raw.into(), query.into_boxed_str()))
    } else {
        let query = format!("@container (min-width: {min_px}px)");
        Some(When::breakpoint(raw.into(), query.into_boxed_str()))
    }
}

fn breakpoint_between(raw: &str, from: &str, to: &str, system: &BaseSystem) -> Option<When> {
    let scale = system.breakpoints();
    if from == "base" || to == "base" {
        return None;
    }
    let from_idx = scale
        .names()
        .iter()
        .position(|n| n.eq_ignore_ascii_case(from))?;
    let to_idx = scale
        .names()
        .iter()
        .position(|n| n.eq_ignore_ascii_case(to))?;
    if from_idx >= to_idx {
        return None;
    }
    let from_name = &scale.names()[from_idx];
    let to_name = &scale.names()[to_idx];
    let min_px = scale.width_px(from_name)?;
    let to_px: f64 = scale.width_px(to_name)?.parse().ok()?;
    let max_px = to_px - 0.02;
    let query = format!("@container (min-width: {min_px}px) and (max-width: {max_px:.2}px)");
    Some(When::breakpoint(raw.into(), query.into_boxed_str()))
}

fn named_condition(raw: &str, system: &BaseSystem) -> Option<When> {
    let preset = named_wrap(raw, system)?;
    Some(When::from_catalog(raw.into(), preset))
}

fn named_breakpoint(raw: &str, system: &BaseSystem) -> Option<When> {
    if !is_named_breakpoint(raw, system) {
        return None;
    }
    match system.breakpoints().width_px(raw) {
        Some(width) => {
            let query = format!("@container (min-width: {width}px)");
            Some(When::breakpoint(raw.into(), query.into_boxed_str()))
        }
        None => Some(When::selector(raw.into(), raw.into(), "&".into())),
    }
}

fn at_rule_or_ampersand(raw: &str) -> Option<When> {
    if raw.starts_with("@media") || raw.starts_with("@container") || raw.starts_with("@supports") {
        // Bare `@supports` carries no query: not a wrap, refuse it (D11).
        if is_bare_query_rule(raw) {
            return None;
        }
        return Some(When::at_rule(raw.into(), bracket_segment(raw)));
    }
    if raw.starts_with('&') || raw.starts_with('@') || pseudoselectors::has_parent_reference(raw) {
        let template = selector_template(raw);
        return Some(When::selector(
            raw.into(),
            bracket_segment(raw),
            template.into_boxed_str(),
        ));
    }
    None
}

fn is_named_breakpoint(raw: &str, system: &BaseSystem) -> bool {
    raw != "base" && system.breakpoints().names().iter().any(|name| name == raw)
}

fn named_wrap<'a>(raw: &'a str, system: &'a BaseSystem) -> Option<&'a str> {
    if let Some(wrap) = system.get_condition(raw) {
        return Some(wrap);
    }
    let key = raw.strip_prefix('_').unwrap_or(raw);
    pseudoprops::preset_wrap(key)
}

/// True when a query-bearing at-rule key carries no query text.
pub fn is_bare_query_rule(raw: &str) -> bool {
    const QUERY_AT_RULES: &[&str] = &["@media", "@supports", "@container"];
    QUERY_AT_RULES.iter().any(|keyword| {
        raw == *keyword
            || raw
                .strip_prefix(keyword)
                .is_some_and(|rest| rest.trim().is_empty())
    })
}

fn bracket_segment(raw: &str) -> Box<str> {
    let sanitized = raw.trim().replace(' ', "_");
    format!("[{sanitized}]").into_boxed_str()
}

fn selector_template(raw: &str) -> String {
    if raw.contains('&') {
        raw.to_string()
    } else {
        format!("&:{raw}")
    }
}

pub use pseudoselectors::nesting::nest as nest_selector_condition;

#[cfg(test)]
mod tests;
