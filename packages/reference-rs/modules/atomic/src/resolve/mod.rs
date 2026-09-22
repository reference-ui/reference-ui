//! Orchestration pipeline for transforming raw styling wants into fully resolved atomic utilities.
//! Coordinates dialect utilities (`font`, `weight`, `container`, `size`, `r`), shorthand expansion, rhythm, and tokens.
//! Font tracking, named weights, and token lookup come from `BaseSystem`, not a second preset table here.
//! Refusals report typed resolve facts through the session sink and render byte-identical lines via policy.
//! Dialect extensions with no CSS realization refuse at the expansion fall-through (warn-and-skip, default-visible).

pub mod conditions;
pub mod container;
pub mod font;
pub mod gradient;
pub mod lexical;
pub mod normalize;
pub mod r;
pub mod rhythm;
pub mod shorthands;
pub mod size;
pub mod tokens;
pub mod unit;

use base_system::BaseSystem;
use smallvec::SmallVec;

use crate::atom::{Atom, AtomValue, CssValue, Want, When};
use crate::diagnostics::adapters::resolve::ResolveReport;
use crate::diagnostics::{
    DeclarationDetail, Diagnostic, DiagnosticCode, DiagnosticFact, DiagnosticLocation,
    DiagnosticSink, DiagnosticsSession, NameDetail, OwnedLookupKey, Policy, ResolveDetail,
    ResolveOutcome,
};
use crate::resolve::conditions::{lower_when, LoweredWhen};

/// Pass state for one want → atom lowering.
pub struct ResolveSession<'a> {
    pub system: &'a BaseSystem,
    pub diagnostics: &'a mut Vec<Diagnostic>,
    pub location: DiagnosticLocation,
    pub sink: Option<&'a mut DiagnosticsSession>,
    pub want: Option<WantContext>,
}

/// The authored want behind the current lowering: condition stack and
/// importance, carried so refusals can name the exact runtime lookup key.
pub struct WantContext {
    pub when: SmallVec<[Box<str>; 2]>,
    pub important: bool,
}

impl<'a> ResolveSession<'a> {
    /// Report one typed resolve outcome and push its rendered line. The fact
    /// lands in the session sink when one is wired; the line always lands.
    pub fn emit(&mut self, key: Option<OwnedLookupKey>, outcome: ResolveOutcome) {
        let report = ResolveReport {
            location: self.location.clone(),
            key,
            outcome,
        };
        let diagnostic = Policy::render_resolve(&report);
        if let Some(sink) = self.sink.as_deref_mut() {
            sink.report(DiagnosticFact::from(report));
        }
        self.diagnostics.push(diagnostic);
    }
}

/// Build the exact runtime lookup key for one authored declaration: the
/// site's prop and JSON value over the want's condition stack and importance.
pub fn authored_key(
    system: &str,
    prop: &str,
    value: serde_json::Value,
    want: &WantContext,
) -> OwnedLookupKey {
    OwnedLookupKey {
        system: system.into(),
        when: want.when.to_vec(),
        prop: prop.into(),
        value,
        important: want.important,
    }
}

/// The exact key for the current want when a want context is in hand.
pub(crate) fn want_key(
    session: &ResolveSession<'_>,
    prop: &str,
    value: serde_json::Value,
) -> Option<OwnedLookupKey> {
    session
        .want
        .as_ref()
        .map(|want| authored_key(&session.system.name, prop, value, want))
}

/// One authored value back to its JSON plan shape: strings and numbers keep
/// their spellings, tokens rebuild the `{"$token": …}` object the plan holds.
fn atom_value_to_json(value: &AtomValue) -> serde_json::Value {
    match value {
        AtomValue::String(s) => serde_json::Value::String(s.to_string()),
        AtomValue::Number(n) => serde_json::Value::String(n.to_string()),
        AtomValue::Bool(b) => serde_json::Value::Bool(*b),
        AtomValue::Null => serde_json::Value::Null,
        AtomValue::Token { path, value } => {
            let path: &str = path;
            let value: &str = value;
            serde_json::json!({
                "$token": { "path": path, "value": value }
            })
        }
    }
}

/// Resolve a raw styling want into one or more canonical atomic declarations.
pub fn resolve_want(want: &Want) -> Vec<Atom> {
    let mut diagnostics = Vec::new();
    let system = BaseSystem::default();
    let mut session = ResolveSession {
        system: &system,
        diagnostics: &mut diagnostics,
        location: DiagnosticLocation::default(),
        sink: None,
        want: None,
    };
    resolve_want_with(want, &mut session)
}

/// Resolve a want against an ingested base system.
pub fn resolve_want_with(want: &Want, session: &mut ResolveSession<'_>) -> Vec<Atom> {
    session.location = want.location();
    session.want = Some(WantContext {
        when: want.when.clone(),
        important: want.important,
    });
    if !canon::is_known_style_prop(&want.prop) {
        let key_for_want = want_key(session, &want.prop, atom_value_to_json(&want.value));
        session.emit(
            key_for_want,
            ResolveOutcome::Rejected {
                code: DiagnosticCode::UnknownProperty,
                detail: ResolveDetail::Declaration(DeclarationDetail::Name(NameDetail::Property {
                    prop: want.prop.clone(),
                })),
            },
        );
        return Vec::new();
    }
    let Some(clean_when) = lower_conditions(want, session) else {
        return Vec::new();
    };
    let pairs = expand_or_passthrough(want, session);

    push_resolved_atoms(pairs, clean_when, want.important, session)
}

