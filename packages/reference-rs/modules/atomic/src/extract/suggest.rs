//! Did-you-mean suggestions for extract's unknown-name notes.
//!
//! The note site owns no theme, so candidates come from static vocabularies
//! only: unknown props rank against canon names, aliases, and reference
//! props, while unknown `r` keys rank against the breakpoint scale names in
//! reach at every site. The shared suggestion gate decides legitimacy and
//! distance decides nearness, exactly like the resolve-side helpers, but
//! this module shares no code with them: no system ever reaches this far.
//! It also owns the unknown-property sentence and its parser, so proof can
//! read the key back from the note without a second spelling.

use base_system::BreakpointScale;

use crate::diagnostics::DiagnosticCode;

/// One fix line, headed by a did-you-mean line when a candidate sits near.
pub(crate) fn suggestion_lines(suggestion: Option<&str>, fix: String) -> Vec<String> {
    match suggestion {
        Some(candidate) => vec![diagnostics::message::did_you_mean(candidate), fix],
        None => vec![fix],
    }
}

/// Extract's unknown-property sentence for one style-object key.
pub(crate) fn unknown_property_message(key: &str) -> String {
    format!("Unknown style property \"{key}\"")
}

/// The key an [`unknown_property_message`] names, or None for any other
/// sentence (global-CSS lines spell a different one).
pub(crate) fn unknown_property_key(message: &str) -> Option<&str> {
    message
        .strip_prefix("Unknown style property \"")?
        .strip_suffix('"')
}

/// The closest known style prop to a bad name, over canon names, aliases,
/// and reference props. Needs no system: the vocabulary is static.
pub(crate) fn suggest_property(prop: &str) -> Option<&'static str> {
    let mut candidates: Vec<&'static str> = Vec::new();
    candidates.extend(canon::CANONICAL_PROPERTIES.iter().map(|property| property.name));
    candidates.extend(canon::ALIASES.iter().map(|alias| alias.alias));
    candidates.extend(canon::REFERENCE_PROPS.iter().copied());
    diagnostics::message::suggest_for_code(
        DiagnosticCode::UnknownProperty.as_str(),
        prop,
        &candidates,
    )
}

/// The closest scale name to a bad `r` key, over the breakpoint names in
/// reach at the site. Numeric keys never match a name and stay silent.
pub(crate) fn suggest_breakpoint<'s>(name: &str, scale: &'s BreakpointScale) -> Option<&'s str> {
    let candidates: Vec<&str> = scale.names().iter().map(String::as_str).collect();
    diagnostics::message::suggest_for_code(
        DiagnosticCode::UnknownBreakpoint.as_str(),
        name,
        &candidates,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    fn scale() -> BreakpointScale {
        BreakpointScale::from_names(["sm", "md", "lg"])
    }

    #[test]
    fn unknown_property_sentence_round_trips() {
        for key in ["fooOnly", "watDown", "mdToFoo", "a\"b"] {
            assert_eq!(unknown_property_key(&unknown_property_message(key)), Some(key));
        }
        assert_eq!(
            unknown_property_key("Unknown style property in global CSS: \"x\""),
            None
        );
    }

    #[test]
    fn property_suggests_near_canon_names_and_stays_silent_when_far() {
        assert_eq!(suggest_property("colr"), Some("color"));
        assert_eq!(suggest_property("zzz-no-such-prop"), None);
    }

    #[test]
    fn breakpoint_suggests_near_scale_names_and_stays_silent_when_far() {
        let scale = scale();
        assert_eq!(suggest_breakpoint("md2", &scale), Some("md"));
        assert_eq!(suggest_breakpoint("zzz-no-such-breakpoint", &scale), None);
    }

    #[test]
    fn suggestion_lines_head_the_fix_with_did_you_mean() {
        assert_eq!(
            suggestion_lines(Some("md"), "use a breakpoint from the theme".to_string()),
            vec![
                "did you mean `md`?".to_string(),
                "use a breakpoint from the theme".to_string(),
            ]
        );
        assert_eq!(
            suggestion_lines(None, "use a breakpoint from the theme".to_string()),
            vec!["use a breakpoint from the theme".to_string()]
        );
    }
}
