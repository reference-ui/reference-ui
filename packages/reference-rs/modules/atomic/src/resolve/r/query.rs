//! Numeric and named `r` keys become `@container` min-width queries.
//! Widths come from the ingested breakpoint scale; this file only knows the query language.
//! Unknown named keys return None so extract can warn. Numeric keys never need the table.

use crate::config::BreakpointScale;

/// Lower an `r` key (`300`, `md`) to `@container (min-width: Npx)`.
pub fn lower_r_key(key: &str, scale: &BreakpointScale) -> Option<String> {
    // r={{ 300: { p: '1r' }, md: { mt: '2r' } }}
    format_query(key, scale, None)
}

/// Same query, targeting a named container (`@container card (min-width: Npx)`).
pub fn lower_r_key_named(
    key: &str,
    scale: &BreakpointScale,
    container: &str,
) -> Option<String> {
    // @container card (min-width: 768px)
    format_query(key, scale, Some(container))
}

fn format_query(key: &str, scale: &BreakpointScale, container: Option<&str>) -> Option<String> {
    // 300 → 300px    md → 768px
    let width = width_for_key(key, scale)?;
    Some(wrap_query(width, container))
}

fn width_for_key<'a>(key: &'a str, scale: &'a BreakpointScale) -> Option<&'a str> {
    let trimmed = key.trim();
    if is_numeric_key(trimmed) {
        // 300: { p: '1r' }
        return Some(trimmed);
    }
    // md / sm / wide
    scale.width_px(trimmed)
}

fn is_numeric_key(key: &str) -> bool {
    // 300  /  768
    !key.is_empty() && key.parse::<f64>().is_ok()
}

fn wrap_query(width: &str, container: Option<&str>) -> String {
    match container {
        Some(name) if !name.is_empty() => {
            // @container card (min-width: 768px)
            format!("@container {name} (min-width: {width}px)")
        }
        _ => {
            // @container (min-width: 640px)
            format!("@container (min-width: {width}px)")
        }
    }
}
