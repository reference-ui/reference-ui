//! `.d.ts` from a base system plus canon: token unions, recipe variants, font
//! registry, `FontProps`, `StyleProps`, recursive `SystemStyleObject`. Input
//! is the definition, not the atom set. Users never write `.mt_2r` in these
//! files. This is not a jsx factory and not a patterns farm. Token, recipe,
//! font, and style emission walks `BaseSystem`; missing categories and recipes
//! are omitted rather than `never`. Style dumps without fonts still print
//! `FontRegistry {}` so FontProps cannot collapse StyleProps. Compound `when`
//! rows that name unknown axes are skipped. `emit_dts` is always open-mode;
//! strict category wrappers live on `emit_dts_with` because `strict` is not a
//! Dump field.

mod emit;

use base_system::BaseSystem;

/// Printer options that are not dump fields. `strict` names token categories
/// whose `SystemStyleObject` is wrapped (`colors`, `radii`, `spacing`).
/// Unknown names are skipped; duplicates keep first-seen declaration order.
/// An empty list is open mode: StyleProps keep the `(string & {})` hatch.
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct EmitOptions {
    pub strict: Vec<String>,
}

/// Print `.d.ts` text for `system` in open mode.
///
/// Known token categories become exported string-literal unions plus a `Tokens`
/// index. Recipes become `PascalCase(name)VariantProps` with optional axes, and
/// `PascalCase(name)CompoundVariant` when a dump row's `when` is a subset of
/// those axes. Fonts become a quoted `FontRegistry`. Color and spacing dumps
/// that declare breakpoints also print `FontProps` mixed into `StyleProps`,
/// recursive `SystemStyleObject`, plus dialect `container` / `r`. Radius keys
/// from canon print when the dump has a `radii` category. An empty font scale
/// still prints `FontRegistry {}` so the `[FontName] extends [never]` guard
/// keeps StyleProps usable. Empty token/recipe sections are omitted; an empty
/// system yields an empty string. Unknown dump token categories are skipped.
pub fn emit_dts(system: &BaseSystem) -> String {
    emit_dts_with(system, &EmitOptions::default())
}

/// Print `.d.ts` text for `system` with printer options.
///
/// Open mode (`strict` empty) matches `emit_dts`. Strict names wrap
/// `BaseSystemStyleObject` as `StrictRadiiProps<StrictColorProps<…>>` in
/// declaration order. This does not parse `ui.config.ts`.
pub fn emit_dts_with(system: &BaseSystem, options: &EmitOptions) -> String {
    emit::dts(system, options)
}

#[cfg(test)]
mod tests;
