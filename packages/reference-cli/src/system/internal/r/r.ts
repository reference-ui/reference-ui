/**
 * Responsive container query prop (r).
 * Pattern extension removed (extendPattern collector removed; see system/fragments.md).
 * Will be restored when single-run multi-collector fragment pipeline is in place.
 */

export interface ResponsiveProp {
  r?: {
    [breakpoint: number]: Record<string, unknown>
  }
}
