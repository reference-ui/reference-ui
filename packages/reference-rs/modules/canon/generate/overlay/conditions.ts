/**
 * Curated named conditions, pseudo-classes, and responsive discriminators.
 * Ingests valid CSS pseudo-class/element identifiers along with Reference dialect conditions.
 * Used for type generation, editor autocomplete, and zero-allocation static lookups.
 */

export const NAMED_CONDITIONS = [
  // CSS-true pseudo-classes and pseudo-elements
  '_active', '_after', '_autofill', '_backdrop', '_before',
  '_checked', '_default', '_disabled', '_empty', '_enabled',
  '_even', '_file', '_first', '_firstOfType', '_focus', '_focusVisible',
  '_focusWithin', '_fullscreen', '_hover', '_indeterminate', '_invalid',
  '_last', '_lastOfType', '_marker', '_odd', '_only',
  '_onlyOfType', '_optional', '_placeholder', '_placeholderShown', '_readOnly',
  '_readWrite', '_required', '_selection', '_target', '_userInvalid',
  '_userValid', '_valid', '_visited',
  // Reference UI dialect extras
  '_closed', '_current', '_currentPage', '_currentStep', '_dark',
  '_dragging', '_expanded', '_grabbed', '_groupActive', '_groupChecked',
  '_groupDisabled', '_groupExpanded', '_groupFocus', '_groupFocusVisible', '_groupInvalid',
  '_groupHover', '_highContrast', '_landscape', '_lessContrast', '_light',
  '_loading', '_ltr', '_moreContrast', '_motionReduce', '_motionSafe',
  '_open', '_osDark', '_osLight', '_peerActive', '_peerChecked',
  '_peerDisabled', '_peerExpanded', '_peerFocus', '_peerFocusVisible', '_peerHover',
  '_peerInvalid', '_portrait', '_print', '_rtl', '_selected',
] as const;
