//! Baked `--spacing-root` default for every compiled stylesheet.
//! Takes nothing and emits one top-level `@layer root` block defining the
//! rhythm root at the HQ-ruled value, so rhythm rules can never dangle on an
//! undefined variable. The block prints before the package wrap (never inside
//! it), making `root` the lowest-precedence layer in any composition: any
//! author `:root` definition, in any package layer or unlayered consumer CSS,
//! wins over the baked default by cascade rank.

/// HQ ruling 2026-09-27 (OPERATION CONTINUITY-01): the compiler auto-defines
/// this value; an author definition always wins. Mirrors the lib theme root
/// (`packages/reference-lib/src/core/theme/global.ts`); the two move together.
pub const SPACING_ROOT_DEFAULT: &str = "0.25rem";

/// The baked default block, verbatim. Single-line rule matches the global
/// walker's declaration shape (`:root { --spacing-root: 0.25rem }`).
pub const ROOT_DEFAULT_BLOCK: &str =
    "@layer root {\n  :root { --spacing-root: 0.25rem }\n}\n";

/// Append the baked default block. Unconditional by ruling: zero-rhythm
/// sheets carry it too, so no sheet can dangle a rhythm rule.
pub fn append_root_default(out: &mut String) {
    out.push_str(ROOT_DEFAULT_BLOCK);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_root_default_block_shape() {
        let mut out = String::new();
        append_root_default(&mut out);
        assert_eq!(
            out,
            "@layer root {\n  :root { --spacing-root: 0.25rem }\n}\n"
        );
        assert!(out.starts_with("@layer root {\n"));
        assert!(out.ends_with("}\n"));
    }

    #[test]
    fn test_root_default_value_matches_const() {
        assert!(ROOT_DEFAULT_BLOCK.contains(SPACING_ROOT_DEFAULT));
    }
}
