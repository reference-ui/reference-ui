/**
 * Root test code emitter for Reference UI Rust canon modules.
 * Assembles unit test assertions from specialized tag and property test generators.
 * Emits tests.rs inside the canon crate to verify elements, styles, aliases, conditions, and fail-closed gates.
 * Ensures the emitted Rust test suite provides 100% test coverage matching SPEC.md.
 */

import {
  emitHallucinatedPrimitiveTests,
  emitLowercaseHtmlTagTests,
  emitReactSvgTagTests,
  emitRealPrimitiveTests,
} from './emitters-tests-tags';
import {
  emitAliasResolutionTests,
  emitColorPropTests,
  emitKnownStylePropTests,
  emitPropertyConversionTests,
  emitReferenceExtensionTests,
  emitShorthandDecompositionTests,
} from './emitters-tests-props';

function emitConditionAndBreakpointTests(): string {
  return `#[test]
fn test_conditions_and_breakpoints() {
    assert!(is_condition_prop("base"));
    assert!(is_condition_prop("sm"));
    assert!(is_condition_prop("md"));
    assert!(is_condition_prop("lg"));
    assert!(is_condition_prop("xl"));
    assert!(is_condition_prop("2xl"));

    assert!(is_condition_prop("_hover"));
    assert!(is_condition_prop("_focusVisible"));
    assert!(is_condition_prop("_dark"));
    assert!(is_condition_prop("_active"));
    assert!(is_condition_prop("_disabled"));
    assert!(is_condition_prop("&:hover"));
    assert!(is_condition_prop("& > svg"));
    assert!(is_condition_prop("@media (min-width: 600px)"));

    assert!(!is_condition_prop("hover"));
    assert!(!is_condition_prop("focus"));
    assert!(!is_condition_prop("active"));
}

#[test]
fn test_default_breakpoint_for_index() {
    assert_eq!(default_breakpoint_for_index(0), Some("base"));
    assert_eq!(default_breakpoint_for_index(1), Some("sm"));
    assert_eq!(default_breakpoint_for_index(2), Some("md"));
    assert_eq!(default_breakpoint_for_index(3), Some("lg"));
    assert_eq!(default_breakpoint_for_index(4), Some("xl"));
    assert_eq!(default_breakpoint_for_index(5), Some("2xl"));
    assert_eq!(default_breakpoint_for_index(6), None);
    assert_eq!(default_breakpoint_for_index(usize::MAX), None);
}`;
}

function emitTableIntegrityTests(): string {
  return `#[test]
fn test_slices_are_sorted() {
    assert!(ELEMENTS.windows(2).all(|w| w[0].html < w[1].html));
    assert!(PRIMITIVE_JSX.windows(2).all(|w| w[0] < w[1]));
    assert!(CANONICAL_PROPERTIES.windows(2).all(|w| w[0].name < w[1].name));
    assert!(ALIASES.windows(2).all(|w| w[0].alias < w[1].alias));
    assert!(REFERENCE_PROPS.windows(2).all(|w| w[0] < w[1]));
    assert!(CONDITIONS.windows(2).all(|w| w[0] < w[1]));
    assert!(COLOR_PROPERTIES.windows(2).all(|w| w[0] < w[1]));

    for el in ELEMENTS {
        assert!(
            is_primitive_jsx_name(el.jsx),
            "JSX primitive name '{}' must be found by is_primitive_jsx_name",
            el.jsx
        );
    }
}`;
}

export function emitTestsRs(): string {
  return `//! Unit tests verifying the canon dictionary and all lookup contracts.
//!
//! Asserts element membership, dialect alias resolution, condition matching,
//! and ensures hallucinated primitives (Box, Flex, Grid) are rejected.
// @generated

use super::*;

${emitRealPrimitiveTests()}

${emitLowercaseHtmlTagTests()}

${emitReactSvgTagTests()}

${emitHallucinatedPrimitiveTests()}

${emitKnownStylePropTests()}

${emitReferenceExtensionTests()}

${emitColorPropTests()}

${emitAliasResolutionTests()}

${emitPropertyConversionTests()}

${emitShorthandDecompositionTests()}

${emitConditionAndBreakpointTests()}

${emitTableIntegrityTests()}
`;
}