/// Push one atom per successful pair. The first success moves the lowered
/// conditions; later ones clone the first atom's identical copy, saving
/// one condition clone per want over cloning into every atom.
fn push_resolved_atoms(
    pairs: Vec<(Box<str>, AtomValue)>,
    clean_when: SmallVec<[When; 2]>,
    important: bool,
    session: &mut ResolveSession<'_>,
) -> Vec<Atom> {
    let mut atoms: Vec<Atom> = Vec::with_capacity(pairs.len());
    let mut carried = Some(clean_when);
    for (prop, val) in pairs {
        if let Some(final_val) = resolve_atom_value(&prop, val, session) {
            let when = match carried.take() {
                Some(w) => w,
                None => atoms[0].conditions.clone(),
            };
            atoms.push(Atom::new(prop, final_val, when, important));
        }
    }
    atoms
}

fn expand_or_passthrough(
    want: &Want,
    session: &mut ResolveSession<'_>,
) -> Vec<(Box<str>, AtomValue)> {
    if let Some(expanded) = lower_macro(want, session.system) {
        return expanded;
    }
    if let Some(expanded) = shorthands::expand_shorthand(&want.prop, &want.value) {
        return expanded;
    }
    if refuse_unrealizable_extension(want, session) {
        return Vec::new();
    }
    vec![(want.prop.clone(), want.value.clone())]
}

/// Refuse a dialect extension with no CSS realization: default-visible
/// diagnostic naming the prop, no atoms. True when the prop refused.
fn refuse_unrealizable_extension(want: &Want, session: &mut ResolveSession<'_>) -> bool {
    let canonical = canon::resolve_canonical_prop(&want.prop);
    if !canon::is_unrealizable_extension(canonical) {
        return false;
    }
    session.emit(
        want_key(session, &want.prop, atom_value_to_json(&want.value)),
        ResolveOutcome::Rejected {
            code: DiagnosticCode::UnrealizableExtension,
            detail: ResolveDetail::Declaration(DeclarationDetail::Name(
                NameDetail::UnrealizableExtension {
                    prop: want.prop.clone(),
                },
            )),
        },
    );
    true
}

/// Props and values the `border: true` macro stamps, in emit order.
pub(crate) const BORDER_TRUE_MACRO: [(&str, &str); 2] =
    [("borderWidth", "1px"), ("borderStyle", "solid")];

fn lower_macro(want: &Want, system: &BaseSystem) -> Option<Vec<(Box<str>, AtomValue)>> {
    let prop = want.prop.as_ref();
    if is_runtime_owned(prop) {
        return Some(Vec::new());
    }
    let fonts = system.fonts();
    if prop == "font" {
        return Some(font::lower_font(want.value.class_name_str(), fonts));
    }
    if prop == "weight" {
        return Some(font::lower_weight(want.value.class_name_str(), fonts));
    }
    if prop == "container" {
        return Some(container::lower(want));
    }
    if prop == "size" {
        return Some(size::lower(want));
    }
    if prop == "textGradient" {
        return Some(gradient::lower(want));
    }
    if prop == "border" && matches!(want.value, AtomValue::Bool(true)) {
        // <Div border /> → border-width: 1px; border-style: solid.
        return Some(
            BORDER_TRUE_MACRO
                .iter()
                .map(|(prop, value)| ((*prop).into(), AtomValue::String((*value).into())))
                .collect(),
        );
    }
    None
}

/// Props the runtime owns: any value lowers to zero declarations.
pub(crate) const RUNTIME_OWNED_PROPS: &[&str] = &["variant", "colorMode"];

fn is_runtime_owned(prop: &str) -> bool {
    RUNTIME_OWNED_PROPS.contains(&prop)
}

fn lower_conditions(want: &Want, session: &mut ResolveSession<'_>) -> Option<SmallVec<[When; 2]>> {
    let mut out = SmallVec::new();
    let mut known = true;
    for raw in want.when.iter() {
        match lower_when(raw, session.system) {
            LoweredWhen::Skip => {}
            LoweredWhen::Known(cond) => out.push(cond),
            LoweredWhen::Unknown => {
                let key = want_key(session, &want.prop, atom_value_to_json(&want.value));
                session.emit(
                    key,
                    ResolveOutcome::Rejected {
                        code: DiagnosticCode::UnknownCondition,
                        detail: ResolveDetail::Declaration(DeclarationDetail::Name(
                            NameDetail::Condition {
                                name: (*raw).clone(),
                            },
                        )),
                    },
                );
                known = false;
            }
        }
    }
    if known {
        Some(out)
    } else {
        None
    }
}

fn resolve_atom_value(
    prop: &str,
    val: AtomValue,
    session: &mut ResolveSession<'_>,
) -> Option<CssValue> {
    let css = unit::css_value_from_authored(prop, val, session)?;
    apply_rhythm_and_tokens(prop, css, session)
}

fn apply_rhythm_and_tokens(
    prop: &str,
    css: CssValue,
    session: &mut ResolveSession<'_>,
) -> Option<CssValue> {
    let val_str = css.class_name_str();
    let rhythm_resolved = rhythm::resolve_rhythm(val_str);
    let token_resolved = tokens::resolve_token_value(prop, &rhythm_resolved, session)?;

    if token_resolved != val_str {
        Some(CssValue::Token {
            path: val_str.into(),
            value: token_resolved.into_owned().into_boxed_str(),
        })
    } else {
        Some(css)
    }
}

#[cfg(test)]
mod tests;
