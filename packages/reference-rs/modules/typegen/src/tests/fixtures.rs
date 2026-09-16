//! In-memory JSON spec fixtures for typegen unit tests.
//! Provides partial system fragments for catalog tokens, recipes, compounds, and fonts.
//! Consumed by test helpers that lower JSON specs through base-system for declaration verification.
//! Preserves golden test inputs isolated from external fixtures.

pub(super) const CATALOG_JSON: &str = r##"{
  "tokens": {
    "colors": {
      "n100": { "value": "#f4f4f5" },
      "n300": { "value": "#d4d4d8" },
      "brand": { "primary": { "value": "#2563eb" } }
    },
    "spacing": {
      "1": { "value": "0.25rem" },
      "2": { "value": "0.5rem" },
      "4": { "value": "1rem" },
      "1/2r": { "value": "0.5rem" },
      "1r": { "value": "1rem" },
      "2r": { "value": "2rem" }
    },
    "radii": {
      "none": { "value": "0" },
      "sm": { "value": "0.27rem" },
      "md": { "value": "0.4rem" },
      "lg": { "value": "0.6rem" },
      "full": { "value": "9999px" }
    },
    "fontSizes": {
      "xs": { "value": "0.75rem" },
      "sm": { "value": "0.875rem" },
      "base": { "value": "1rem" },
      "lg": { "value": "1.125rem" }
    },
    "fontWeights": {
      "regular": { "value": "400" },
      "medium": { "value": "500" },
      "bold": { "value": "700" }
    },
    "lineHeights": {
      "tight": { "value": "1.25" },
      "normal": { "value": "1.5" }
    },
    "shadows": {
      "sm": { "value": "0 1px 2px rgb(0 0 0 / 0.05)" },
      "md": { "value": "0 4px 6px rgb(0 0 0 / 0.1)" },
      "overlay": { "value": "0 8px 24px rgb(0 0 0 / 0.16)" }
    },
    "zIndex": {
      "modal": { "value": "100" },
      "toast": { "value": "200" },
      "tooltip": { "value": "300" }
    }
  }
}"##;

pub(super) const RECIPE_JSON: &str = r##"{
  "recipes": {
    "button": {
      "variants": {
        "size": { "sm": { "p": "1r" }, "lg": { "p": "3r" } },
        "tone": { "quiet": { "bg": "n100" }, "loud": { "bg": "n300" } }
      }
    }
  }
}"##;

pub(super) const COMPOUND_JSON: &str = r##"{
  "recipes": {
    "button": {
      "variants": {
        "size": { "sm": { "p": "1r" }, "lg": { "p": "3r" } },
        "tone": { "quiet": { "bg": "n100" }, "loud": { "bg": "n300" } }
      },
      "compoundVariants": [
        { "tone": "loud", "size": "lg", "css": { "border": "2px solid" } }
      ]
    }
  }
}"##;

pub(super) const FONT_JSON: &str = r##"{
  "fonts": {
    "sans": {
      "value": "Inter, sans-serif",
      "weights": { "normal": "400", "bold": "700" }
    },
    "mono": {
      "value": "JetBrains Mono, monospace",
      "weights": { "light": "300", "medium": "500" }
    }
  }
}"##;

pub(super) const TWO_RECIPE_JSON: &str = r##"{
  "recipes": {
    "button": {
      "variants": {
        "size": { "sm": { "p": "1r" }, "lg": { "p": "3r" } },
        "tone": { "quiet": { "bg": "n100" }, "loud": { "bg": "n300" } }
      }
    },
    "badge": {
      "variants": {
        "tone": { "quiet": { "bg": "n100" }, "loud": { "bg": "n300" } }
      }
    }
  }
}"##;
