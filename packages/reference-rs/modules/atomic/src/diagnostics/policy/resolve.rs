//! Resolve outcome wording: one sentence template per refusal shape.
//!
//! Templates are byte-identical to the legacy resolve call-site strings
//! they replace. The `InvalidCssValue` arm matches on (code, value) by
//! construction: Bool `true` drops are userspace-provable, Bool `false`
//! drops can never be userspace — the audience
//! split hangs on this same match. Disposition (rejected vs passthrough) never
//! changes a sentence; it travels in the fact for proof.

use super::super::adapters::resolve::ResolveReport;
use super::super::{
    DeclarationDetail, Diagnostic, NameDetail, ResolveDetail, ResolveOutcome, TokenDetail,
    ValueDetail,
};

/// Render one resolve outcome report to its final warning line.
pub fn render(report: &ResolveReport) -> Diagnostic {
    let (code, detail) = match &report.outcome {
        ResolveOutcome::Rejected { code, detail }
        | ResolveOutcome::Passthrough { code, detail }
        | ResolveOutcome::Advisory { code, detail } => (code, detail),
    };
    let message = match detail {
        ResolveDetail::Declaration(declaration) => declaration_sentence(declaration),
        ResolveDetail::Token(token) => token_sentence(token),
    };
    let line = report.location.warning(*code, message);
    let help = help_lines(report.suggestion.as_deref(), detail);
    super::Policy::attach_help(line, help)
}

/// The instance help for one refusal: unknown names head their fix line
/// with the precomputed did-you-mean, every other shape echoes its parts.
/// The container-root advisory stays silent — static wins with no parts.
fn help_lines(suggestion: Option<&str>, detail: &ResolveDetail) -> Vec<String> {
    match detail {
        ResolveDetail::Declaration(declaration) => declaration_help(suggestion, declaration),
        ResolveDetail::Token(token) => token_help(suggestion, token),
    }
}

/// The help for one declaration-shape refusal.
fn declaration_help(suggestion: Option<&str>, detail: &DeclarationDetail) -> Vec<String> {
    match detail {
        DeclarationDetail::Name(name) => name_help(suggestion, name),
        DeclarationDetail::Value(value) => value_help(value),
        DeclarationDetail::ContainerRoot => Vec::new(),
    }
}

/// The help for one unknown-name refusal: the fix headed by did-you-mean.
fn name_help(suggestion: Option<&str>, name: &NameDetail) -> Vec<String> {
    match name {
        NameDetail::Property { prop } => crate::resolve::suggest::suggestion_lines(
            suggestion,
            format!("remove '{prop}' or check its spelling"),
        ),
        NameDetail::Condition { .. } => crate::resolve::suggest::suggestion_lines(
            suggestion,
            "use a condition from the theme".to_string(),
        ),
        NameDetail::UnrealizableExtension { prop } => {
            vec![format!("drop '{prop}'; the dialect has no served css form")]
        }
    }
}

/// The help for one value-shape refusal: the spelling echoed with its fix.
fn value_help(value: &ValueDetail) -> Vec<String> {
    match value {
        ValueDetail::NonCanonicalNumber { prop, spelling } => {
            vec![format!("write '{spelling}' as a plain decimal on '{prop}'")]
        }
        ValueDetail::EmptyString { prop } => {
            vec![format!("remove the empty value on '{prop}'")]
        }
        ValueDetail::InvalidValue { prop, value } => {
            vec![format!(
                "'{prop}' rejects '{value}'; use a CSS keyword, token, or accepted value"
            )]
        }
    }
}

/// The help for one token-shape refusal: the spelling echoed with its fix.
fn token_help(suggestion: Option<&str>, detail: &TokenDetail) -> Vec<String> {
    match detail {
        TokenDetail::MalformedOpacity { text } => {
            vec![format!(
                "write the opacity modifier as /<0-100> (got '{text}')"
            )]
        }
        TokenDetail::UnterminatedBrace { value } => {
            vec![format!("close the '{{' in '{value}'")]
        }
        TokenDetail::UnknownToken { category, .. } => {
            vec![format!(
                "use a {} token or a CSS value",
                category_noun(category)
            )]
        }
        TokenDetail::UnknownTokenPath { .. }
        | TokenDetail::UnknownColor { .. }
        | TokenDetail::UnknownTone { .. } => {
            crate::resolve::suggest::suggestion_lines(suggestion, lookup_fix(detail))
        }
    }
}

