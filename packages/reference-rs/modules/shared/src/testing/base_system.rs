//! In-memory `BaseSystem` fixtures shared by Rust compiler crate tests.
//! Serializes versioned `EvaluatedSystemSpec` JSON with schemaVersion 1 and reference-ui profile,
//! which `from_json` lowers into indexed `TokenEntry` leaves (`category` + kebab `cssVar`).
//! Callers should take `minimal_system()` rather than hand-rolling specs in tests.
//! Provides canonical fixtures for minimal tokens, semantic color pairs, and typed recipes.

use base_system::BaseSystem;

/// Nested spec for a small token table plus default breakpoint widths.
pub fn minimal_system_json() -> &'static str {
    r##"{
  "schemaVersion": 1,
  "profile": "reference-ui",
  "name": "minimal-system",
  "tokens": {
    "colors": {
      "blue": { "500": { "value": "#3b82f6" } },
      "red": { "500": { "value": "#ef4444" } }
    },
    "spacing": {
      "1": { "value": "0.25rem" },
      "2": { "value": "0.5rem" },
      "4": { "value": "1rem" }
    }
  },
  "fonts": {},
  "breakpoints": {
    "sm": "640px",
    "md": "768px",
    "lg": "1024px"
  },
  "globalCss": [],
  "keyframes": {},
  "recipes": {},
  "staticCss": {},
  "provenance": []
}"##
}

/// Color leaves with `value` plus optional `dark` — not a `semanticTokens` map.
pub fn semantic_tokens_system_json() -> &'static str {
    r##"{
  "schemaVersion": 1,
  "profile": "reference-ui",
  "name": "semantic-tokens-system",
  "tokens": {
    "colors": {
      "bg": {
        "canvas": { "value": "#ffffff", "dark": "#09090b" }
      },
      "fg": {
        "default": { "value": "#09090b", "dark": "#fafafa" }
      }
    }
  },
  "fonts": {},
  "globalCss": [],
  "keyframes": {},
  "recipes": {},
  "staticCss": {},
  "provenance": []
}"##
}

/// Typed `RecipeDefinition` tables. Spec recipes are not `Record<string, string>`.
pub fn recipes_system_json() -> &'static str {
    r##"{
  "schemaVersion": 1,
  "profile": "reference-ui",
  "name": "recipes-system",
  "tokens": {},
  "fonts": {},
  "globalCss": [],
  "keyframes": {},
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
  },
  "staticCss": {},
  "provenance": []
}"##
}

/// Indexed system from the minimal nested dump.
pub fn minimal_system() -> BaseSystem {
    parse_fixture(minimal_system_json(), "minimal_system")
}

/// Indexed system from the semantic color dump.
pub fn semantic_tokens_system() -> BaseSystem {
    parse_fixture(semantic_tokens_system_json(), "semantic_tokens_system")
}

/// Indexed system from the typed recipe dump.
pub fn recipes_system() -> BaseSystem {
    parse_fixture(recipes_system_json(), "recipes_system")
}

fn parse_fixture(json: &str, name: &str) -> BaseSystem {
    match BaseSystem::from_json(json) {
        Ok(system) => system,
        Err(err) => panic!("{name} fixture must parse: {err}"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn minimal_system_from_json_succeeds() {
        let system = BaseSystem::from_json(minimal_system_json())
            .expect("minimal spec must be a valid BaseSystemSpec");
        assert!(system.is_token("colors.blue.500"));
        assert_eq!(system.token_category("colors.blue.500"), Some("colors"));
        assert_eq!(
            system.token_css_var("colors.blue.500"),
            Some("--colors-blue-500")
        );
        assert_eq!(system.token_light("colors.blue.500"), Some("#3b82f6"));
        assert!(system.token_dark("colors.blue.500").is_none());
        assert_eq!(system.breakpoints().width_px("md"), Some("768"));
        let via_ctor = minimal_system();
        assert_eq!(via_ctor.token_light("spacing.4"), Some("1rem"));
        assert_eq!(
            via_ctor.token_css_var("spacing.4"),
            system.token_css_var("spacing.4")
        );
    }

    #[test]
    fn semantic_tokens_system_indexes_value_and_dark() {
        let system = semantic_tokens_system();
        assert_eq!(system.token_light("colors.bg.canvas"), Some("#ffffff"));
        assert_eq!(system.token_dark("colors.bg.canvas"), Some("#09090b"));
        assert_eq!(
            system.token_css_var("colors.fg.default"),
            Some("--colors-fg-default")
        );
    }

    #[test]
    fn recipes_system_stores_typed_recipe_tables() {
        let system = recipes_system();
        let button = system.get_recipe("button").expect("button recipe");
        assert_eq!(
            button.base.get("display").map(String::as_str),
            Some("inline-flex")
        );
        assert_eq!(
            button.default_variants.get("variant").map(String::as_str),
            Some("solid")
        );
    }
}
