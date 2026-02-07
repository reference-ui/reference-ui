/**
 * Reference UI Primitives (generated - do not edit)
 * Run: node scripts/generate-primitives.cjs
 *
 * styled[tag] + box pattern (r, container). Simple composition.
 */

import * as React from 'react'
import { forwardRef } from 'react'
import { splitProps } from '../system/helpers.js'
import { box } from '../system/patterns/box.js'
import { styled } from '../system/jsx/index.js'
import type { PrimitiveElement, PrimitiveProps } from './types.js'

export { TAGS as HTML_TAGS, type Tag as HtmlTag } from './tags.js'
export type { PrimitiveElement, PrimitiveProps } from './types.js'


const StyledA = styled['a']
export const A = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledA ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'a'> & React.RefAttributes<PrimitiveElement<'a'>>>

const StyledAbbr = styled['abbr']
export const Abbr = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledAbbr ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'abbr'> & React.RefAttributes<PrimitiveElement<'abbr'>>>

const StyledAddress = styled['address']
export const Address = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledAddress ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'address'> & React.RefAttributes<PrimitiveElement<'address'>>>

const StyledArea = styled['area']
export const Area = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledArea ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'area'> & React.RefAttributes<PrimitiveElement<'area'>>>

const StyledArticle = styled['article']
export const Article = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledArticle ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'article'> & React.RefAttributes<PrimitiveElement<'article'>>>

const StyledAside = styled['aside']
export const Aside = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledAside ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'aside'> & React.RefAttributes<PrimitiveElement<'aside'>>>

const StyledAudio = styled['audio']
export const Audio = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledAudio ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'audio'> & React.RefAttributes<PrimitiveElement<'audio'>>>

const StyledB = styled['b']
export const B = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledB ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'b'> & React.RefAttributes<PrimitiveElement<'b'>>>

const StyledBase = styled['base']
export const Base = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledBase ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'base'> & React.RefAttributes<PrimitiveElement<'base'>>>

const StyledBdi = styled['bdi']
export const Bdi = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledBdi ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'bdi'> & React.RefAttributes<PrimitiveElement<'bdi'>>>

const StyledBdo = styled['bdo']
export const Bdo = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledBdo ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'bdo'> & React.RefAttributes<PrimitiveElement<'bdo'>>>

const StyledBlockquote = styled['blockquote']
export const Blockquote = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledBlockquote ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'blockquote'> & React.RefAttributes<PrimitiveElement<'blockquote'>>>

const StyledBody = styled['body']
export const Body = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledBody ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'body'> & React.RefAttributes<PrimitiveElement<'body'>>>

const StyledBr = styled['br']
export const Br = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledBr ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'br'> & React.RefAttributes<PrimitiveElement<'br'>>>

const StyledButton = styled['button']
export const Button = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledButton ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'button'> & React.RefAttributes<PrimitiveElement<'button'>>>

const StyledCanvas = styled['canvas']
export const Canvas = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledCanvas ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'canvas'> & React.RefAttributes<PrimitiveElement<'canvas'>>>

const StyledCaption = styled['caption']
export const Caption = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledCaption ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'caption'> & React.RefAttributes<PrimitiveElement<'caption'>>>

const StyledCite = styled['cite']
export const Cite = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledCite ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'cite'> & React.RefAttributes<PrimitiveElement<'cite'>>>

const StyledCode = styled['code']
export const Code = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledCode ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'code'> & React.RefAttributes<PrimitiveElement<'code'>>>

const StyledCol = styled['col']
export const Col = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledCol ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'col'> & React.RefAttributes<PrimitiveElement<'col'>>>

const StyledColgroup = styled['colgroup']
export const Colgroup = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledColgroup ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'colgroup'> & React.RefAttributes<PrimitiveElement<'colgroup'>>>

const StyledData = styled['data']
export const Data = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledData ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'data'> & React.RefAttributes<PrimitiveElement<'data'>>>

const StyledDatalist = styled['datalist']
export const Datalist = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledDatalist ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'datalist'> & React.RefAttributes<PrimitiveElement<'datalist'>>>

const StyledDd = styled['dd']
export const Dd = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledDd ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'dd'> & React.RefAttributes<PrimitiveElement<'dd'>>>

const StyledDel = styled['del']
export const Del = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledDel ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'del'> & React.RefAttributes<PrimitiveElement<'del'>>>

