/** Generated. Run: node scripts/generate-primitives.cjs */

import * as React from 'react'
import { forwardRef } from 'react'
import { splitProps } from '../system/helpers.js'
import { box } from '../system/patterns/box.js'
import { styled } from '../system/jsx/index.js'
import type { PrimitiveElement, PrimitiveProps } from './types.js'

export { TAGS as HTML_TAGS, type Tag as HtmlTag } from './tags.js'
export type { PrimitiveElement, PrimitiveProps } from './types.js'

function applyBoxPattern(props: object): object {
  const [boxProps, rest] = splitProps(props, ['r', 'container'])
  const styles = box.raw(boxProps as Parameters<typeof box.raw>[0]) as object
  return { ...styles, ...(rest as object) }
}


export const A = forwardRef((props, ref) => <styled.a ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'a'> & React.RefAttributes<PrimitiveElement<'a'>>>
export const Abbr = forwardRef((props, ref) => <styled.abbr ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'abbr'> & React.RefAttributes<PrimitiveElement<'abbr'>>>
export const Address = forwardRef((props, ref) => <styled.address ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'address'> & React.RefAttributes<PrimitiveElement<'address'>>>
export const Area = forwardRef((props, ref) => <styled.area ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'area'> & React.RefAttributes<PrimitiveElement<'area'>>>
export const Article = forwardRef((props, ref) => <styled.article ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'article'> & React.RefAttributes<PrimitiveElement<'article'>>>
export const Aside = forwardRef((props, ref) => <styled.aside ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'aside'> & React.RefAttributes<PrimitiveElement<'aside'>>>
export const Audio = forwardRef((props, ref) => <styled.audio ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'audio'> & React.RefAttributes<PrimitiveElement<'audio'>>>
export const B = forwardRef((props, ref) => <styled.b ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'b'> & React.RefAttributes<PrimitiveElement<'b'>>>
export const Base = forwardRef((props, ref) => <styled.base ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'base'> & React.RefAttributes<PrimitiveElement<'base'>>>
export const Bdi = forwardRef((props, ref) => <styled.bdi ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'bdi'> & React.RefAttributes<PrimitiveElement<'bdi'>>>
export const Bdo = forwardRef((props, ref) => <styled.bdo ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'bdo'> & React.RefAttributes<PrimitiveElement<'bdo'>>>
export const Blockquote = forwardRef((props, ref) => <styled.blockquote ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'blockquote'> & React.RefAttributes<PrimitiveElement<'blockquote'>>>
export const Body = forwardRef((props, ref) => <styled.body ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'body'> & React.RefAttributes<PrimitiveElement<'body'>>>
export const Br = forwardRef((props, ref) => <styled.br ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'br'> & React.RefAttributes<PrimitiveElement<'br'>>>
export const Button = forwardRef((props, ref) => <styled.button ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'button'> & React.RefAttributes<PrimitiveElement<'button'>>>
export const Canvas = forwardRef((props, ref) => <styled.canvas ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'canvas'> & React.RefAttributes<PrimitiveElement<'canvas'>>>
export const Caption = forwardRef((props, ref) => <styled.caption ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'caption'> & React.RefAttributes<PrimitiveElement<'caption'>>>
export const Cite = forwardRef((props, ref) => <styled.cite ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'cite'> & React.RefAttributes<PrimitiveElement<'cite'>>>
export const Code = forwardRef((props, ref) => <styled.code ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'code'> & React.RefAttributes<PrimitiveElement<'code'>>>
export const Col = forwardRef((props, ref) => <styled.col ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'col'> & React.RefAttributes<PrimitiveElement<'col'>>>
export const Colgroup = forwardRef((props, ref) => <styled.colgroup ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'colgroup'> & React.RefAttributes<PrimitiveElement<'colgroup'>>>
export const Data = forwardRef((props, ref) => <styled.data ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'data'> & React.RefAttributes<PrimitiveElement<'data'>>>
export const Datalist = forwardRef((props, ref) => <styled.datalist ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'datalist'> & React.RefAttributes<PrimitiveElement<'datalist'>>>
export const Dd = forwardRef((props, ref) => <styled.dd ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'dd'> & React.RefAttributes<PrimitiveElement<'dd'>>>
export const Del = forwardRef((props, ref) => <styled.del ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'del'> & React.RefAttributes<PrimitiveElement<'del'>>>
export const Details = forwardRef((props, ref) => <styled.details ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'details'> & React.RefAttributes<PrimitiveElement<'details'>>>
export const Dfn = forwardRef((props, ref) => <styled.dfn ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'dfn'> & React.RefAttributes<PrimitiveElement<'dfn'>>>
export const Dialog = forwardRef((props, ref) => <styled.dialog ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'dialog'> & React.RefAttributes<PrimitiveElement<'dialog'>>>
export const Div = forwardRef((props, ref) => <styled.div ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'div'> & React.RefAttributes<PrimitiveElement<'div'>>>
export const Dl = forwardRef((props, ref) => <styled.dl ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'dl'> & React.RefAttributes<PrimitiveElement<'dl'>>>
export const Dt = forwardRef((props, ref) => <styled.dt ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'dt'> & React.RefAttributes<PrimitiveElement<'dt'>>>
export const Em = forwardRef((props, ref) => <styled.em ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'em'> & React.RefAttributes<PrimitiveElement<'em'>>>
export const Embed = forwardRef((props, ref) => <styled.embed ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'embed'> & React.RefAttributes<PrimitiveElement<'embed'>>>
export const Fieldset = forwardRef((props, ref) => <styled.fieldset ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'fieldset'> & React.RefAttributes<PrimitiveElement<'fieldset'>>>
export const Figcaption = forwardRef((props, ref) => <styled.figcaption ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'figcaption'> & React.RefAttributes<PrimitiveElement<'figcaption'>>>
export const Figure = forwardRef((props, ref) => <styled.figure ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'figure'> & React.RefAttributes<PrimitiveElement<'figure'>>>
export const Footer = forwardRef((props, ref) => <styled.footer ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'footer'> & React.RefAttributes<PrimitiveElement<'footer'>>>
export const Form = forwardRef((props, ref) => <styled.form ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'form'> & React.RefAttributes<PrimitiveElement<'form'>>>
export const H1 = forwardRef((props, ref) => <styled.h1 ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'h1'> & React.RefAttributes<PrimitiveElement<'h1'>>>
export const H2 = forwardRef((props, ref) => <styled.h2 ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'h2'> & React.RefAttributes<PrimitiveElement<'h2'>>>
export const H3 = forwardRef((props, ref) => <styled.h3 ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'h3'> & React.RefAttributes<PrimitiveElement<'h3'>>>
export const H4 = forwardRef((props, ref) => <styled.h4 ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'h4'> & React.RefAttributes<PrimitiveElement<'h4'>>>
export const H5 = forwardRef((props, ref) => <styled.h5 ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'h5'> & React.RefAttributes<PrimitiveElement<'h5'>>>
export const H6 = forwardRef((props, ref) => <styled.h6 ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'h6'> & React.RefAttributes<PrimitiveElement<'h6'>>>
export const Head = forwardRef((props, ref) => <styled.head ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'head'> & React.RefAttributes<PrimitiveElement<'head'>>>
export const Header = forwardRef((props, ref) => <styled.header ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'header'> & React.RefAttributes<PrimitiveElement<'header'>>>
export const Hgroup = forwardRef((props, ref) => <styled.hgroup ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'hgroup'> & React.RefAttributes<PrimitiveElement<'hgroup'>>>
export const Hr = forwardRef((props, ref) => <styled.hr ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'hr'> & React.RefAttributes<PrimitiveElement<'hr'>>>
export const Html = forwardRef((props, ref) => <styled.html ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'html'> & React.RefAttributes<PrimitiveElement<'html'>>>
export const I = forwardRef((props, ref) => <styled.i ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'i'> & React.RefAttributes<PrimitiveElement<'i'>>>
export const Iframe = forwardRef((props, ref) => <styled.iframe ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'iframe'> & React.RefAttributes<PrimitiveElement<'iframe'>>>
export const Img = forwardRef((props, ref) => <styled.img ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'img'> & React.RefAttributes<PrimitiveElement<'img'>>>
export const Input = forwardRef((props, ref) => <styled.input ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'input'> & React.RefAttributes<PrimitiveElement<'input'>>>
export const Ins = forwardRef((props, ref) => <styled.ins ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'ins'> & React.RefAttributes<PrimitiveElement<'ins'>>>
export const Kbd = forwardRef((props, ref) => <styled.kbd ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'kbd'> & React.RefAttributes<PrimitiveElement<'kbd'>>>
export const Label = forwardRef((props, ref) => <styled.label ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'label'> & React.RefAttributes<PrimitiveElement<'label'>>>
export const Legend = forwardRef((props, ref) => <styled.legend ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'legend'> & React.RefAttributes<PrimitiveElement<'legend'>>>
export const Li = forwardRef((props, ref) => <styled.li ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'li'> & React.RefAttributes<PrimitiveElement<'li'>>>
export const Link = forwardRef((props, ref) => <styled.link ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'link'> & React.RefAttributes<PrimitiveElement<'link'>>>
export const Main = forwardRef((props, ref) => <styled.main ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'main'> & React.RefAttributes<PrimitiveElement<'main'>>>
export const Map = forwardRef((props, ref) => <styled.map ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'map'> & React.RefAttributes<PrimitiveElement<'map'>>>
export const Mark = forwardRef((props, ref) => <styled.mark ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'mark'> & React.RefAttributes<PrimitiveElement<'mark'>>>
export const Menu = forwardRef((props, ref) => <styled.menu ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'menu'> & React.RefAttributes<PrimitiveElement<'menu'>>>
export const Menuitem = forwardRef((props, ref) => <styled.menuitem ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'menuitem'> & React.RefAttributes<PrimitiveElement<'menuitem'>>>
export const Meta = forwardRef((props, ref) => <styled.meta ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'meta'> & React.RefAttributes<PrimitiveElement<'meta'>>>
export const Meter = forwardRef((props, ref) => <styled.meter ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'meter'> & React.RefAttributes<PrimitiveElement<'meter'>>>
export const Nav = forwardRef((props, ref) => <styled.nav ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'nav'> & React.RefAttributes<PrimitiveElement<'nav'>>>
export const Noscript = forwardRef((props, ref) => <styled.noscript ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'noscript'> & React.RefAttributes<PrimitiveElement<'noscript'>>>
export const Obj = forwardRef((props, ref) => <styled.object ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'object'> & React.RefAttributes<PrimitiveElement<'object'>>>
export const Ol = forwardRef((props, ref) => <styled.ol ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'ol'> & React.RefAttributes<PrimitiveElement<'ol'>>>
export const Optgroup = forwardRef((props, ref) => <styled.optgroup ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'optgroup'> & React.RefAttributes<PrimitiveElement<'optgroup'>>>
export const Option = forwardRef((props, ref) => <styled.option ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'option'> & React.RefAttributes<PrimitiveElement<'option'>>>
export const Output = forwardRef((props, ref) => <styled.output ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'output'> & React.RefAttributes<PrimitiveElement<'output'>>>
export const P = forwardRef((props, ref) => <styled.p ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'p'> & React.RefAttributes<PrimitiveElement<'p'>>>
export const Param = forwardRef((props, ref) => <styled.param ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'param'> & React.RefAttributes<PrimitiveElement<'param'>>>
export const Picture = forwardRef((props, ref) => <styled.picture ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'picture'> & React.RefAttributes<PrimitiveElement<'picture'>>>
export const Pre = forwardRef((props, ref) => <styled.pre ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'pre'> & React.RefAttributes<PrimitiveElement<'pre'>>>
export const Progress = forwardRef((props, ref) => <styled.progress ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'progress'> & React.RefAttributes<PrimitiveElement<'progress'>>>
export const Q = forwardRef((props, ref) => <styled.q ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'q'> & React.RefAttributes<PrimitiveElement<'q'>>>
export const Rp = forwardRef((props, ref) => <styled.rp ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'rp'> & React.RefAttributes<PrimitiveElement<'rp'>>>
export const Rt = forwardRef((props, ref) => <styled.rt ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'rt'> & React.RefAttributes<PrimitiveElement<'rt'>>>
export const Ruby = forwardRef((props, ref) => <styled.ruby ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'ruby'> & React.RefAttributes<PrimitiveElement<'ruby'>>>
export const S = forwardRef((props, ref) => <styled.s ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'s'> & React.RefAttributes<PrimitiveElement<'s'>>>
export const Samp = forwardRef((props, ref) => <styled.samp ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'samp'> & React.RefAttributes<PrimitiveElement<'samp'>>>
export const Script = forwardRef((props, ref) => <styled.script ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'script'> & React.RefAttributes<PrimitiveElement<'script'>>>
export const Search = forwardRef((props, ref) => <styled.search ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'search'> & React.RefAttributes<PrimitiveElement<'search'>>>
export const Section = forwardRef((props, ref) => <styled.section ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'section'> & React.RefAttributes<PrimitiveElement<'section'>>>
export const Select = forwardRef((props, ref) => <styled.select ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'select'> & React.RefAttributes<PrimitiveElement<'select'>>>
export const Slot = forwardRef((props, ref) => <styled.slot ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'slot'> & React.RefAttributes<PrimitiveElement<'slot'>>>
export const Small = forwardRef((props, ref) => <styled.small ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'small'> & React.RefAttributes<PrimitiveElement<'small'>>>
export const Source = forwardRef((props, ref) => <styled.source ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'source'> & React.RefAttributes<PrimitiveElement<'source'>>>
export const Span = forwardRef((props, ref) => <styled.span ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'span'> & React.RefAttributes<PrimitiveElement<'span'>>>
export const Strong = forwardRef((props, ref) => <styled.strong ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'strong'> & React.RefAttributes<PrimitiveElement<'strong'>>>
export const Style = forwardRef((props, ref) => <styled.style ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'style'> & React.RefAttributes<PrimitiveElement<'style'>>>
export const Sub = forwardRef((props, ref) => <styled.sub ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'sub'> & React.RefAttributes<PrimitiveElement<'sub'>>>
export const Summary = forwardRef((props, ref) => <styled.summary ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'summary'> & React.RefAttributes<PrimitiveElement<'summary'>>>
export const Sup = forwardRef((props, ref) => <styled.sup ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'sup'> & React.RefAttributes<PrimitiveElement<'sup'>>>
export const Svg = forwardRef((props, ref) => <styled.svg ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'svg'> & React.RefAttributes<PrimitiveElement<'svg'>>>
export const Table = forwardRef((props, ref) => <styled.table ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'table'> & React.RefAttributes<PrimitiveElement<'table'>>>
export const Tbody = forwardRef((props, ref) => <styled.tbody ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'tbody'> & React.RefAttributes<PrimitiveElement<'tbody'>>>
export const Td = forwardRef((props, ref) => <styled.td ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'td'> & React.RefAttributes<PrimitiveElement<'td'>>>
export const Template = forwardRef((props, ref) => <styled.template ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'template'> & React.RefAttributes<PrimitiveElement<'template'>>>
export const Textarea = forwardRef((props, ref) => <styled.textarea ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'textarea'> & React.RefAttributes<PrimitiveElement<'textarea'>>>
export const Tfoot = forwardRef((props, ref) => <styled.tfoot ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'tfoot'> & React.RefAttributes<PrimitiveElement<'tfoot'>>>
export const Th = forwardRef((props, ref) => <styled.th ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'th'> & React.RefAttributes<PrimitiveElement<'th'>>>
export const Thead = forwardRef((props, ref) => <styled.thead ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'thead'> & React.RefAttributes<PrimitiveElement<'thead'>>>
export const Time = forwardRef((props, ref) => <styled.time ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'time'> & React.RefAttributes<PrimitiveElement<'time'>>>
export const Title = forwardRef((props, ref) => <styled.title ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'title'> & React.RefAttributes<PrimitiveElement<'title'>>>
export const Tr = forwardRef((props, ref) => <styled.tr ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'tr'> & React.RefAttributes<PrimitiveElement<'tr'>>>
export const Track = forwardRef((props, ref) => <styled.track ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'track'> & React.RefAttributes<PrimitiveElement<'track'>>>
export const U = forwardRef((props, ref) => <styled.u ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'u'> & React.RefAttributes<PrimitiveElement<'u'>>>
export const Ul = forwardRef((props, ref) => <styled.ul ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'ul'> & React.RefAttributes<PrimitiveElement<'ul'>>>
export const Var = forwardRef((props, ref) => <styled.var ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'var'> & React.RefAttributes<PrimitiveElement<'var'>>>
export const Video = forwardRef((props, ref) => <styled.video ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'video'> & React.RefAttributes<PrimitiveElement<'video'>>>
export const Wbr = forwardRef((props, ref) => <styled.wbr ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'wbr'> & React.RefAttributes<PrimitiveElement<'wbr'>>>