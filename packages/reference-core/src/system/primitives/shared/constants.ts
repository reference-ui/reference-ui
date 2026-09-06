/** Replaced at packager time with the project's ui.config.name. */
export const DATA_LAYER_PLACEHOLDER = ['__REFERENCE_UI', '_LAYER_NAME__'].join('')
export const DATA_LAYER_NAME = '__REFERENCE_UI_LAYER_NAME__' as string | undefined
export const RESOLVED_DATA_LAYER_NAME = DATA_LAYER_NAME === DATA_LAYER_PLACEHOLDER ? undefined : DATA_LAYER_NAME

/**
 * DOM attribute name used to scope and activate color mode tokens.
 * Backed by the underlying theme compiler (Panda CSS `extendThemes` emits `[data-panda-theme]`).
 */
export const DATA_COLOR_MODE_ATTR = 'data-panda-theme'