const StyledDetails = styled['details']
export const Details = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledDetails ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'details'> & React.RefAttributes<PrimitiveElement<'details'>>>

const StyledDfn = styled['dfn']
export const Dfn = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledDfn ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'dfn'> & React.RefAttributes<PrimitiveElement<'dfn'>>>

const StyledDialog = styled['dialog']
export const Dialog = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledDialog ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'dialog'> & React.RefAttributes<PrimitiveElement<'dialog'>>>

const StyledDiv = styled['div']
export const Div = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledDiv ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'div'> & React.RefAttributes<PrimitiveElement<'div'>>>

const StyledDl = styled['dl']
export const Dl = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledDl ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'dl'> & React.RefAttributes<PrimitiveElement<'dl'>>>

const StyledDt = styled['dt']
export const Dt = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledDt ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'dt'> & React.RefAttributes<PrimitiveElement<'dt'>>>

const StyledEm = styled['em']
export const Em = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledEm ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'em'> & React.RefAttributes<PrimitiveElement<'em'>>>

const StyledEmbed = styled['embed']
export const Embed = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledEmbed ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'embed'> & React.RefAttributes<PrimitiveElement<'embed'>>>

const StyledFieldset = styled['fieldset']
export const Fieldset = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledFieldset ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'fieldset'> & React.RefAttributes<PrimitiveElement<'fieldset'>>>

const StyledFigcaption = styled['figcaption']
export const Figcaption = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledFigcaption ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'figcaption'> & React.RefAttributes<PrimitiveElement<'figcaption'>>>

const StyledFigure = styled['figure']
export const Figure = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledFigure ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'figure'> & React.RefAttributes<PrimitiveElement<'figure'>>>

const StyledFooter = styled['footer']
export const Footer = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledFooter ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'footer'> & React.RefAttributes<PrimitiveElement<'footer'>>>

const StyledForm = styled['form']
export const Form = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledForm ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'form'> & React.RefAttributes<PrimitiveElement<'form'>>>

const StyledH1 = styled['h1']
export const H1 = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledH1 ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'h1'> & React.RefAttributes<PrimitiveElement<'h1'>>>

const StyledH2 = styled['h2']
export const H2 = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledH2 ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'h2'> & React.RefAttributes<PrimitiveElement<'h2'>>>

const StyledH3 = styled['h3']
export const H3 = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledH3 ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'h3'> & React.RefAttributes<PrimitiveElement<'h3'>>>

const StyledH4 = styled['h4']
export const H4 = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledH4 ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'h4'> & React.RefAttributes<PrimitiveElement<'h4'>>>

const StyledH5 = styled['h5']
export const H5 = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledH5 ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'h5'> & React.RefAttributes<PrimitiveElement<'h5'>>>

const StyledH6 = styled['h6']
export const H6 = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledH6 ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'h6'> & React.RefAttributes<PrimitiveElement<'h6'>>>

const StyledHead = styled['head']
export const Head = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledHead ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'head'> & React.RefAttributes<PrimitiveElement<'head'>>>

const StyledHeader = styled['header']
export const Header = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledHeader ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'header'> & React.RefAttributes<PrimitiveElement<'header'>>>

const StyledHgroup = styled['hgroup']
export const Hgroup = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledHgroup ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'hgroup'> & React.RefAttributes<PrimitiveElement<'hgroup'>>>

const StyledHr = styled['hr']
export const Hr = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledHr ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'hr'> & React.RefAttributes<PrimitiveElement<'hr'>>>

const StyledHtml = styled['html']
export const Html = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledHtml ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'html'> & React.RefAttributes<PrimitiveElement<'html'>>>

const StyledI = styled['i']
export const I = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledI ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'i'> & React.RefAttributes<PrimitiveElement<'i'>>>

const StyledIframe = styled['iframe']
export const Iframe = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledIframe ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'iframe'> & React.RefAttributes<PrimitiveElement<'iframe'>>>

const StyledImg = styled['img']
export const Img = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledImg ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'img'> & React.RefAttributes<PrimitiveElement<'img'>>>

const StyledInput = styled['input']
export const Input = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledInput ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'input'> & React.RefAttributes<PrimitiveElement<'input'>>>

const StyledIns = styled['ins']
export const Ins = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledIns ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'ins'> & React.RefAttributes<PrimitiveElement<'ins'>>>

const StyledKbd = styled['kbd']
export const Kbd = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledKbd ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'kbd'> & React.RefAttributes<PrimitiveElement<'kbd'>>>

