/**
 * Heading slugs shared by the MDX heading components and the rehype pass
 * that runs at compile time. Both must agree, so the anchor a heading renders
 * matches the id the outline links to.
 */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
