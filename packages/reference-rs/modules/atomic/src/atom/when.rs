//! Lowered condition stored on a resolved `Atom`.
//!
//! Extract keeps authored `when` strings on `Want`. Resolve parses each string
//! once into this type, which carries the class-name segment and the stylesheet
//! wrap together so the two cannot disagree. Unknown `_` keys never become a
//! `When`: resolve emits a diagnostic and drops that want's atoms.

use serde::{Deserialize, Serialize};

/// One lowered condition: name segment and wrap from a single parse.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum When {
    /// Named breakpoint from the `BaseSystem` scale (`sm` → `@container`).
    Breakpoint(BreakpointWhen),
    /// Catalog `_` key (`_hover`, `_dark`, `_osDark`).
    Pseudo(PseudoWhen),
    /// Authored `@media` / `@container` / `@supports` query string (including `r/` stamps).
    AtRule(AtRuleWhen),
    /// Arbitrary `&` selector, or a non-at-rule `@` fallback.
    Selector(SelectorWhen),
}

/// Borrowed wrap used by the stylesheet printer. Emit walks every Media/Container/Supports.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WhenKind<'a> {
    Media(&'a str),
    Container(&'a str),
    Supports(&'a str),
    Selector(&'a str),
}

/// Breakpoint name plus the concrete container query it lowers to.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct BreakpointWhen {
    name: Box<str>,
    query: Box<str>,
}

/// Catalog condition: authored token, class segment, and wrap.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct PseudoWhen {
    authored: Box<str>,
    segment: Box<str>,
    wrap: StoredWrap,
}

/// At-rule query plus the bracketed class-name segment.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct AtRuleWhen {
    query: Box<str>,
    segment: Box<str>,
}

/// Selector template plus the bracketed class-name segment.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct SelectorWhen {
    authored: Box<str>,
    segment: Box<str>,
    template: Box<str>,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
enum StoredWrap {
    Media(Box<str>),
    Selector(Box<str>),
}

impl When {
    pub(crate) fn from_catalog(authored: Box<str>, preset: &str) -> Self {
        let segment: Box<str> = authored.strip_prefix('_').unwrap_or(&authored).into();
        let wrap = if preset.starts_with("@media") {
            StoredWrap::Media(preset.into())
        } else {
            StoredWrap::Selector(preset.into())
        };
        Self::Pseudo(PseudoWhen {
            authored,
            segment,
            wrap,
        })
    }

    pub(crate) fn breakpoint(name: Box<str>, query: Box<str>) -> Self {
        Self::Breakpoint(BreakpointWhen { name, query })
    }

    pub(crate) fn at_rule(query: Box<str>, segment: Box<str>) -> Self {
        Self::AtRule(AtRuleWhen { query, segment })
    }

    pub(crate) fn selector(authored: Box<str>, segment: Box<str>, template: Box<str>) -> Self {
        Self::Selector(SelectorWhen {
            authored,
            segment,
            template,
        })
    }

    /// Runtime dictionary key piece. Matches the authored / stamped string.
    pub fn authored(&self) -> &str {
        match self {
            Self::Breakpoint(w) => &w.name,
            Self::Pseudo(w) => &w.authored,
            Self::AtRule(w) => &w.query,
            Self::Selector(w) => &w.authored,
        }
    }

    /// Class-name prefix (`hover`, `sm`, `[&[data-slot=inner]]`).
    pub fn class_segment(&self) -> &str {
        match self {
            Self::Breakpoint(w) => &w.name,
            Self::Pseudo(w) => &w.segment,
            Self::AtRule(w) => &w.segment,
            Self::Selector(w) => &w.segment,
        }
    }

    /// Stylesheet wrap. Selector templates still contain `&`.
    pub fn wrap(&self) -> WhenKind<'_> {
        match self {
            Self::Breakpoint(w) => WhenKind::Container(&w.query),
            Self::Pseudo(w) => w.wrap.as_kind(),
            Self::AtRule(w) => at_rule_kind(&w.query),
            Self::Selector(w) => WhenKind::Selector(&w.template),
        }
    }
}

impl StoredWrap {
    fn as_kind(&self) -> WhenKind<'_> {
        match self {
            Self::Media(s) => WhenKind::Media(s),
            Self::Selector(s) => WhenKind::Selector(s),
        }
    }
}

fn at_rule_kind(query: &str) -> WhenKind<'_> {
    if query.starts_with("@media") {
        WhenKind::Media(query)
    } else if query.starts_with("@supports") {
        WhenKind::Supports(query)
    } else {
        WhenKind::Container(query)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn authored_and_segment_stay_paired() {
        let hover = When::from_catalog("_hover".into(), "&:is(:hover, [data-hover])");
        assert_eq!(hover.authored(), "_hover");
        assert_eq!(hover.class_segment(), "hover");
        assert_eq!(
            hover.wrap(),
            WhenKind::Selector("&:is(:hover, [data-hover])")
        );
    }
}
