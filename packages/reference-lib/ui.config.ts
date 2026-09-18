/**
 * Reference Lib - Design system consumer
 *
 * Minimal config for testing the chainable design system pattern.
 * Uses reference-core as the live config/runtime pipeline.
 */

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'reference-ui',
  include: ['src/**/*.{ts,tsx}', 'book/**/*.{ts,tsx}'],
  extends: [],
  debug: false,
  // Landing Phase C (B7): explicit host list for Neo (no PascalCase guessing).
  // Carries core's discovered local hosts VERBATIM (from the pre-switch
  // .reference-ui/system/jsx-elements.json `local` array). Styletrace cannot
  // substitute: it needs react/types/style-props declarations that exist only
  // in core's Panda typegen, so on Neo trees the traced set is always empty
  // and these explicit names are the sole compound-host source (switch-crew
  // finding 2026-09-18; revisit if styletrace-on-Neo lands).
  jsxElements: [
    'Accordion', 'Calendar', 'CalendarGrid', 'CalendarHeader', 'CalendarHeading',
    'CalendarNextButton', 'CalendarPrevButton', 'CollapsibleContent', 'CollapsibleTrigger',
    'ComboboxInput', 'ComboboxOption', 'ComboboxTrigger', 'DateField', 'DateFieldInput',
    'Field', 'ListboxEmpty', 'ListboxHeader', 'ListboxOption', 'ListboxSection',
    'MenuItem', 'MenuSeparator', 'MonoText', 'NumberField', 'NumberFieldDecrement',
    'NumberFieldIncrement', 'NumberFieldInput', 'OverlayArrow', 'OverlayBackdrop',
    'OverlayContent', 'OverlayHandle', 'OverlayTrigger', 'PopoverClose', 'Slider',
    'SliderRange', 'SliderThumb', 'SliderTrack', 'Splitter', 'SplitterHandle',
    'SplitterPanel', 'SplitterThumb', 'Switch', 'SwitchThumb', 'Tab', 'TabPanel',
    'TabsList', 'ToastDescription', 'ToastHost', 'ToastRoot', 'ToastTitle', 'Tree',
    'TreeExpander', 'TreeGroup', 'TreeItem',
  ],
})
