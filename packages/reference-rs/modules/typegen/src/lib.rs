//! `.d.ts` from a base system plus canon: token unions, recipe variants, font
//! registry, `StyleProps`. Input is the definition, not the atom set. Users
//! never write `.mt_2r` in these files. This is not a jsx factory and not a
//! patterns farm. Language (Rust vs TypeScript) is a later call; the *input*
//! is the base system either way.

/// Placeholder for the type printer. Real emission lands when base-system can
/// answer token names and categories.
pub fn emit_dts() -> String {
    String::new()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn scaffold_emits_no_jsx_farm() {
        assert_eq!(emit_dts(), "");
    }
}
