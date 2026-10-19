//! `@layer tokens` emission: token values become custom properties under the selectors `TokenScope` picks.
//! Each value lowers through the shared brace pass for `{refs}` and the rhythm chain for `r` units; genuine CSS prints verbatim.
//! The dark block prints only when some token carries a dark override, and a rhythm-root self-reference diagnoses and omits its declaration.

use base_system::{BaseSystem, TokenEntry};

use super::scope::token_selectors;
use super::TokenScope;
use crate::diagnostics::{DiagnosticCode, DiagnosticLocation};
use crate::resolve::rhythm::resolve_rhythm;
use crate::resolve::tokens::{expand_brace_segments, BraceExpansion};
use crate::resolve::ResolveSession;

#[derive(Clone, Copy)]
enum TokenMode {
    Light,
    Dark,
}

fn has_dark_overrides(system: &BaseSystem) -> bool {
    system
        .tokens
        .iter()
        .any(|(_, entry)| entry.dark().is_some())
}

/// The custom property the `r` unit lowers against. A token owning this slot
/// must never carry a rhythm value: resolving it would reference itself.
const SPACING_ROOT_VAR: &str = "--spacing-root";

/// Append `@layer tokens {…}`; the `scope` picks the selectors (see `TokenScope`).
/// Rhythm-root cycles diagnose into `diagnostics` and omit the declaration.
pub fn append_tokens(
    out: &mut String,
    system: &BaseSystem,
    scope: TokenScope<'_>,
    diagnostics: &mut Vec<crate::diagnostics::Diagnostic>,
) {
    if system.tokens.is_empty() {
        return;
    }
    out.push_str("@layer tokens {\n");
    let (light_sel, dark_sel) = token_selectors(scope, &system.name);
    write_token_block(
        out,
        &light_sel,
        TokenPass {
            system,
            mode: TokenMode::Light,
        },
        diagnostics,
    );
    if has_dark_overrides(system) {
        write_token_block(
            out,
            &dark_sel,
            TokenPass {
                system,
                mode: TokenMode::Dark,
            },
            diagnostics,
        );
    }
    out.push_str("}\n");
}

/// The system whose tokens print, and the light or dark mode the block reads.
#[derive(Clone, Copy)]
struct TokenPass<'a> {
    system: &'a BaseSystem,
    mode: TokenMode,
}

fn write_token_block(
    out: &mut String,
    selector: &str,
    pass: TokenPass<'_>,
    diagnostics: &mut Vec<crate::diagnostics::Diagnostic>,
) {
    out.push_str("  ");
    out.push_str(selector);
    out.push_str(" {\n");
    for (_, entry) in pass.system.tokens.iter() {
        write_token_entry(out, entry, pass, diagnostics);
    }
    out.push_str("  }\n");
}

fn write_token_entry(
    out: &mut String,
    entry: &TokenEntry,
    pass: TokenPass<'_>,
    diagnostics: &mut Vec<crate::diagnostics::Diagnostic>,
) {
    let system = pass.system;
    let raw = match pass.mode {
        TokenMode::Light => entry.light(),
        TokenMode::Dark => match entry.dark() {
            Some(dark) => dark,
            None => return,
        },
    };
    let Some(value) = css_token_value(raw, system, entry, diagnostics) else {
        return;
    };
    out.push_str("    ");
    out.push_str(entry.css_var());
    out.push_str(": ");
    out.push_str(&value);
    out.push_str(";\n");
}

/// Lower one token value: `{brace}` refs expand through the shared brace pass,
/// `r` values through the shared rhythm chain; genuine CSS prints verbatim.
/// Unknown refs print verbatim with an error. `None` — with an error — only
/// when the rhythm root itself carries a rhythm value (self-reference).
fn css_token_value(
    raw: &str,
    system: &BaseSystem,
    entry: &TokenEntry,
    diagnostics: &mut Vec<crate::diagnostics::Diagnostic>,
) -> Option<String> {
    let trimmed = raw.trim();
    warn_unbraced_token_ref(trimmed, system, entry, diagnostics);
    let owner_var = entry.css_var();
    let braced = expand_token_refs(trimmed, owner_var, system, diagnostics);
    let resolved = resolve_rhythm(&braced);
    if resolved.as_ref() == braced {
        return Some(braced);
    }
    if owner_var == SPACING_ROOT_VAR {
        diagnostics.push(DiagnosticLocation::default().error(
            DiagnosticCode::RhythmRootCycle,
            format!(
                "token `{owner_var}` defines the rhythm root in rhythm units (`{trimmed}`); self-reference refused, declaration omitted"
            ),
        ));
        return None;
    }
    Some(resolved.into_owned())
}

/// Warn when a whole brace-free value names another token: `gray.900` on
/// `colors.accent` is meant as `{colors.gray.900}`, and printed verbatim it is
/// invalid CSS. Complete CSS (`white`, `1px`) is never a token reference, and
/// the value still prints as written.
fn warn_unbraced_token_ref(
    trimmed: &str,
    system: &BaseSystem,
    entry: &TokenEntry,
    diagnostics: &mut Vec<crate::diagnostics::Diagnostic>,
) {
    if trimmed.contains('{')
        || trimmed.contains('}')
        || canon::classify_css_value(trimmed).is_some()
    {
        return;
    }
    let Some(key) = named_token_key(trimmed, system, entry) else {
        return;
    };
    diagnostics.push(DiagnosticLocation::default().warning(
        DiagnosticCode::UnbracedTokenRef,
        format!(
            "token `{}` value `{trimmed}` names token `{key}` without braces; write `{{{key}}}`",
            entry.css_var()
        ),
    ));
}

/// The full key of the other token a bare value names: the value read as a
/// full key, else read within the owner's category. The owner never counts,
/// so a token whose value repeats its own path stays silent.
fn named_token_key(trimmed: &str, system: &BaseSystem, owner: &TokenEntry) -> Option<String> {
    let in_category = format!("{}.{trimmed}", owner.category());
    [trimmed.to_string(), in_category]
        .into_iter()
        .find(|key| {
            system
                .token(key)
                .is_some_and(|target| target.css_var() != owner.css_var())
        })
}

/// Expand `{path}` refs through the shared brace pass. Unknown refs keep the
/// value verbatim with the pass's error already pushed; unterminated braces
/// stay raw with a warning. Detached session like keyframes, but kept.
fn expand_token_refs(
    trimmed: &str,
    owner_var: &str,
    system: &BaseSystem,
    diagnostics: &mut Vec<crate::diagnostics::Diagnostic>,
) -> String {
    let mut session = ResolveSession {
        system,
        diagnostics,
        location: DiagnosticLocation::default(),
        sink: None,
        want: None,
    };
    match expand_brace_segments(trimmed, owner_var, &mut session) {
        BraceExpansion::Expanded(expanded) => expanded,
        BraceExpansion::Absent | BraceExpansion::Missing => trimmed.to_string(),
    }
}
