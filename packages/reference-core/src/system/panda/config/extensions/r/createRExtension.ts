/**
 * Responsive container query prop (`r`) for the box pattern.
 *
 * The `r` prop accepts either:
 * - a numeric breakpoint key in pixels: `r={{ 768: { padding: '4' } }}`
 * - a named breakpoint key from `tokens({ breakpoints: ... })`:
 *   `r={{ md: { padding: '4' } }}`
 *
 * Named keys are resolved at config-build time against a breakpoint table
 * derived from the user's `tokens({ breakpoints })` fragments. Unknown names
 * throw a build-time error (Panda will surface the error during config load).
 *
 * The transform body is rebuilt by `extendPatterns()` via `transform.toString()`
 * so closures don't survive — the breakpoint table must be inlined as a literal
 * inside the function body. We construct the function with `new Function` and
 * embed the table as a JSON literal.
 */

import type { BoxPatternExtension } from '../../../../api/patterns'

export interface ResponsiveProp {
  r?: {
    [breakpoint: string]: Record<string, unknown>
  }
}

/**
 * Build the box-pattern `r` extension with a breakpoint name → pixel-width
 * lookup table baked into the transform body. Pixel widths must be plain
 * numeric strings (no units).
 */
export function createRExtension(
  breakpoints: Record<string, string>
): BoxPatternExtension {
  const tableLiteral = JSON.stringify(breakpoints)

  const transformBody = `
    var BREAKPOINT_TABLE = ${tableLiteral};
    var r = props.r;
    var container = props.container;
    if (!r) return {};
    var containerName = (typeof container === 'string' && container.length > 0) ? container : undefined;
    var prefix = containerName
      ? '@container ' + containerName + ' (min-width:'
      : '@container (min-width:';
    var entries = Object.entries(r);
    var out = {};
    for (var i = 0; i < entries.length; i++) {
      var bp = entries[i][0];
      var styles = entries[i][1];
      var width;
      var num = Number(bp);
      if (Number.isFinite(num) && bp !== '' && bp !== null) {
        width = String(num);
      } else if (Object.prototype.hasOwnProperty.call(BREAKPOINT_TABLE, bp)) {
        width = BREAKPOINT_TABLE[bp];
      } else {
        throw new Error(
          '[reference-ui] Unknown breakpoint name in r prop: "' + bp + '". ' +
          'Add it via tokens({ breakpoints: { ' + bp + ': { value: "<width>px" } } }).'
        );
      }
      out[prefix + ' ' + width + 'px)'] = styles;
    }
    return out;
  `

  const transform = new Function('props', transformBody) as (
    props: Record<string, unknown>
  ) => Record<string, unknown>

  return {
    properties: {
      r: { type: 'object' },
    },
    transform,
  }
}
