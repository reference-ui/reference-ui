//! `FontRegistry` from dump font families and weight **keys**, plus `FontProps`.
//! Family names are quoted. Weight keys are authored names such as `bold`;
//! CSS numbers are dump values, not type keys. Families with an empty weight
//! map are omitted rather than printed as an empty interface. When StyleProps
//! is emitted without fonts, the assembler prints `FontRegistry {}` so
//! `[FontName] extends [never]` falls back instead of collapsing to `never`.
//! `FontProps` is a never-guard conditional: empty registry uses FallbackFontProps,
//! populated registry uses ScopedFontProps only so tsc can reject mismatched weights.

use super::ts::quote_literal;
use base_system::BaseSystem;
use std::collections::BTreeSet;

/// Fallback + scoped mapped types. Printed after `StylePropValue` in the same
/// document so `FontProps` can mix into `StyleProps` without a csstype import.
/// Empty registry selects FallbackFontProps; populated registry is Scoped only.
const FONT_PROPS: &str = r#"type StringKey<T> = Extract<keyof T, string>;

export type FontName = StringKey<FontRegistry>;

export type FontWeightName<TFont extends FontName> =
  StringKey<FontRegistry[TFont]>;

export type ScopedFontWeight<TFont extends FontName> =
  `${TFont}.${FontWeightName<TFont>}`;

export type FontWeightValue<TFont extends FontName> =
  | FontWeightName<TFont>
  | ScopedFontWeight<TFont>;

type ScopedFontProps = {
  [TFont in FontName]: {
    font?: StylePropValue<TFont>;
    weight?: StylePropValue<FontWeightValue<TFont>>;
  };
}[FontName];

type FallbackFontProps = {
  font?: StylePropValue<string>;
  weight?: StylePropValue<string>;
};

export type FontProps = [FontName] extends [never]
  ? FallbackFontProps
  : ScopedFontProps;
"#;

pub(super) fn font_registry(system: &BaseSystem) -> String {
    let mut families = Vec::new();
    for (name, font) in system.fonts.iter() {
        let weights: BTreeSet<String> = font.weights.keys().cloned().collect();
        if weights.is_empty() {
            continue;
        }
        families.push((name.as_str(), weights));
    }
    if families.is_empty() {
        return String::new();
    }
    let mut out = String::from("export interface FontRegistry {\n");
    for (name, weights) in families {
        out.push_str("  ");
        out.push_str(&quote_literal(name));
        out.push_str(": { ");
        push_weight_flags(&mut out, &weights);
        out.push_str(" };\n");
    }
    out.push_str("}\n");
    out
}

pub(super) fn empty_registry() -> &'static str {
    "export interface FontRegistry {}\n"
}

pub(super) fn font_props() -> &'static str {
    FONT_PROPS
}

fn push_weight_flags(out: &mut String, weights: &BTreeSet<String>) {
    let mut first = true;
    for weight in weights {
        if !first {
            out.push_str("; ");
        }
        first = false;
        out.push_str(&quote_literal(weight));
        out.push_str(": true");
    }
}
