/**
 * Style-object types for the primitives runtime below the cut.
 * Neo's trio imports these aliases from the style runtime (`runtime/css/css.ts`),
 * which never crosses the cut — so the RS home declares the same two structural
 * shapes locally. The factory's css seam and the splitter's buckets type against
 * these; the aliases are identical by construction, never a parallel vocabulary.
 */
export type SystemStyleObject = Record<string, unknown>

/** One css() input: a style object, a list of them, or a conditional skip. */
export type CssStyles = SystemStyleObject | undefined | null | false
