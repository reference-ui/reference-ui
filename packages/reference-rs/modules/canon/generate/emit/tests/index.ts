/**
 * Root test code emitter for Reference UI Rust canon crate.
 * Assembles generated test stations from tag, property, condition, and join modules.
 * Emits tests.rs to verify dictionary lookups, aliases, conditions, and rejection contracts.
 */

import { emitTagTests } from './tags';
import { emitPropTests } from './props';
import { emitConditionTests } from './conditions';
import { emitJoinTests } from './join';
import { emitVendorTests } from './vendors';

export function emitTestsRs(): string {
  return `//! Unit tests verifying the canon dictionary and all lookup contracts.
//!
//! Asserts element membership, dialect alias resolution, condition matching,
//! and ensures hallucinated primitives (Box, Flex, Grid) are rejected.
// @generated

use super::*;

${emitTagTests()}

${emitPropTests()}

${emitConditionTests()}

${emitJoinTests()}

${emitVendorTests()}
`;
}
