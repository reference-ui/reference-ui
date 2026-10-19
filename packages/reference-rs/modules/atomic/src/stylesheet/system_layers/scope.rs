//! Token selector scopes for one system's `@layer tokens` block.
//! A `TokenScope` picks the light and dark selector lists: `Root` keeps `:root` and bare
//! `[data-color-mode]` for a standalone system, `Portable` names the system's `[data-layer]`, and
//! `Isolated` serves an own system under upstreams, declaring on the document and on its stamps so an
//! upstream's layered root (which primitives stamp with `data-color-mode` too) never takes the own value
//! from a bare dark rule. Both named scopes also declare on the stamps of every system this one extends:
//! its vocabulary carries their tokens, so its values win inside their components, while a layered system
//! is never named and keeps its own. `own_token_scope` maps the stylesheet qualifiers to the scope an own
//! sheet prints under, and a nameless system falls back to the root selectors: it has no stamp to name.

/// Which selectors a system's token layer prints under.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum TokenScope<'a> {
    /// Standalone system: `:root, [data-color-mode=light]` and `[data-color-mode=dark]`.
    Root,
    /// Portable sheet: the system's `[data-layer]` and its color-mode stamps, then each extended system's.
    Portable {
        /// Systems this one extends, upstream first; their stamps follow the own one.
        extended: &'a [String],
    },
    /// Own system under upstreams: `:root` and the portable stamp list, never a bare dark rule.
    Isolated {
        /// Systems this one extends, upstream first; their stamps follow the own one.
        extended: &'a [String],
    },
}

/// The scope an own (non-portable) token layer prints under. Any upstream, extends
/// or layers, isolates it; `qualifiers` is own-first, so a single entry is standalone.
/// `extended` names the upstreams whose stamps the layer also claims.
pub fn own_token_scope<'a>(qualifiers: &[String], extended: &'a [String]) -> TokenScope<'a> {
    if qualifiers.len() > 1 {
        TokenScope::Isolated { extended }
    } else {
        TokenScope::Root
    }
}

/// Light and dark selector lists for one scope. The named scopes need the system
/// name for `[data-layer]`, so a nameless system prints the root selectors.
pub(super) fn token_selectors(scope: TokenScope<'_>, name: &str) -> (String, String) {
    if name.is_empty() {
        return root_selectors();
    }
    match scope {
        TokenScope::Root => root_selectors(),
        TokenScope::Portable { extended } => portable_selectors(name, extended),
        TokenScope::Isolated { extended } => isolated_selectors(name, extended),
    }
}

fn root_selectors() -> (String, String) {
    (
        ":root, [data-color-mode=light]".to_string(),
        "[data-color-mode=dark]".to_string(),
    )
}

/// The stamp lists: the own name first, then each extended system, each with its light
/// and dark color-mode stamps. With nothing extended this is the single own stamp.
fn portable_selectors(name: &str, extended: &[String]) -> (String, String) {
    let stamps = || std::iter::once(name).chain(extended.iter().map(String::as_str));
    let light = stamps()
        .map(|stamp| {
            format!(
                "{}, {}",
                data_layer_selector(stamp, None),
                data_layer_selector(stamp, Some("light"))
            )
        })
        .collect::<Vec<_>>()
        .join(", ");
    let dark = stamps()
        .map(|stamp| data_layer_selector(stamp, Some("dark")))
        .collect::<Vec<_>>()
        .join(", ");
    (light, dark)
}

fn isolated_selectors(name: &str, extended: &[String]) -> (String, String) {
    let (light, dark) = portable_selectors(name, extended);
    (
        format!(":root, :root[data-color-mode=light], body[data-color-mode=light], {light}"),
        format!(":root[data-color-mode=dark], body[data-color-mode=dark], {dark}"),
    )
}

/// One `[data-layer]` selector for `name`, narrowed to a color-mode stamp when given.
/// Portable and isolated both build their layer parts here, so the stamp spelling stays shared.
fn data_layer_selector(name: &str, mode: Option<&str>) -> String {
    match mode {
        Some(mode) => format!("[data-layer=\"{name}\"][data-color-mode={mode}]"),
        None => format!("[data-layer=\"{name}\"]"),
    }
}
