// Codes Core mints in TypeScript, the counterpart to the Rust codes.rs tables. It takes nothing and
// emits one constant per wire string plus CORE_MINTED_CODES, the list the registry self-check reads.
// A producer imports its constant from here so each wire string is spelled once, and a new
// TypeScript-minted code joins the list and gets its row in the RS REGISTRY.md.

/** A local token leaf replaces an upstream value. Namespace BSS, emitted by the collect step. */
export const TOKEN_SHADOW_CODE = 'BSS-W-TOKEN-SHADOW'

/** Evaluating ui.config, where base systems are imported, ran past the slow threshold. Namespace BSS, emitted by the config loader. */
export const SLOW_CONFIG_CODE = 'BSS-W-SLOW-CONFIG'

/** Every code this package mints in TypeScript; each must be cited in `REGISTRY.md`. */
export const CORE_MINTED_CODES: readonly string[] = [TOKEN_SHADOW_CODE, SLOW_CONFIG_CODE]
