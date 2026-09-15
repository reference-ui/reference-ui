//! Design-system configuration definitions and schema ingestion for Reference UI.
//! Houses token scales, custom condition breakpoints, shorthand maps, and recipe contracts guiding CSS compilation.
//! Provides the foundational design tokens and rules that parameterize extraction and stylesheet emission.

pub mod breakpoints;
pub mod fonts;

pub use breakpoints::{resolve_breakpoints, BreakpointConfig, BreakpointScale};
pub use fonts::{resolve_fonts, FontDefinitionConfig, FontScale, FontsConfig};
use serde::{Deserialize, Serialize};

/// Optional token definitions passed into compilation requests.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokensConfig {
    #[serde(default)]
    pub breakpoints: Option<BreakpointConfig>,
    #[serde(default)]
    pub fonts: Option<FontsConfig>,
}

/// Optional base system configuration passed into compilation requests.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BaseSystemConfig {
    #[serde(default)]
    pub breakpoints: Option<BreakpointConfig>,
    #[serde(default)]
    pub fonts: Option<FontsConfig>,
}
