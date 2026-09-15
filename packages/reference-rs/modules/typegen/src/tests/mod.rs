//! Shared spec fixtures and golden helpers for typegen Cargo proof.
//! Nested JSON is lowered through `from_json`. Goldens compare the full
//! `emit_dts` string and refresh only when `TYPEGEN_UPDATE_GOLDENS=1` is set.
//! Empty token categories and recipes are omitted, not `never`. Strict
//! wrappers are printer options on `emit_dts_with`, not spec fields.

use crate::{emit_dts, emit_dts_with, EmitOptions};
use base_system::BaseSystem;
use std::fs;
use std::path::PathBuf;

mod fonts;
mod forbid;
mod goldens;
mod recipes;
mod strict;
mod style;
mod tokens;

const CATALOG_JSON: &str = r##"{
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

const RECIPE_JSON: &str = r##"{
  "recipes": {
    "button": {
      "variants": {
        "size": { "sm": { "p": "1r" }, "lg": { "p": "3r" } },
        "tone": { "quiet": { "bg": "n100" }, "loud": { "bg": "n300" } }
      }
    }
  }
}"##;

const COMPOUND_JSON: &str = r##"{
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

const FONT_JSON: &str = r##"{
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

const TWO_RECIPE_JSON: &str = r##"{
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

fn catalog_system() -> BaseSystem {
    parse_dump(CATALOG_JSON, "catalog")
}

fn recipe_system() -> BaseSystem {
    parse_dump(RECIPE_JSON, "recipe")
}

fn compound_system() -> BaseSystem {
    parse_dump(COMPOUND_JSON, "compound")
}

fn font_system() -> BaseSystem {
    parse_dump(FONT_JSON, "font")
}

fn two_recipe_system() -> BaseSystem {
    parse_dump(TWO_RECIPE_JSON, "two-recipe")
}

fn parse_dump(json: &str, name: &str) -> BaseSystem {
    match BaseSystem::from_json(json) {
        Ok(system) => system,
        Err(err) => panic!("{name} dump must parse: {err}"),
    }
}

fn catalog_dts() -> String {
    emit_dts(&catalog_system())
}

fn recipe_dts() -> String {
    emit_dts(&recipe_system())
}

fn compound_dts() -> String {
    emit_dts(&compound_system())
}

fn font_dts() -> String {
    emit_dts(&font_system())
}

fn two_recipe_dts() -> String {
    emit_dts(&two_recipe_system())
}

fn style_dump_json() -> String {
    let catalog = CATALOG_JSON.trim();
    let inner = catalog
        .strip_prefix('{')
        .and_then(|s| s.strip_suffix('}'))
        .expect("catalog dump is an object")
        .trim();
    format!(
        "{{\n{inner},\n  \"breakpoints\": {{ \"sm\": \"640px\", \"md\": \"768px\", \"lg\": \"1024px\" }}\n}}"
    )
}

fn style_system() -> BaseSystem {
    parse_dump(&style_dump_json(), "style")
}

fn style_dts() -> String {
    emit_dts(&style_system())
}

fn style_dts_with(strict: &[&str]) -> String {
    emit_dts_with(
        &style_system(),
        &EmitOptions {
            strict: strict.iter().map(|name| (*name).to_string()).collect(),
        },
    )
}

fn style_strict_dts() -> String {
    style_dts_with(&["colors", "radii", "spacing"])
}

fn font_style_dump_json() -> String {
    let fonts = FONT_JSON
        .trim()
        .strip_prefix('{')
        .and_then(|s| s.strip_suffix('}'))
        .expect("font dump is an object")
        .trim();
    let style = style_dump_json();
    let style_inner = style
        .trim()
        .strip_suffix('}')
        .expect("style dump is an object")
        .trim();
    format!("{style_inner},\n{fonts}\n}}")
}

fn font_style_system() -> BaseSystem {
    parse_dump(&font_style_dump_json(), "font-style")
}

fn font_style_dts() -> String {
    emit_dts(&font_style_system())
}

fn assert_alias(dts: &str, name: &str, union: &str) {
    let line = format!("export type {name} = {union};");
    assert!(dts.contains(&line), "missing `{line}` in:\n{dts}");
}

fn jsx_farm_needles() -> &'static [&'static str] {
    &[
        "styled.div",
        "styled.span",
        "HTMLStyledProps",
        "StyledComponent",
        "JsxFactory",
        "box(",
        "flex(",
        "recipes/",
    ]
}

fn atomic_class_needles() -> &'static [&'static str] {
    &[".mt_2r", ".bg_n300", "atomic/"]
}

fn goldens_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/goldens")
}

fn should_update_goldens() -> bool {
    match std::env::var("TYPEGEN_UPDATE_GOLDENS") {
        Ok(value) => value == "1" || value.eq_ignore_ascii_case("true"),
        Err(_) => std::env::args().any(|arg| arg == "--update-goldens"),
    }
}

fn assert_matches_golden(name: &str, actual: &str) {
    let path = goldens_dir().join(name);
    if should_update_goldens() {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).expect("goldens dir");
        }
        fs::write(&path, actual).expect("write golden");
        return;
    }
    let expected = fs::read_to_string(&path).unwrap_or_else(|_| {
        panic!(
            "missing golden {}; refresh with TYPEGEN_UPDATE_GOLDENS=1 pnpm agentrs c typegen",
            path.display()
        )
    });
    assert_eq!(
        actual, expected,
        "golden drift at {}; refresh with TYPEGEN_UPDATE_GOLDENS=1 pnpm agentrs c typegen",
        path.display()
    );
}

/// TYP-FORBID-01 — populated emit contains no atomic class names.
#[test]
fn typ_forbid_01_emits_no_atomic_class_names() {
    for dts in [
        catalog_dts(),
        recipe_dts(),
        compound_dts(),
        font_dts(),
        style_dts(),
        font_style_dts(),
    ] {
        for needle in atomic_class_needles() {
            assert!(
                !dts.contains(needle),
                "TYP-FORBID-01: emitted text contains `{needle}`:\n{dts}"
            );
        }
    }
}

/// TYP-FORBID-02 — empty and populated emit contain no JSX / pattern farm.
#[test]
fn typ_forbid_02_emits_no_jsx_farm() {
    let empty = emit_dts(&BaseSystem::default());
    for dts in [
        empty,
        catalog_dts(),
        recipe_dts(),
        compound_dts(),
        font_dts(),
        style_dts(),
        font_style_dts(),
    ] {
        for needle in jsx_farm_needles() {
            assert!(
                !dts.contains(needle),
                "TYP-FORBID-02: emitted text contains `{needle}`:\n{dts}"
            );
        }
    }
}

/// Missing categories, recipes, and fonts are skipped rather than printed as `never`.
#[test]
fn omits_empty_categories_instead_of_never() {
    let system = parse_dump(
        r##"{"tokens":{"colors":{"n100":{"value":"#fff"}}}}"##,
        "colors-only",
    );
    let dts = emit_dts(&system);
    assert_alias(&dts, "ColorToken", "'n100'");
    assert!(!dts.contains("SpacingToken"), "{dts}");
    assert!(!dts.contains("never"), "{dts}");
    assert!(!dts.contains("spacing:"), "{dts}");
    assert!(!dts.contains("VariantProps"), "{dts}");
    assert!(!dts.contains("FontRegistry"), "{dts}");
    assert!(!dts.contains("StyleProps"), "{dts}");
}
