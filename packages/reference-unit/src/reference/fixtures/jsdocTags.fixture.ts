export interface ReferenceJsDocTagFixture {
  /**
   * Produces a preview label for the current value.
   *
   * @param value - Raw value that should be formatted.
   * @returns Preview label text.
   * @deprecated Use `renderLabel` instead.
   * @see renderLabel
   * @example formatPreview('demo')
   */
  formatPreview?: (value: string) => string

  /**
   * Renders the final label shown to the user.
   *
   * @param value - Final label value.
   * @remarks The browser should show arbitrary non-param tags too.
   */
  renderLabel?: (value: string) => string
}
