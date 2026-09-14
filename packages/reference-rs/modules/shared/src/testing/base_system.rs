//! In-memory base system fixture generators for Rust compiler crates.
//! Emits standardized JSON fragments representing design system configurations.
//! Provides minimal, semantic, recipe, and strict definitions for unit testing.
//! Eliminates duplicate mock system definitions across atomic, base-system, and typegen.

/// Returns a minimal system configuration JSON string with bare tokens and default breakpoints.
pub fn minimal_system_json() -> &'static str {
    r##"{
  "tokens": {
    "colors": {
      "blue.500": "#3b82f6",
      "red.500": "#ef4444"
    },
    "spacing": {
      "1": "0.25rem",
      "2": "0.5rem",
      "4": "1rem"
    }
  },
  "breakpoints": {
    "sm": "640px",
    "md": "768px",
    "lg": "1024px"
  }
}"##
}

/// Returns a semantic tokens system configuration JSON string with light and dark mode mappings.
pub fn semantic_tokens_system_json() -> &'static str {
    r##"{
  "tokens": {
    "colors": {
      "bg.canvas": {
        "light": "#ffffff",
        "dark": "#09090b"
      },
      "fg.default": {
        "light": "#09090b",
        "dark": "#fafafa"
      }
    }
  },
  "semanticTokens": {
    "colors": {
      "primary": "blue.500",
      "danger": "red.500"
    }
  }
}"##
}

/// Returns a recipes system configuration JSON string with component and slot recipes.
pub fn recipes_system_json() -> &'static str {
    r##"{
  "recipes": {
    "button": {
      "base": {
        "display": "inline-flex",
        "alignItems": "center"
      },
      "variants": {
        "variant": {
          "solid": { "backgroundColor": "blue.500" },
          "outline": { "borderWidth": "1px" }
        }
      },
      "defaultVariants": {
        "variant": "solid"
      }
    }
  }
}"##
}

/// Returns a strict system configuration JSON string enforcing strict token validation.
pub fn strict_system_json() -> &'static str {
    r##"{
  "strict": true,
  "strictTokens": true,
  "tokens": {
    "colors": {
      "neutral.100": "#f5f5f5",
      "neutral.900": "#171717"
    }
  }
}"##
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_system_fixtures() {
        assert!(minimal_system_json().contains("blue.500"));
        assert!(semantic_tokens_system_json().contains("bg.canvas"));
        assert!(recipes_system_json().contains("recipes"));
        assert!(strict_system_json().contains("strictTokens"));
    }
}
