/** Primitive recipes - import from css/*.style.ts and re-export for panda.config */
import { h1Style } from './css/h1.style'
import { h2Style } from './css/h2.style'
import { h3Style } from './css/h3.style'
import { h4Style } from './css/h4.style'
import { h5Style } from './css/h5.style'
import { h6Style } from './css/h6.style'
import { pStyle } from './css/p.style'
import { strongStyle } from './css/strong.style'
import { emStyle } from './css/em.style'
import { bStyle } from './css/b.style'
import { iStyle } from './css/i.style'
import { uStyle } from './css/u.style'
import { sStyle } from './css/s.style'
import { smallStyle } from './css/small.style'
import { markStyle } from './css/mark.style'
import { subStyle } from './css/sub.style'
import { supStyle } from './css/sup.style'
import { abbrStyle } from './css/abbr.style'
import { codeStyle } from './css/code.style'
import { preStyle } from './css/pre.style'
import { kbdStyle } from './css/kbd.style'
import { sampStyle } from './css/samp.style'
import { varStyle } from './css/var.style'
import { blockquoteStyle } from './css/blockquote.style'
import { qStyle } from './css/q.style'
import { citeStyle } from './css/cite.style'

export {
  h1Style, h2Style, h3Style, h4Style, h5Style, h6Style,
  pStyle, strongStyle, emStyle, bStyle, iStyle, uStyle, sStyle,
  smallStyle, markStyle, subStyle, supStyle, abbrStyle,
  codeStyle, preStyle, kbdStyle, sampStyle, varStyle,
  blockquoteStyle, qStyle, citeStyle,
}

export const primitiveCSS = {
  h1Style, h2Style, h3Style, h4Style, h5Style, h6Style,
  pStyle, strongStyle, emStyle, bStyle, iStyle, uStyle, sStyle,
  smallStyle, markStyle, subStyle, supStyle, abbrStyle,
  codeStyle, preStyle, kbdStyle, sampStyle, varStyle,
  blockquoteStyle, qStyle, citeStyle,
}
