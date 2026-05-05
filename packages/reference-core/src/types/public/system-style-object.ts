import type { SystemStyleObject as StyledSystemStyleObject } from '@reference-ui/styled/types'

/**
 * Reference UI's authored style object.
 *
 * This source defaults to an identity over Panda's style object. The `ref sync`
 * packager rewrites this declaration in the consumer's generated
 * `@reference-ui/types` package to wrap it with the strict-token utilities
 * declared in `ui.config.ts` (`strict: ['colors', 'radii', ...]`). When `strict`
 * is omitted or empty, the wrapping is skipped and this identity definition is
 * what consumers see.
 *
 * Do not author the strict wrapping here — it is generated.
 */
export type SystemStyleObject = StyledSystemStyleObject