const StyledLabel = styled['label']
export const Label = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledLabel ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'label'> & React.RefAttributes<PrimitiveElement<'label'>>>

const StyledLegend = styled['legend']
export const Legend = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledLegend ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'legend'> & React.RefAttributes<PrimitiveElement<'legend'>>>

const StyledLi = styled['li']
export const Li = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledLi ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'li'> & React.RefAttributes<PrimitiveElement<'li'>>>

const StyledLink = styled['link']
export const Link = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledLink ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'link'> & React.RefAttributes<PrimitiveElement<'link'>>>

const StyledMain = styled['main']
export const Main = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledMain ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'main'> & React.RefAttributes<PrimitiveElement<'main'>>>

const StyledMap = styled['map']
export const Map = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledMap ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'map'> & React.RefAttributes<PrimitiveElement<'map'>>>

const StyledMark = styled['mark']
export const Mark = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledMark ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'mark'> & React.RefAttributes<PrimitiveElement<'mark'>>>

const StyledMenu = styled['menu']
export const Menu = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledMenu ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'menu'> & React.RefAttributes<PrimitiveElement<'menu'>>>

const StyledMenuitem = styled['menuitem']
export const Menuitem = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledMenuitem ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'menuitem'> & React.RefAttributes<PrimitiveElement<'menuitem'>>>

const StyledMeta = styled['meta']
export const Meta = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledMeta ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'meta'> & React.RefAttributes<PrimitiveElement<'meta'>>>

const StyledMeter = styled['meter']
export const Meter = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledMeter ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'meter'> & React.RefAttributes<PrimitiveElement<'meter'>>>

const StyledNav = styled['nav']
export const Nav = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledNav ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'nav'> & React.RefAttributes<PrimitiveElement<'nav'>>>

const StyledNoscript = styled['noscript']
export const Noscript = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledNoscript ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'noscript'> & React.RefAttributes<PrimitiveElement<'noscript'>>>

const StyledObj = styled['object']
export const Obj = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledObj ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'object'> & React.RefAttributes<PrimitiveElement<'object'>>>

const StyledOl = styled['ol']
export const Ol = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledOl ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'ol'> & React.RefAttributes<PrimitiveElement<'ol'>>>

const StyledOptgroup = styled['optgroup']
export const Optgroup = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledOptgroup ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'optgroup'> & React.RefAttributes<PrimitiveElement<'optgroup'>>>

const StyledOption = styled['option']
export const Option = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledOption ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'option'> & React.RefAttributes<PrimitiveElement<'option'>>>

const StyledOutput = styled['output']
export const Output = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledOutput ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'output'> & React.RefAttributes<PrimitiveElement<'output'>>>

const StyledP = styled['p']
export const P = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledP ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'p'> & React.RefAttributes<PrimitiveElement<'p'>>>

const StyledParam = styled['param']
export const Param = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledParam ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'param'> & React.RefAttributes<PrimitiveElement<'param'>>>

const StyledPicture = styled['picture']
export const Picture = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledPicture ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'picture'> & React.RefAttributes<PrimitiveElement<'picture'>>>

const StyledPre = styled['pre']
export const Pre = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledPre ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'pre'> & React.RefAttributes<PrimitiveElement<'pre'>>>

const StyledProgress = styled['progress']
export const Progress = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledProgress ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'progress'> & React.RefAttributes<PrimitiveElement<'progress'>>>

const StyledQ = styled['q']
export const Q = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledQ ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'q'> & React.RefAttributes<PrimitiveElement<'q'>>>

const StyledRp = styled['rp']
export const Rp = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledRp ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'rp'> & React.RefAttributes<PrimitiveElement<'rp'>>>

const StyledRt = styled['rt']
export const Rt = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledRt ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'rt'> & React.RefAttributes<PrimitiveElement<'rt'>>>

const StyledRuby = styled['ruby']
export const Ruby = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledRuby ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'ruby'> & React.RefAttributes<PrimitiveElement<'ruby'>>>

const StyledS = styled['s']
export const S = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledS ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'s'> & React.RefAttributes<PrimitiveElement<'s'>>>

const StyledSamp = styled['samp']
export const Samp = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledSamp ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'samp'> & React.RefAttributes<PrimitiveElement<'samp'>>>

const StyledScript = styled['script']
export const Script = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledScript ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'script'> & React.RefAttributes<PrimitiveElement<'script'>>>

