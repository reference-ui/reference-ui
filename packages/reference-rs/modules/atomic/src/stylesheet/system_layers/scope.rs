//! Token selector scopes for one system's `@layer tokens` block.
//! A `TokenScope` picks the light and dark selector lists: `Root` keeps `:root` and bare
//! `[data-color-mode]` for a standalone system, `Portable` names only the system's `[data-layer]`, and
//! `Isolated` serves an own system under upstreams, declaring on the document and on its own stamps so an
//! upstream's layered root (which primitives stamp with `data-color-mode` too) never takes the own value
//! from a bare dark rule.
//! `own_token_scope` maps the stylesheet qualifiers to the scope an own sheet prints under, and a nameless
//! system falls back to the root selectors because it has no `[data-layer]` to name.

/// Which selectors a system's token layer prints under.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum TokenScope {
    /// Standalone system: `:root, [data-color-mode=light]` and `[data-color-mode=dark]`.
    Root,
    /// Portable sheet: the system's `[data-layer]` and its color-mode stamps only.
    Portable,
    /// Own system under upstreams: `:root` and its own `[data-layer]`, never a bare dark rule.
    Isolated,
}

/// The scope an own (non-portable) token layer prints under. Any upstream, extends
/// or layers, isolates it; `qualifiers` is own-first, so a single entry is standalone.
pub fn own_token_scope(qualifiers: &[String]) -> TokenScope {
    if qualifiers.len() > 1 {
        TokenScope::Isolated
    } else {
        TokenScope::Root
    }
}

/// Light and dark selector lists for one scope. The named scopes need the system
/// name for `[data-layer]`, so a nameless system prints the root selectors.
pub(super) fn token_selectors(scope: TokenScope, name: &str) -> (String, String) {
    if name.is_empty() {
        return root_selectors();
    }
    match scope {
        TokenScope::Root => root_selectors(),
        TokenScope::Portable => portable_selectors(name),
        TokenScope::Isolated => isolated_selectors(name),
    }
}

fn root_selectors() -> (String, String) {
    (
        ":root, [data-color-mode=light]".to_string(),
        "[data-color-mode=dark]".to_string(),
    )
}

fn portable_selectors(name: &str) -> (String, String) {
    let light = format!(
        "{}, {}",
        data_layer_selector(name, None),
        data_layer_selector(name, Some("light"))
    );
    (light, data_layer_selector(name, Some("dark")))
}

fn isolated_selectors(name: &str) -> (String, String) {
    let light = format!(
        ":root, :root[data-color-mode=light], body[data-color-mode=light], {}, {}",
        data_layer_selector(name, None),
        data_layer_selector(name, Some("light"))
    );
    let dark = format!(
        ":root[data-color-mode=dark], body[data-color-mode=dark], {}",
        data_layer_selector(name, Some("dark"))
    );
    (light, dark)
}

/// One `[data-layer]` selector for `name`, narrowed to a color-mode stamp when given.
/// Portable and isolated both build their layer parts here, so the stamp spelling stays shared.
fn data_layer_selector(name: &str, mode: Option<&str>) -> String {
    match mode {
        Some(mode) => format!("[data-layer=\"{name}\"][data-color-mode={mode}]"),
        None => format!("[data-layer=\"{name}\"]"),
    }
}
