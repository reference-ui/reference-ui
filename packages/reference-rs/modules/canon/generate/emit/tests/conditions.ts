/**
 * Test code emitters for Reference UI conditions, pseudo-classes, and media queries.
 * Generates unit test assertions for grammar discriminators, underscore pseudos, and viewport guards.
 * Proves that bare CSS pseudo names and unauthorized viewport scale tokens are rejected fail-closed.
 * Consumed by emit/tests/index.ts to assemble the complete tests.rs module.
 */

export function emitCanCond01(): string {
  return `#[test]
fn can_cond_01_grammar_discriminators() {
    assert!(is_condition_prop("_hover"));
    assert!(is_condition_prop("_dark"));
    assert!(is_condition_prop("&:hover"));
    assert!(is_condition_prop("@media (min-width: 600px)"));
    assert!(!is_condition_prop("sm"));
    assert!(!is_condition_prop("md"));
    assert!(!is_condition_prop("base"));
    assert!(!is_condition_prop("hover"));
}`;
}

export function emitCanCond02(): string {
  return `#[test]
fn can_cond_02_underscore_pseudos() {
    assert!(is_condition_prop("_hover"));
    assert!(is_condition_prop("_focusVisible"));
    assert!(is_condition_prop("_dark"));
    assert!(is_condition_prop("_active"));
    assert!(is_condition_prop("_disabled"));
    assert!(is_condition_prop("_notInTheTable"));
}`;
}

export function emitCanCond03(): string {
  return `#[test]
fn can_cond_03_ampersand_and_at_prefixes() {
    assert!(is_condition_prop("&:hover"));
    assert!(is_condition_prop("& > svg"));
    assert!(is_condition_prop("@media (min-width: 600px)"));
}`;
}

export function emitCanCond04(): string {
  return `#[test]
fn can_cond_04_no_default_viewport_scale() {
    assert!(!is_condition_prop("base"));
    assert!(!is_condition_prop("sm"));
    assert!(!is_condition_prop("md"));
    assert!(!is_condition_prop("lg"));
    assert!(!is_condition_prop("xl"));
    assert!(!is_condition_prop("2xl"));
    assert!(NAMED_CONDITIONS.contains(&"_hover"));
    assert!(NAMED_CONDITIONS.contains(&"_dark"));
}`;
}

export function emitCanFail03(): string {
  return `#[test]
fn can_fail_03_bare_pseudos() {
    assert!(!is_condition_prop("hover"));
    assert!(!is_condition_prop("focus"));
    assert!(!is_condition_prop("active"));
    assert!(!is_condition_prop("sm"));
    assert!(!is_condition_prop("base"));
}`;
}

export function emitConditionTests(): string {
  return [
    emitCanCond01(),
    emitCanCond02(),
    emitCanCond03(),
    emitCanCond04(),
    emitCanFail03(),
  ].join('\n\n');
}