const StyledSearch = styled['search']
export const Search = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledSearch ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'search'> & React.RefAttributes<PrimitiveElement<'search'>>>

const StyledSection = styled['section']
export const Section = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledSection ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'section'> & React.RefAttributes<PrimitiveElement<'section'>>>

const StyledSelect = styled['select']
export const Select = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledSelect ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'select'> & React.RefAttributes<PrimitiveElement<'select'>>>

const StyledSlot = styled['slot']
export const Slot = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledSlot ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'slot'> & React.RefAttributes<PrimitiveElement<'slot'>>>

const StyledSmall = styled['small']
export const Small = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledSmall ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'small'> & React.RefAttributes<PrimitiveElement<'small'>>>

const StyledSource = styled['source']
export const Source = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledSource ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'source'> & React.RefAttributes<PrimitiveElement<'source'>>>

const StyledSpan = styled['span']
export const Span = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledSpan ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'span'> & React.RefAttributes<PrimitiveElement<'span'>>>

const StyledStrong = styled['strong']
export const Strong = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledStrong ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'strong'> & React.RefAttributes<PrimitiveElement<'strong'>>>

const StyledStyle = styled['style']
export const Style = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledStyle ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'style'> & React.RefAttributes<PrimitiveElement<'style'>>>

const StyledSub = styled['sub']
export const Sub = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledSub ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'sub'> & React.RefAttributes<PrimitiveElement<'sub'>>>

const StyledSummary = styled['summary']
export const Summary = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledSummary ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'summary'> & React.RefAttributes<PrimitiveElement<'summary'>>>

const StyledSup = styled['sup']
export const Sup = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledSup ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'sup'> & React.RefAttributes<PrimitiveElement<'sup'>>>

const StyledSvg = styled['svg']
export const Svg = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledSvg ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'svg'> & React.RefAttributes<PrimitiveElement<'svg'>>>

const StyledTable = styled['table']
export const Table = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledTable ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'table'> & React.RefAttributes<PrimitiveElement<'table'>>>

const StyledTbody = styled['tbody']
export const Tbody = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledTbody ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'tbody'> & React.RefAttributes<PrimitiveElement<'tbody'>>>

const StyledTd = styled['td']
export const Td = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledTd ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'td'> & React.RefAttributes<PrimitiveElement<'td'>>>

const StyledTemplate = styled['template']
export const Template = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledTemplate ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'template'> & React.RefAttributes<PrimitiveElement<'template'>>>

const StyledTextarea = styled['textarea']
export const Textarea = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledTextarea ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'textarea'> & React.RefAttributes<PrimitiveElement<'textarea'>>>

const StyledTfoot = styled['tfoot']
export const Tfoot = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledTfoot ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'tfoot'> & React.RefAttributes<PrimitiveElement<'tfoot'>>>

const StyledTh = styled['th']
export const Th = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledTh ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'th'> & React.RefAttributes<PrimitiveElement<'th'>>>

const StyledThead = styled['thead']
export const Thead = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledThead ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'thead'> & React.RefAttributes<PrimitiveElement<'thead'>>>

const StyledTime = styled['time']
export const Time = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledTime ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'time'> & React.RefAttributes<PrimitiveElement<'time'>>>

const StyledTitle = styled['title']
export const Title = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledTitle ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'title'> & React.RefAttributes<PrimitiveElement<'title'>>>

const StyledTr = styled['tr']
export const Tr = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledTr ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'tr'> & React.RefAttributes<PrimitiveElement<'tr'>>>

const StyledTrack = styled['track']
export const Track = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledTrack ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'track'> & React.RefAttributes<PrimitiveElement<'track'>>>

const StyledU = styled['u']
export const U = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledU ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'u'> & React.RefAttributes<PrimitiveElement<'u'>>>

const StyledUl = styled['ul']
export const Ul = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledUl ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'ul'> & React.RefAttributes<PrimitiveElement<'ul'>>>

const StyledVar = styled['var']
export const Var = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledVar ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'var'> & React.RefAttributes<PrimitiveElement<'var'>>>

const StyledVideo = styled['video']
export const Video = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledVideo ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'video'> & React.RefAttributes<PrimitiveElement<'video'>>>

const StyledWbr = styled['wbr']
export const Wbr = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledWbr ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'wbr'> & React.RefAttributes<PrimitiveElement<'wbr'>>>
