//! Message-pattern helpers for the rich-text canvas: conventions with code behind them, not law with a gate.
//! The transport only demands a non-empty message, so producers own presentation; these helpers capture what "good"
//! looks like (subject-first one-liners, backticked subjects, `hint:` guidance, `→` suggestions) plus worked examples.
//! Nothing validates style at the boundary — the pattern spreads because the helpers are easier than raw strings.
//!
//! The pattern in three lines: line one names the subject in backticks and says what happened; later lines suggest
//! (`did you mean ...?`, `→`) or guide (`hint: ...`); unicode, emoji, and newlines are allowed but the subject stays
//! greppable. The js mirror implements the same helpers so both sides of napi render identical text.

/// Wrap a code subject (token path, prop, file) in backticks: `` `colors.navy` ``.
pub fn inline_code(value: &str) -> String {
    format!("`{value}`")
}

/// Append producer guidance as a trailing line: `hint: token paths are dotted pairs`.
pub fn hint(text: &str) -> String {
    format!("hint: {text}")
}

/// Suggest the closest known name: `` did you mean `colors.navy-500`? ``.
pub fn did_you_mean(known: &str) -> String {
    format!("did you mean `{known}`?")
}

/// Join message lines with newlines; line one stays the complete subject.
pub fn join_lines(lines: &[&str]) -> String {
    lines.join("\n")
}

/// Codes whose failure is an unknown name drawn from a finite known set: the only
/// codes [`suggest_for_code`] will suggest for. Unknown properties, breakpoints,
/// conditions, token paths, colors, and token categories all have an enumerable
/// vocabulary to rank against; opaque names (retention tokens) and every other
/// failure class stay silent even when a candidate looks near. New unknown-X
/// codes join this list in a reviewed change with their registry row, never by
/// reaching past the gate to [`suggest`].
pub const SUGGESTION_CODES: &[&str] = &[
    "ATM-W-UNKNOWN-PROPERTY",
    "ATM-W-UNKNOWN-BREAKPOINT",
    "ATM-W-UNKNOWN-CONDITION",
    "ATM-W-UNKNOWN-TOKEN-PATH",
    "ATM-W-UNKNOWN-COLOR",
    "ATM-E-UNKNOWN-TOKEN",
    "TGN-W-UNKNOWN-TOKEN-CATEGORY",
    "TGN-W-UNKNOWN-STRICT-CATEGORY",
];

/// Whether `code` may carry a did-you-mean suggestion: membership in [`SUGGESTION_CODES`].
pub fn supports_suggestions(code: &str) -> bool {
    SUGGESTION_CODES.contains(&code)
}

/// Pick the closest candidate to an unknown name, or nothing when all are far off.
/// Near matches (within a third of the name, minimum three edits) suggest; distant ones stay silent.
pub fn suggest<'candidates>(
    unknown: &str,
    candidates: &[&'candidates str],
) -> Option<&'candidates str> {
    const MIN_BUDGET: usize = 3;
    let budget = MIN_BUDGET.max(unknown.chars().count() / 3);
    let mut best: Option<(&'candidates str, usize)> = None;
    for candidate in candidates {
        let distance = edit_distance(unknown, candidate);
        let closer = best.is_none_or(|(_, known)| distance < known);
        if closer {
            best = Some((candidate, distance));
        }
    }
    best.filter(|(_, distance)| *distance <= budget)
        .map(|(candidate, _)| candidate)
}

/// Pick the closest candidate for one diagnostic code, or nothing when the code
/// is not a suggestion code or all candidates are far off. Modules wire their
/// own known sets as `candidates`; the gate decides whether suggesting is
/// legitimate, the distance decides whether any candidate is near enough.
pub fn suggest_for_code<'candidates>(
    code: &str,
    unknown: &str,
    candidates: &[&'candidates str],
) -> Option<&'candidates str> {
    if supports_suggestions(code) {
        suggest(unknown, candidates)
    } else {
        None
    }
}

