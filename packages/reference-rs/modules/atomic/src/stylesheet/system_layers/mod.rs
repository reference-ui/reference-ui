//! Prints `@layer reset`, `@layer global`, and `@layer tokens` from an ingested `BaseSystem`.
//! Global is the stored CSS dump (fixture `:root --spacing-root`) plus `@keyframes`
//! rules from the system's motion table and `@font-face` blocks from the font table.
//! Tokens become custom properties under the selectors their `TokenScope` picks: `:root` with bare
//! `[data-color-mode]` for a standalone system, `[data-layer]` stamps for the portable sheet, and an
//! isolated own-layer set under upstreams; both named scopes also claim each extended system's stamp.
//! Empty layers and empty keyframe tables are omitted; recipes and utilities stay separate.
//! Keyframe bodies resolve aliases, units, `{token}` refs, and `r` units through
//! the utility passes; unresolvable values print verbatim, mirroring tokens.
//! Token values resolve `{refs}` — whole-value or embedded in a composite — through
//! the shared brace pass, and `r` rhythm through the shared rhythm chain like
//! keyframes; unknown refs print verbatim with an error diagnostic, a whole value
//! that names a token without braces prints verbatim under a warning, and the
//! rhythm root itself refuses rhythm values with a diagnostic.

use base_system::BaseSystem;

use super::global;

mod fonts;
mod keyframes;
mod scope;
#[cfg(test)]
mod tests;
mod tokens;

pub use scope::{own_token_scope, TokenScope};
pub use tokens::append_tokens;

use self::fonts::{append_font_faces, has_printable_fonts};
use self::keyframes::{append_keyframes, has_printable_keyframes};


/// Append globalCss and token custom-property layers under the given token `scope`.
pub fn append_system_layers(
    out: &mut String,
    system: &BaseSystem,
    scope: TokenScope<'_>,
    diagnostics: &mut Vec<crate::diagnostics::Diagnostic>,
) {
    global::append_reset_css(out, system, diagnostics);
    append_global(out, system, diagnostics);
    append_tokens(out, system, scope, diagnostics);
}

/// Append globalCss and portable [data-layer] token custom-property layers; `extended`
/// names the systems whose stamps the token layer also claims.
pub fn append_portable_system_layers(
    out: &mut String,
    system: &BaseSystem,
    extended: &[String],
    diagnostics: &mut Vec<crate::diagnostics::Diagnostic>,
) {
    global::append_reset_css(out, system, diagnostics);
    append_global(out, system, diagnostics);
    append_tokens(out, system, TokenScope::Portable { extended }, diagnostics);
}

/// Append `@layer global {…}` when fragments, fonts, or keyframes print.
pub fn append_global(
    out: &mut String,
    system: &BaseSystem,
    diagnostics: &mut Vec<crate::diagnostics::Diagnostic>,
) {
    if !has_printable_global(system) {
        return;
    }
    out.push_str("@layer global {\n");
    global::append_global_fragment_rules(out, system, diagnostics);
    append_font_faces(out, system);
    append_keyframes(out, system);
    out.push_str("}\n");
}

fn has_printable_global(system: &BaseSystem) -> bool {
    global::has_printable_global_rules(system)
        || has_printable_keyframes(system)
        || has_printable_fonts(system)
}
