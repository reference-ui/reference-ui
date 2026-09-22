//! Breakpoint scale for one design-system utterance.
//! Names drive responsive array slots (`mt={['1r', '2r']}` → `base`, then `sm`).
//! Optional pixel widths are what `r/` looks up for `@container (min-width: Npx)`.
//! `standard()` is the host scale the reference profile provides (sm 640 … 2xl 1536).
//! Profile canonical breakpoints merge with authored overrides deterministically.

use indexmap::IndexMap;
use rustc_hash::FxBuildHasher;
use serde::{Deserialize, Serialize};

use crate::spec::SpecBreakpointWidth;

type FxIndexMap<K, V> = IndexMap<K, V, FxBuildHasher>;

const STANDARD_WIDTHS: &[(&str, &str)] = &[
    ("sm", "640"),
    ("md", "768"),
    ("lg", "1024"),
    ("xl", "1280"),
    ("2xl", "1536"),
];

/// Ordered scale of condition names plus optional name → pixel-width lookups.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BreakpointScale {
    #[serde(default, deserialize_with = "deserialize_names")]
    names: Vec<String>,
    #[serde(default)]
    widths: FxIndexMap<String, String>,
}

impl BreakpointScale {
    /// Host default the reference profile provides: `base` plus sm/md/lg/xl/2xl.
    pub fn standard() -> Self {
        from_width_pairs(STANDARD_WIDTHS)
    }

    /// Combine profile canonical breakpoints (sm..2xl) with authored overrides.
    /// Authored entries override standard widths deterministically, and new
    /// authored breakpoint names are appended in their declaration order.
    pub fn from_profile_and_authored(
        authored: Option<IndexMap<String, SpecBreakpointWidth>>,
    ) -> Self {
        let mut names = vec![
            "sm".to_string(),
            "md".to_string(),
            "lg".to_string(),
            "xl".to_string(),
            "2xl".to_string(),
        ];
        let mut widths = FxIndexMap::default();
        for (name, px) in STANDARD_WIDTHS {
            widths.insert((*name).to_string(), (*px).to_string());
        }
        if let Some(authored_map) = authored {
            for (name, width) in authored_map {
                let px = width.into_px();
                if !names.contains(&name) {
                    names.push(name.clone());
                }
                widths.insert(name, px);
            }
        }
        Self {
            names: with_leading_base(names),
            widths,
        }
    }

    /// Construct a scale from an ordered sequence of breakpoint names.
    /// Ensures index 0 is always mapped to `base` for unconditioned styles.
    pub fn from_names(names: impl IntoIterator<Item = impl Into<String>>) -> Self {
        let raw: Vec<String> = names.into_iter().map(Into::into).collect();
        Self {
            names: with_leading_base(raw),
            widths: FxIndexMap::default(),
        }
    }

    /// Construct a scale from name → pixel-width pairs, prepending `base`.
    pub fn from_named_widths(
        pairs: impl IntoIterator<Item = (impl Into<String>, impl Into<String>)>,
    ) -> Self {
        let mut widths = FxIndexMap::default();
        let mut names = Vec::new();
        for (name, px) in pairs {
            let name = name.into();
            if !name.is_empty() && !names.iter().any(|existing| existing == &name) {
                names.push(name.clone());
            }
            widths.insert(name, px.into());
        }
        Self {
            names: with_leading_base(names),
            widths,
        }
    }

    /// Look up the condition name assigned to a specific responsive array index.
    pub fn breakpoint_for_index(&self, index: usize) -> Option<&str> {
        self.names.get(index).map(String::as_str)
    }

    /// Access the ordered slice of breakpoint names.
    pub fn names(&self) -> &[String] {
        &self.names
    }

    /// True when no names were declared.
    pub fn is_empty(&self) -> bool {
        self.names.is_empty()
    }

    /// Pixel width for a named breakpoint, if the utterance declared one.
    pub fn width_px(&self, name: &str) -> Option<&str> {
        self.widths.get(name).map(String::as_str)
    }
}

fn from_width_pairs(pairs: &[(&str, &str)]) -> BreakpointScale {
    BreakpointScale::from_named_widths(pairs.iter().map(|(name, px)| (*name, *px)))
}

fn with_leading_base(raw: Vec<String>) -> Vec<String> {
    if raw.is_empty() {
        return raw;
    }
    let mut list = Vec::with_capacity(raw.len() + 1);
    if raw.first().map(String::as_str) != Some("base") {
        list.push("base".to_string());
    }
    for name in raw {
        if !name.is_empty() && list.last().map(String::as_str) != Some(name.as_str()) {
            list.push(name);
        }
    }
    list
}

fn deserialize_names<'de, D>(deserializer: D) -> Result<Vec<String>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let raw = Vec::<String>::deserialize(deserializer)?;
    Ok(with_leading_base(raw))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn standard_scale_has_host_widths() {
        let scale = BreakpointScale::standard();
        assert_eq!(scale.breakpoint_for_index(0), Some("base"));
        assert_eq!(scale.breakpoint_for_index(1), Some("sm"));
        assert_eq!(scale.breakpoint_for_index(5), Some("2xl"));
        assert_eq!(scale.width_px("sm"), Some("640"));
        assert_eq!(scale.width_px("md"), Some("768"));
    }

    #[test]
    fn profile_and_authored_preserves_order_and_overrides() {
        let mut authored = IndexMap::new();
        authored.insert(
            "md".to_string(),
            SpecBreakpointWidth::Bare("800px".to_string()),
        );
        authored.insert(
            "tablet".to_string(),
            SpecBreakpointWidth::Bare("700px".to_string()),
        );
        let scale = BreakpointScale::from_profile_and_authored(Some(authored));
        assert_eq!(scale.breakpoint_for_index(0), Some("base"));
        assert_eq!(scale.breakpoint_for_index(1), Some("sm"));
        assert_eq!(scale.breakpoint_for_index(2), Some("md"));
        assert_eq!(scale.width_px("md"), Some("800"));
        assert_eq!(scale.width_px("sm"), Some("640"));
        assert_eq!(scale.breakpoint_for_index(6), Some("tablet"));
        assert_eq!(scale.width_px("tablet"), Some("700"));
    }

    #[test]
    fn custom_scale_prepends_base() {
        let scale = BreakpointScale::from_names(["tablet", "desktop"]);
        assert_eq!(scale.breakpoint_for_index(0), Some("base"));
        assert_eq!(scale.breakpoint_for_index(1), Some("tablet"));
        assert_eq!(scale.width_px("tablet"), None);
    }

    #[test]
    fn named_widths_keep_pixels() {
        let scale = BreakpointScale::from_named_widths([("wide", "1200"), ("ultra", "1800")]);
        assert_eq!(scale.breakpoint_for_index(1), Some("wide"));
        assert_eq!(scale.width_px("wide"), Some("1200"));
        assert_eq!(scale.width_px("ultra"), Some("1800"));
    }

    #[test]
    fn json_names_prepend_base() {
        let scale: BreakpointScale =
            serde_json::from_str(r#"{"names":["tablet","desktop"]}"#).unwrap();
        assert_eq!(scale.breakpoint_for_index(0), Some("base"));
        assert_eq!(scale.breakpoint_for_index(1), Some("tablet"));
        assert_eq!(scale.breakpoint_for_index(2), Some("desktop"));
    }
}
