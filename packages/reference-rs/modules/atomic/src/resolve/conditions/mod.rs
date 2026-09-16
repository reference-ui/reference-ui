//! Join point for the `_` catalog and `&` selector application.
//! Lowers an authored `when` string once into `When`, which carries the class
//! segment and the wrap together. Named `_` keys ask `BaseSystem` first; presets
//! remain only for keys the utterance does not list. Named breakpoint tokens
//! lower to `@container (min-width: Npx)` from the scale. Unknown keys return
//! `LoweredWhen::Unknown` so resolve can warn and drop the want.

pub mod pseudoprops;
pub mod pseudoselectors;

use crate::atom::When;
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
) {
    let has_cq = atom_set.iter().any(|atom| {
        atom.conditions
            .iter()
            .any(|w| matches!(w.wrap(), crate::atom::WhenKind::Container(_)))
    });
    if has_cq && !system.global_css.is_empty() && !has_container_root(system) {
        diagnostics.push(crate::diagnostics::Diagnostic::warning(
            "@container condition emitted but no container root (container-type) is defined in globalCss",
        ));
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
    if raw.starts_with("@media") || raw.starts_with("@container") {
        return Some(When::at_rule(raw.into(), bracket_segment(raw)));
    }
    if raw.starts_with('&') || raw.starts_with('@') {
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

pub use pseudoselectors::apply as apply_selector_condition;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::atom::{AtomSet, AtomValue, Want, WhenKind};
    use crate::resolve::{resolve_want_with, ResolveSession};
    use crate::stylesheet;
    use smallvec::smallvec;

    fn known(raw: &str, system: &BaseSystem) -> When {
        match lower_when(raw, system) {
            LoweredWhen::Known(when) => when,
            other => panic!("expected known condition for {raw}, got {other:?}"),
        }
    }

    fn assert_selector(raw: &str, expected: &str, system: &BaseSystem) {
        match known(raw, system).wrap() {
            WhenKind::Selector(s) => assert_eq!(s, expected),
            other => panic!("expected selector for {raw}, got {other:?}"),
        }
    }

    fn assert_container(raw: &str, px: &str, system: &BaseSystem) {
        match known(raw, system).wrap() {
            WhenKind::Container(m) => {
                assert_eq!(m, format!("@container (min-width: {px}px)"))
            }
            other => panic!("expected container query for {raw}, got {other:?}"),
        }
    }

    #[test]
    fn test_lower_named_segments() {
        let empty = BaseSystem::default();
        assert!(matches!(lower_when("base", &empty), LoweredWhen::Skip));
        let hover = known("_hover", &empty);
        assert_eq!(hover.class_segment(), "hover");
        assert_eq!(hover.authored(), "_hover");
        assert!(matches!(lower_when("sm", &empty), LoweredWhen::Unknown));
        let sm = known("sm", BaseSystem::lib_fixture());
        assert_eq!(sm.class_segment(), "sm");
        let slot = known("&[data-slot=inner]", &empty);
        assert_eq!(slot.class_segment(), "[&[data-slot=inner]]");
    }

    #[test]
    fn test_lower_presets() {
        let system = BaseSystem::lib_fixture();
        assert_selector("_hover", "&:is(:hover, [data-hover])", system);
        assert_selector("_dark", "[data-theme=dark] &", system);
        assert_selector(
            "_groupHover",
            "&:is(:where(.group, [data-group]):is(:hover, [data-hover]) *)",
            system,
        );
        assert_selector(
            "_peerFocus",
            "&:is(:where(.peer, [data-peer]):is(:focus, [data-focus]) ~ *)",
            system,
        );
    }

    #[test]
    fn test_named_breakpoint_lowers_to_container() {
        let system = BaseSystem::lib_fixture();
        assert_container("sm", "640", system);
        assert_container("md", "768", system);
        assert_container("lg", "1024", system);
        assert_container("xl", "1280", system);
        assert_container("2xl", "1536", system);
    }

    #[test]
    fn test_container_passthrough() {
        match known("@container (min-width: 640px)", &BaseSystem::default()).wrap() {
            WhenKind::Container(m) => {
                assert_eq!(m, "@container (min-width: 640px)")
            }
            _ => panic!("expected container query"),
        }
    }

    #[test]
    fn unknown_underscore_is_refused() {
        assert!(matches!(
            lower_when("_nope", BaseSystem::lib_fixture()),
            LoweredWhen::Unknown
        ));
        assert!(matches!(
            lower_when("_hovr", BaseSystem::lib_fixture()),
            LoweredWhen::Unknown
        ));
    }

    #[test]
    fn unknown_condition_drops_atom_with_diagnostic() {
        let want = Want::new("color", AtomValue::String("red".into()))
            .with_when(smallvec!["_nope".into()]);
        let mut diagnostics = Vec::new();
        let system = BaseSystem::lib_fixture();
        let mut session = ResolveSession {
            system: &system,
            diagnostics: &mut diagnostics,
        };
        let atoms = resolve_want_with(&want, &mut session);
        assert!(atoms.is_empty());
        assert_eq!(diagnostics.len(), 1);
        assert_eq!(diagnostics[0].message, "Unknown condition \"_nope\"");
    }

    #[test]
    fn unknown_condition_keeps_sibling_and_does_not_wrap_nope() {
        let nope = Want::new("color", AtomValue::String("red".into()))
            .with_when(smallvec!["_nope".into()]);
        let sibling = Want::new("color", AtomValue::String("red".into()));
        let mut diagnostics = Vec::new();
        let system = BaseSystem::lib_fixture();
        let mut session = ResolveSession {
            system: &system,
            diagnostics: &mut diagnostics,
        };
        let mut atoms = resolve_want_with(&nope, &mut session);
        atoms.extend(resolve_want_with(&sibling, &mut session));
        assert_eq!(atoms.len(), 1);
        assert!(atoms[0].conditions().is_empty());
        assert_eq!(atoms[0].value.class_name_str(), "red");
        let css = stylesheet::build_stylesheet(&atoms.into_iter().collect::<AtomSet>(), &system);
        assert!(css.contains(".\\@reference-ui\\/lib__c_red { color: red; }"));
        assert!(!css.contains(":nope"));
        assert!(!css.contains("nope:"));
    }
}
