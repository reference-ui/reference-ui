import type { ConditionalValue } from '../system/styled/types'

/**
 * Values for style-related props: plain `T` or the backend’s conditional form
 * (responsive / condition keys), aligned with the active style system.
 *
 * Public name for app code; resolves to the styled-system `ConditionalValue`.
 */
export type StylePropValue<T> = ConditionalValue<T>
