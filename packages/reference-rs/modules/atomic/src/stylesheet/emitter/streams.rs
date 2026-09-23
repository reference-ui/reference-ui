//! Per-layer streams of the dual-sheet build, captured not invented.
//! Each field holds one contiguous chunk of the emitter's existing push sequence,
//! and concatenation reproduces today's bytes exactly. The dual-sheet entry point
//! builds these streams then joins them; the single-sheet builds stay sequential
//! as the byte-identity oracle. S2 carries these across N-API verbatim as the
//! 9-key own object: the system name plus one string per layer block.

use serde::{Deserialize, Serialize};

use super::StylesheetSinks;
use super::super::global::append_reset_css;
use super::super::layers::{LAYER_PREAMBLE, wrap_package_layer};
use super::super::system_layers::{append_global, append_tokens};
use crate::atom::AtomSet;
use crate::recipes::CompiledRecipe;
use base_system::BaseSystem;

/// One captured chunk per layer block, plus the package name the wrap prints.
/// Vocabulary A (PLAN §3.6, Final): names as data + one string per layer block
/// + package name. Field order is the emitter's push order. Serde carries the
/// 9-key N-API own object verbatim (snake→camel); empty blocks stay empty
/// strings, never omitted, so the oracle channel needs no refold.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StylesheetStreams {
    /// The system name: entry identity for statement dedupe (names-as-data).
    pub name: String,
    /// The `@layer …;` preamble, verbatim.
    pub preamble: String,
    /// `@layer reset {…}`, empty when the system prints no reset.
    pub reset: String,
    /// `@layer global {…}`, empty when nothing is printable.
    pub global: String,
    /// `@layer tokens {…}` with `:root` selectors (served sheet).
    pub tokens: String,
    /// `@layer tokens {…}` with `[data-layer]` selectors (portable sheet).
    pub tokens_portable: String,
    /// `@layer recipes {…}`, shared by both sheets.
    pub recipes: String,
    /// `@layer utilities {…}`, shared by both sheets.
    pub utilities: String,
    /// Package layer name; empty stays flat.
    pub package: String,
}

impl StylesheetStreams {
    /// Preamble-only streams for fail-closed artifacts: no system lowered,
    /// so the name stays empty and both sheets reprint to the bare preamble.
    pub fn preamble_only() -> Self {
        Self {
            preamble: LAYER_PREAMBLE.to_string(),
            ..Self::default()
        }
    }

    /// Concatenate the served sheet exactly as the sequential build did.
    pub fn stylesheet(&self) -> String {
        wrap_package_layer(&self.package, &self.inner(&self.tokens))
    }

    /// Concatenate the portable sheet exactly as the sequential build did.
    pub fn portable_stylesheet(&self) -> String {
        wrap_package_layer(&self.package, &self.inner(&self.tokens_portable))
    }

    /// Join one sheet's inner streams in push order: preamble, reset, global,
    /// tokens, recipes, utilities.
    fn inner(&self, tokens: &str) -> String {
        let mut inner = String::with_capacity(
            self.preamble.len()
                + self.reset.len()
                + self.global.len()
                + tokens.len()
                + self.recipes.len()
                + self.utilities.len(),
        );
        inner.push_str(&self.preamble);
        inner.push_str(&self.reset);
        inner.push_str(&self.global);
        inner.push_str(tokens);
        inner.push_str(&self.recipes);
        inner.push_str(&self.utilities);
        inner
    }
}

/// Capture every stream of the dual-sheet build in push order.
///
/// Reset/global print identically in both sheets, so their text is captured
/// once; each pass still runs against its own sink so diagnostics land exactly
/// where the sequential build put them.
pub fn build_stylesheet_streams(
    atom_set: &AtomSet,
    system: &BaseSystem,
    recipes: &[CompiledRecipe],
    sinks: StylesheetSinks<'_>,
) -> StylesheetStreams {
    let mut reset = String::new();
    append_reset_css(&mut reset, system, sinks.primary);
    let mut portable_reset = String::new();
    append_reset_css(&mut portable_reset, system, sinks.portable);
    debug_assert_eq!(reset, portable_reset, "reset prints identically in both sheets");
    let mut global = String::new();
    append_global(&mut global, system, sinks.primary);
    let mut portable_global = String::new();
    append_global(&mut portable_global, system, sinks.portable);
    debug_assert_eq!(
        global, portable_global,
        "global prints identically in both sheets"
    );
    let mut tokens = String::new();
    append_tokens(&mut tokens, system, false);
    let mut tokens_portable = String::new();
    append_tokens(&mut tokens_portable, system, true);
    StylesheetStreams {
        name: system.name.clone(),
        preamble: LAYER_PREAMBLE.to_string(),
        reset,
        global,
        tokens,
        tokens_portable,
        recipes: recipes_layer(recipes),
        utilities: utilities_layer(atom_set, &system.name),
        package: system.name.clone(),
    }
}

/// Capture `@layer recipes {…}`; empty when no recipe has rules.
fn recipes_layer(recipes: &[CompiledRecipe]) -> String {
    let mut out = String::new();
    super::append_recipes_layer(&mut out, recipes);
    out
}

/// Capture `@layer utilities {…}`; empty when the atom set is empty.
fn utilities_layer(atom_set: &AtomSet, system: &str) -> String {
    let mut out = String::with_capacity(utilities_capacity(atom_set));
    super::append_utilities_layer(&mut out, atom_set, system);
    out
}

/// Pre-size the utilities buffer: ~128 bytes per rule covers the selector,
/// declaration, indent, and wrap lines with room to spare, so the pushes
/// below never regrow. Overshoot is one transient allocation.
fn utilities_capacity(atom_set: &AtomSet) -> usize {
    atom_set.len().saturating_mul(128).saturating_add(1024)
}
