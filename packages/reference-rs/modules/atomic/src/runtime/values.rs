//! Plan-JSON values into resolve inputs, with `$r` fence refusals.
//!
//! Converts authored plan values (scalars, `$token` and `$r` objects) into
//! `AtomValue` for the resolve passes. Numeric `$r` multipliers collapse
//! through the lexical fence; a fenced multiplier refuses with the same
//! resolve-policy line a session refusal renders, since the plan pass carries
//! no sink. Diagnostics dedupe on severity plus message because rebuilt wants
//! carry no source position.

use serde_json::Value;

use crate::atom::AtomValue;
use crate::diagnostics::adapters::resolve::ResolveReport;
use crate::diagnostics::{
    DeclarationDetail, Diagnostic, DiagnosticCode, DiagnosticLocation, Policy, ResolveDetail,
    ResolveOutcome, ValueDetail,
};
use crate::resolve::{authored_key, lexical, WantContext};

/// Where an `$r` multiplier refusal points: the authored declaration plus its stack.
#[derive(Clone, Copy)]
pub(crate) struct RefusalSite<'a> {
    pub(crate) prop: &'a str,
    pub(crate) when: &'a [String],
    pub(crate) important: bool,
    pub(crate) value: &'a Value,
}

/// Sink for `$r` fence refusals: the builder's system name plus diagnostics.
pub(crate) struct RefuseR<'a> {
    pub(crate) system: &'a str,
    pub(crate) diagnostics: &'a mut Vec<Diagnostic>,
}

/// Convert a JSON value into an AtomValue representation for resolve passes.
pub(crate) fn json_to_atom_value(
    val: &Value,
    site: RefusalSite<'_>,
    refuse: &mut RefuseR<'_>,
) -> Option<AtomValue> {
    if let Some(scalar) = scalar_to_atom_value(val) {
        return Some(scalar);
    }
    if let Some(map) = val.as_object() {
        if map.contains_key("$token") {
            return t_object_to_atom_value(map);
        }
        return r_object_to_atom_value(map, site, refuse);
    }
    None
}

/// A `$token` plan object back to its path-plus-fallback value, or None when
/// the shape is not exactly `{"$token": {"path": str, "value": str}}`.
fn t_object_to_atom_value(map: &serde_json::Map<String, Value>) -> Option<AtomValue> {
    let inner = map.get("$token")?.as_object()?;
    let path = inner.get("path")?.as_str()?;
    let value = inner.get("value")?.as_str()?;
    Some(AtomValue::Token {
        path: path.into(),
        value: value.into(),
    })
}

/// An `$r` plan object back to its multiplier string, or None when the key is
/// missing or the fence refuses the multiplier.
fn r_object_to_atom_value(
    map: &serde_json::Map<String, Value>,
    site: RefusalSite<'_>,
    refuse: &mut RefuseR<'_>,
) -> Option<AtomValue> {
    let r_val = map.get("$r")?;
    if let Some(f) = r_val.as_f64() {
        let Some(multiplier) = lexical::collapse_r_number(f) else {
            refuse_r_multiplier(site, &r_val.to_string(), refuse);
            return None;
        };
        return Some(AtomValue::String(format!("{multiplier}r").into_boxed_str()));
    }
    let rendered = r_val.to_string();
    Some(AtomValue::String(format!("{rendered}r").into_boxed_str()))
}

/// Refuse an `$r` multiplier outside the canonical magnitude, naming the
/// authored declaration. Renders through resolve policy so the line matches
/// a session refusal byte for byte; the plan pass carries no sink.
fn refuse_r_multiplier(site: RefusalSite<'_>, spelling: &str, refuse: &mut RefuseR<'_>) {
    let when: smallvec::SmallVec<[Box<str>; 2]> = site
        .when
        .iter()
        .map(|w| w.clone().into_boxed_str())
        .collect();
    let context = WantContext {
        when: when.as_slice(),
        important: site.important,
    };
    let report = ResolveReport {
        location: DiagnosticLocation::default(),
        key: Some(authored_key(
            refuse.system,
            site.prop,
            site.value.clone(),
            &context,
        )),
        outcome: ResolveOutcome::Rejected {
            code: DiagnosticCode::NonCanonicalNumeric,
            detail: ResolveDetail::Declaration(DeclarationDetail::Value(
                ValueDetail::NonCanonicalNumber {
                    prop: site.prop.into(),
                    spelling: spelling.into(),
                },
            )),
        },
    };
    let diagnostic = Policy::render_resolve(&report);
    if !is_duplicate(refuse.diagnostics, &diagnostic) {
        refuse.diagnostics.push(diagnostic);
    }
}

fn scalar_to_atom_value(val: &Value) -> Option<AtomValue> {
    if let Some(s) = val.as_str() {
        return Some(AtomValue::String(s.into()));
    }
    if let Some(b) = val.as_bool() {
        return Some(AtomValue::Bool(b));
    }
    if val.is_null() {
        return Some(AtomValue::Null);
    }
    if let Some(n) = val.as_number() {
        return Some(AtomValue::Number(n.to_string().into_boxed_str()));
    }
    None
}

/// True when a diagnostic with the same severity and message is already recorded.
/// Rebuilt wants carry no source position, so the re-resolve pass must dedup
/// on text rather than on full location equality.
pub(crate) fn is_duplicate(diagnostics: &[Diagnostic], candidate: &Diagnostic) -> bool {
    diagnostics.iter().any(|existing| {
        existing.severity == candidate.severity && existing.message == candidate.message
    })
}