/// Iterative edit distance over characters; two rows, no allocation beyond them.
fn edit_distance(first: &str, second: &str) -> usize {
    let left: Vec<char> = first.chars().collect();
    let right: Vec<char> = second.chars().collect();
    let mut prev: Vec<usize> = (0..=right.len()).collect();
    for (row, a) in left.iter().enumerate() {
        let mut current = vec![row + 1; right.len() + 1];
        for (col, b) in right.iter().enumerate() {
            let deletion = prev[col + 1] + 1;
            let insertion = current[col] + 1;
            let substitution = prev[col] + usize::from(a != b);
            current[col + 1] = deletion.min(insertion).min(substitution);
        }
        prev = current;
    }
    prev[right.len()]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn helpers_render_the_micro_syntax() {
        assert_eq!(inline_code("color"), "`color`");
        assert_eq!(hint("use a token"), "hint: use a token");
        assert_eq!(did_you_mean("colors.navy"), "did you mean `colors.navy`?");
        assert_eq!(join_lines(&["one", "two"]), "one\ntwo");
    }

    #[test]
    fn suggest_picks_near_names_and_stays_silent_when_far() {
        assert_eq!(suggest("colr", &["color", "margin"]), Some("color"));
        assert_eq!(suggest("color", &["color", "margin"]), Some("color"));
        assert_eq!(suggest("zzz", &["color", "margin"]), None);
        assert_eq!(suggest("colors.nope", &["colors.nope-500"]), None);
        assert_eq!(suggest("colr", &[]), None);
    }

    #[test]
    fn gated_suggest_fires_only_for_suggestion_codes() {
        let near = "colr";
        let candidates = &["color", "margin"];
        assert_eq!(
            suggest_for_code("ATM-W-UNKNOWN-PROPERTY", near, candidates),
            Some("color")
        );
        assert_eq!(
            suggest_for_code("TGN-W-UNKNOWN-STRICT-CATEGORY", "colour", &["colors"]),
            Some("colors")
        );
        for silent in [
            "ATM-E-UNKNOWN-RETENTION-TOKEN",
            "ATM-E-PARSE",
            "TST-W-PARSE-ERROR",
            "not-a-code",
        ] {
            assert_eq!(suggest_for_code(silent, near, candidates), None);
        }
        assert_eq!(
            suggest_for_code("ATM-W-UNKNOWN-PROPERTY", "zzz", candidates),
            None
        );
        assert!(!supports_suggestions("ATM-W-DYNAMIC-EXPRESSION"));
        assert!(supports_suggestions("ATM-E-UNKNOWN-TOKEN"));
    }

    #[test]
    fn suggestion_codes_are_registered_and_stable() {
        use crate::code::DiagnosticCode;
        assert_eq!(SUGGESTION_CODES.len(), 8);
        for code in SUGGESTION_CODES {
            let parsed = DiagnosticCode::parse(code).unwrap();
            assert!(parsed.is_registered_namespace());
        }
    }

    /// Worked example: an unknown token path with a suggestion and guidance.
    #[test]
    fn example_unknown_token_with_suggestion() {
        let unknown = "colors.navvy-500";
        let known = suggest(unknown, &["colors.navy-500", "colors.nope-500", "space.4"]);
        let subject = format!(
            "unknown token path {} for prop {}",
            inline_code(unknown),
            inline_code("color")
        );
        let message = match known {
            Some(name) => join_lines(&[
                &subject,
                &format!(
                    "{} · {}",
                    did_you_mean(name),
                    hint("token paths are dotted category/name pairs")
                ),
            ]),
            None => subject,
        };
        assert_eq!(
            message,
            "unknown token path `colors.navvy-500` for prop `color`\n\
             did you mean `colors.navy-500`? · hint: token paths are dotted category/name pairs"
        );
    }

    /// Worked example: a refused responsive leaf, multi-line with a source snippet.
    #[test]
    fn example_refused_leaf_with_snippet() {
        let message = join_lines(&[
            &format!(
                "refused `!` on responsive leaf {} in {}",
                inline_code("padding.md"),
                inline_code("app/Card.tsx")
            ),
            "  padding: { _: 2, md: \"4 !\" }",
            "                          ↑ important rides the whole object, never one leaf",
            &hint("hoist `!` to the prop or split the breakpoint into its own element"),
        ]);
        let expected = "refused `!` on responsive leaf `padding.md` in `app/Card.tsx`\n  padding: { _: 2, md: \"4 !\" }\n                          ↑ important rides the whole object, never one leaf\nhint: hoist `!` to the prop or split the breakpoint into its own element";
        assert_eq!(message, expected);
    }

    /// Worked example: a minimal one-liner for request-level failures with no source position.
    #[test]
    fn example_minimal_request_error() {
        let message = format!(
            "scan refused: {} and {} are mutually exclusive",
            inline_code("files"),
            inline_code("retentionToken")
        );
        assert_eq!(
            message,
            "scan refused: `files` and `retentionToken` are mutually exclusive"
        );
    }
}
