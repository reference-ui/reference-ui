/**
 * Curated JSX primitive DOM tags and styled SVG elements for Reference UI.
 * Ingests lowercase HTML and SVG element names supported as JSX components.
 * Serves as the authoritative source for Reference UI primitive tag definitions.
 */

export const PRIMITIVE_TAGS = [
  'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'bdi', 'bdo',
  'blockquote', 'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col',
  'colgroup', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog',
  'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure',
  'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup',
  'hr', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li',
  'main', 'map', 'mark', 'menu', 'meter', 'nav', 'object', 'ol', 'optgroup',
  'option', 'output', 'p', 'picture', 'pre', 'progress', 'q', 'rp', 'rt',
  'ruby', 's', 'samp', 'search', 'section', 'select', 'small', 'source', 'span',
  'strong', 'sub', 'summary', 'sup', 'svg', 'table', 'tbody', 'td', 'textarea',
  'tfoot', 'th', 'thead', 'time', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr',
  // Curated SVG host child elements styled by authors
  'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'text',
  'tspan', 'use', 'g', 'defs', 'clipPath', 'mask', 'linearGradient',
  'radialGradient', 'stop', 'image', 'foreignObject', 'marker', 'pattern',
  'switch', 'symbol', 'view',
] as const;