/// The fix line for a lookup refusal. `token_help` routes only the three lookup
/// variants here, so the spelling variants are unreachable by construction.
fn lookup_fix(detail: &TokenDetail) -> String {
    match detail {
        TokenDetail::UnknownColor { .. } => "use a color token or CSS color".to_string(),
        TokenDetail::UnknownTone { tone, .. } => tone_fix(tone),
        TokenDetail::UnknownTokenPath { .. } => "point the path at an existing token".to_string(),
        TokenDetail::MalformedOpacity { .. }
        | TokenDetail::UnterminatedBrace { .. }
        | TokenDetail::UnknownToken { .. } => {
            unreachable!("token_help routes only lookup faults to lookup_fix")
        }
    }
}

/// The fix line for an unknown tone: how to declare it, with the percentage
/// shape spelled out, plus the numeric-opacity escape hatch.
fn tone_fix(tone: &str) -> String {
    format!(
        "declare it with tokens({{ tones: {{ {tone}: {{ surface: {{ value: '10%' }}, line: {{ value: '34%' }} }} }} }}) — tone values are percentages — or use /<0-100>"
    )
}

/// The noun a token category reads as in prose: `radii` is a radius, `sizes`
/// a size, and `fontSizes` a font-size. Other categories read as themselves.
fn category_noun(category: &str) -> &str {
    match category {
        "radii" => "radius",
        "sizes" => "size",
        "fontSizes" => "font-size",
        other => other,
    }
}

/// The sentence for one declaration-shape refusal.
fn declaration_sentence(detail: &DeclarationDetail) -> String {
    match detail {
        DeclarationDetail::Name(name) => name_sentence(name),
        DeclarationDetail::Value(value) => value_sentence(value),
        DeclarationDetail::ContainerRoot => "@container condition emitted but no container root \
         (container-type) is defined in globalCss"
            .to_string(),
    }
}

/// The sentence for one unknown-name refusal.
fn name_sentence(name: &NameDetail) -> String {
    match name {
        NameDetail::Property { prop } => {
            format!("Unknown style property \"{prop}\"")
        }
        NameDetail::Condition { name } => {
            format!("Unknown condition \"{name}\"")
        }
        NameDetail::UnrealizableExtension { prop } => {
            format!("`{prop}` has no CSS lowering; the declaration was dropped")
        }
    }
}

/// The sentence for one value-shape refusal.
fn value_sentence(value: &ValueDetail) -> String {
    match value {
        ValueDetail::NonCanonicalNumber { prop, spelling } => {
            format!("Non-canonical numeric value \"{spelling}\" on `{prop}`")
        }
        ValueDetail::EmptyString { prop } => {
            format!("Empty string value on `{prop}`")
        }
        // The (code, value) split hangs here — `true` is
        // userspace-provable (runtime queries it, resolve drops it), `false`
        // never userspace (runtime skips holes without querying).
        ValueDetail::InvalidValue { prop, value } => {
            format!("`{prop}` value `{value}` is not valid CSS")
        }
    }
}

/// The sentence for one token-shape refusal.
fn token_sentence(detail: &TokenDetail) -> String {
    match detail {
        TokenDetail::MalformedOpacity { text } => {
            format!("malformed opacity modifier `{text}`")
        }
        TokenDetail::UnterminatedBrace { value } => {
            format!("unterminated `{{` in value `{value}`")
        }
        TokenDetail::UnknownToken { text, category } => {
            format!("`{text}` is not a {} token", category_noun(category))
        }
        TokenDetail::UnknownTokenPath { .. }
        | TokenDetail::UnknownColor { .. }
        | TokenDetail::UnknownTone { .. } => lookup_sentence(detail),
    }
}

/// The sentence for a lookup that named no token. `token_sentence` routes only the
/// three lookup variants here, so the spelling variants are unreachable by construction.
fn lookup_sentence(detail: &TokenDetail) -> String {
    match detail {
        TokenDetail::UnknownColor { text } => {
            format!("`{text}` is neither a color token nor a CSS color")
        }
        TokenDetail::UnknownTone { text, tone } => {
            format!("unknown tone `{tone}` in `{text}`")
        }
        TokenDetail::UnknownTokenPath { path } => {
            format!("unknown token path `{path}`")
        }
        TokenDetail::MalformedOpacity { .. }
        | TokenDetail::UnterminatedBrace { .. }
        | TokenDetail::UnknownToken { .. } => {
            unreachable!("token_sentence routes only lookup faults to lookup_sentence")
        }
    }
}

#[cfg(test)]
mod tests;
