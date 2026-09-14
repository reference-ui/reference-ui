//! The design-system definition Rust consumes after TypeScript has already
//! evaluated `tokens()` / `font()` / `keyframes()` / `globalCss()` (+ declared
//! recipes) and dumped the objects. This crate does not run author modules.
//! Atomic asks it whether a name is a token and what CSS to emit; typegen asks
//! the same questions for unions. `ui.config.ts` already `extends` / `layers`
//! this artefact.

/// Portable definition of one package's design system.
///
/// Fragments in `reference-core` produce this. The engine and typegen only
/// read it. `compile()` does not take one yet — that is the missing contract.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct BaseSystem {
    pub name: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_definition_is_unnamed() {
        let system = BaseSystem::default();
        assert!(system.name.is_empty());
    }
}
