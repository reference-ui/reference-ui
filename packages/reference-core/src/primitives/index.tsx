/** Generated. Run: node scripts/generate-primitives.cjs */

import * as React from 'react'
import { forwardRef } from 'react'
import { splitProps } from '../system/helpers.js'
import { cx } from '../system/css/index.js'
import { box } from '../system/patterns/box.js'
import { styled } from '../system/jsx/index.js'
import type { PrimitiveElement, PrimitiveProps } from './types'

import { h1 } from '../system/recipes'

export { TAGS as HTML_TAGS, type Tag as HtmlTag } from './tags'
export type { PrimitiveElement, PrimitiveProps } from './types'

/** Apply box pattern. When tag has a matching recipe, applies that recipe's static className (user css prop still overrides). */
function applyBoxPattern(props: object, recipeClassName?: string): object {
  const [boxProps, rest] = splitProps(props, ['r', 'container'])
  const { className, ...restProps } = rest as Record<string, unknown>
  return {
    ...(box.raw(boxProps as Parameters<typeof box.raw>[0]) as object),
    ...restProps,
    className: cx(recipeClassName, className as string | undefined),
  }
}


export type AProps = PrimitiveProps<'a'>
export type AbbrProps = PrimitiveProps<'abbr'>
export type AddressProps = PrimitiveProps<'address'>
export type AreaProps = PrimitiveProps<'area'>
export type ArticleProps = PrimitiveProps<'article'>
export type AsideProps = PrimitiveProps<'aside'>
export type AudioProps = PrimitiveProps<'audio'>
export type BProps = PrimitiveProps<'b'>
export type BdiProps = PrimitiveProps<'bdi'>
export type BdoProps = PrimitiveProps<'bdo'>
export type BlockquoteProps = PrimitiveProps<'blockquote'>
export type BrProps = PrimitiveProps<'br'>
export type ButtonProps = PrimitiveProps<'button'>
export type CanvasProps = PrimitiveProps<'canvas'>
export type CaptionProps = PrimitiveProps<'caption'>
export type CiteProps = PrimitiveProps<'cite'>
export type CodeProps = PrimitiveProps<'code'>
export type ColProps = PrimitiveProps<'col'>
export type ColgroupProps = PrimitiveProps<'colgroup'>
export type DataProps = PrimitiveProps<'data'>
export type DatalistProps = PrimitiveProps<'datalist'>
export type DdProps = PrimitiveProps<'dd'>
export type DelProps = PrimitiveProps<'del'>
export type DetailsProps = PrimitiveProps<'details'>
export type DfnProps = PrimitiveProps<'dfn'>
export type DialogProps = PrimitiveProps<'dialog'>
export type DivProps = PrimitiveProps<'div'>
export type DlProps = PrimitiveProps<'dl'>
export type DtProps = PrimitiveProps<'dt'>
export type EmProps = PrimitiveProps<'em'>
export type EmbedProps = PrimitiveProps<'embed'>
export type FieldsetProps = PrimitiveProps<'fieldset'>
export type FigcaptionProps = PrimitiveProps<'figcaption'>
export type FigureProps = PrimitiveProps<'figure'>
export type FooterProps = PrimitiveProps<'footer'>
export type FormProps = PrimitiveProps<'form'>
export type H1Props = PrimitiveProps<'h1'>
export type H2Props = PrimitiveProps<'h2'>
export type H3Props = PrimitiveProps<'h3'>
export type H4Props = PrimitiveProps<'h4'>
export type H5Props = PrimitiveProps<'h5'>
export type H6Props = PrimitiveProps<'h6'>
export type HeaderProps = PrimitiveProps<'header'>
export type HgroupProps = PrimitiveProps<'hgroup'>
export type HrProps = PrimitiveProps<'hr'>
export type IProps = PrimitiveProps<'i'>
export type IframeProps = PrimitiveProps<'iframe'>
export type ImgProps = PrimitiveProps<'img'>
export type InputProps = PrimitiveProps<'input'>
export type InsProps = PrimitiveProps<'ins'>
export type KbdProps = PrimitiveProps<'kbd'>
export type LabelProps = PrimitiveProps<'label'>
export type LegendProps = PrimitiveProps<'legend'>
export type LiProps = PrimitiveProps<'li'>
export type MainProps = PrimitiveProps<'main'>
export type MapProps = PrimitiveProps<'map'>
export type MarkProps = PrimitiveProps<'mark'>
export type MenuProps = PrimitiveProps<'menu'>
export type MeterProps = PrimitiveProps<'meter'>
export type NavProps = PrimitiveProps<'nav'>
export type ObjProps = PrimitiveProps<'object'>
export type OlProps = PrimitiveProps<'ol'>
export type OptgroupProps = PrimitiveProps<'optgroup'>
export type OptionProps = PrimitiveProps<'option'>
export type OutputProps = PrimitiveProps<'output'>
export type PProps = PrimitiveProps<'p'>
export type PictureProps = PrimitiveProps<'picture'>
export type PreProps = PrimitiveProps<'pre'>
export type ProgressProps = PrimitiveProps<'progress'>
export type QProps = PrimitiveProps<'q'>
export type RpProps = PrimitiveProps<'rp'>
export type RtProps = PrimitiveProps<'rt'>
export type RubyProps = PrimitiveProps<'ruby'>
export type SProps = PrimitiveProps<'s'>
export type SampProps = PrimitiveProps<'samp'>
export type SearchProps = PrimitiveProps<'search'>
export type SectionProps = PrimitiveProps<'section'>
export type SelectProps = PrimitiveProps<'select'>
export type SmallProps = PrimitiveProps<'small'>
export type SourceProps = PrimitiveProps<'source'>
export type SpanProps = PrimitiveProps<'span'>
export type StrongProps = PrimitiveProps<'strong'>
export type SubProps = PrimitiveProps<'sub'>
export type SummaryProps = PrimitiveProps<'summary'>
export type SupProps = PrimitiveProps<'sup'>
export type SvgProps = PrimitiveProps<'svg'>
export type TableProps = PrimitiveProps<'table'>
export type TbodyProps = PrimitiveProps<'tbody'>
export type TdProps = PrimitiveProps<'td'>
export type TextareaProps = PrimitiveProps<'textarea'>
export type TfootProps = PrimitiveProps<'tfoot'>
export type ThProps = PrimitiveProps<'th'>
export type TheadProps = PrimitiveProps<'thead'>
export type TimeProps = PrimitiveProps<'time'>
export type TrProps = PrimitiveProps<'tr'>
export type TrackProps = PrimitiveProps<'track'>
export type UProps = PrimitiveProps<'u'>
export type UlProps = PrimitiveProps<'ul'>
export type VarProps = PrimitiveProps<'var'>
export type VideoProps = PrimitiveProps<'video'>
export type WbrProps = PrimitiveProps<'wbr'>

export const A = forwardRef<PrimitiveElement<'a'>, PrimitiveProps<'a'>>((props, ref) => <styled.a ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'a'> & React.RefAttributes<PrimitiveElement<'a'>>>
export const Abbr = forwardRef<PrimitiveElement<'abbr'>, PrimitiveProps<'abbr'>>((props, ref) => <styled.abbr ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'abbr'> & React.RefAttributes<PrimitiveElement<'abbr'>>>
export const Address = forwardRef<PrimitiveElement<'address'>, PrimitiveProps<'address'>>((props, ref) => <styled.address ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'address'> & React.RefAttributes<PrimitiveElement<'address'>>>
export const Area = forwardRef<PrimitiveElement<'area'>, PrimitiveProps<'area'>>((props, ref) => <styled.area ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'area'> & React.RefAttributes<PrimitiveElement<'area'>>>
export const Article = forwardRef<PrimitiveElement<'article'>, PrimitiveProps<'article'>>((props, ref) => <styled.article ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'article'> & React.RefAttributes<PrimitiveElement<'article'>>>
export const Aside = forwardRef<PrimitiveElement<'aside'>, PrimitiveProps<'aside'>>((props, ref) => <styled.aside ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'aside'> & React.RefAttributes<PrimitiveElement<'aside'>>>
export const Audio = forwardRef<PrimitiveElement<'audio'>, PrimitiveProps<'audio'>>((props, ref) => <styled.audio ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'audio'> & React.RefAttributes<PrimitiveElement<'audio'>>>
export const B = forwardRef<PrimitiveElement<'b'>, PrimitiveProps<'b'>>((props, ref) => <styled.b ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'b'> & React.RefAttributes<PrimitiveElement<'b'>>>
export const Bdi = forwardRef<PrimitiveElement<'bdi'>, PrimitiveProps<'bdi'>>((props, ref) => <styled.bdi ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'bdi'> & React.RefAttributes<PrimitiveElement<'bdi'>>>
export const Bdo = forwardRef<PrimitiveElement<'bdo'>, PrimitiveProps<'bdo'>>((props, ref) => <styled.bdo ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'bdo'> & React.RefAttributes<PrimitiveElement<'bdo'>>>
export const Blockquote = forwardRef<PrimitiveElement<'blockquote'>, PrimitiveProps<'blockquote'>>((props, ref) => <styled.blockquote ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'blockquote'> & React.RefAttributes<PrimitiveElement<'blockquote'>>>
export const Br = forwardRef<PrimitiveElement<'br'>, PrimitiveProps<'br'>>((props, ref) => <styled.br ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'br'> & React.RefAttributes<PrimitiveElement<'br'>>>
export const Button = forwardRef<PrimitiveElement<'button'>, PrimitiveProps<'button'>>((props, ref) => <styled.button ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'button'> & React.RefAttributes<PrimitiveElement<'button'>>>
export const Canvas = forwardRef<PrimitiveElement<'canvas'>, PrimitiveProps<'canvas'>>((props, ref) => <styled.canvas ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'canvas'> & React.RefAttributes<PrimitiveElement<'canvas'>>>
export const Caption = forwardRef<PrimitiveElement<'caption'>, PrimitiveProps<'caption'>>((props, ref) => <styled.caption ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'caption'> & React.RefAttributes<PrimitiveElement<'caption'>>>
export const Cite = forwardRef<PrimitiveElement<'cite'>, PrimitiveProps<'cite'>>((props, ref) => <styled.cite ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'cite'> & React.RefAttributes<PrimitiveElement<'cite'>>>
export const Code = forwardRef<PrimitiveElement<'code'>, PrimitiveProps<'code'>>((props, ref) => <styled.code ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'code'> & React.RefAttributes<PrimitiveElement<'code'>>>
export const Col = forwardRef<PrimitiveElement<'col'>, PrimitiveProps<'col'>>((props, ref) => <styled.col ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'col'> & React.RefAttributes<PrimitiveElement<'col'>>>
export const Colgroup = forwardRef<PrimitiveElement<'colgroup'>, PrimitiveProps<'colgroup'>>((props, ref) => <styled.colgroup ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'colgroup'> & React.RefAttributes<PrimitiveElement<'colgroup'>>>
export const Data = forwardRef<PrimitiveElement<'data'>, PrimitiveProps<'data'>>((props, ref) => <styled.data ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'data'> & React.RefAttributes<PrimitiveElement<'data'>>>
export const Datalist = forwardRef<PrimitiveElement<'datalist'>, PrimitiveProps<'datalist'>>((props, ref) => <styled.datalist ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'datalist'> & React.RefAttributes<PrimitiveElement<'datalist'>>>
export const Dd = forwardRef<PrimitiveElement<'dd'>, PrimitiveProps<'dd'>>((props, ref) => <styled.dd ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'dd'> & React.RefAttributes<PrimitiveElement<'dd'>>>
export const Del = forwardRef<PrimitiveElement<'del'>, PrimitiveProps<'del'>>((props, ref) => <styled.del ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'del'> & React.RefAttributes<PrimitiveElement<'del'>>>
export const Details = forwardRef<PrimitiveElement<'details'>, PrimitiveProps<'details'>>((props, ref) => <styled.details ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'details'> & React.RefAttributes<PrimitiveElement<'details'>>>
export const Dfn = forwardRef<PrimitiveElement<'dfn'>, PrimitiveProps<'dfn'>>((props, ref) => <styled.dfn ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'dfn'> & React.RefAttributes<PrimitiveElement<'dfn'>>>
export const Dialog = forwardRef<PrimitiveElement<'dialog'>, PrimitiveProps<'dialog'>>((props, ref) => <styled.dialog ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'dialog'> & React.RefAttributes<PrimitiveElement<'dialog'>>>
export const Div = forwardRef<PrimitiveElement<'div'>, PrimitiveProps<'div'>>((props, ref) => <styled.div ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'div'> & React.RefAttributes<PrimitiveElement<'div'>>>
export const Dl = forwardRef<PrimitiveElement<'dl'>, PrimitiveProps<'dl'>>((props, ref) => <styled.dl ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'dl'> & React.RefAttributes<PrimitiveElement<'dl'>>>
export const Dt = forwardRef<PrimitiveElement<'dt'>, PrimitiveProps<'dt'>>((props, ref) => <styled.dt ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'dt'> & React.RefAttributes<PrimitiveElement<'dt'>>>
export const Em = forwardRef<PrimitiveElement<'em'>, PrimitiveProps<'em'>>((props, ref) => <styled.em ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'em'> & React.RefAttributes<PrimitiveElement<'em'>>>
export const Embed = forwardRef<PrimitiveElement<'embed'>, PrimitiveProps<'embed'>>((props, ref) => <styled.embed ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'embed'> & React.RefAttributes<PrimitiveElement<'embed'>>>
export const Fieldset = forwardRef<PrimitiveElement<'fieldset'>, PrimitiveProps<'fieldset'>>((props, ref) => <styled.fieldset ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'fieldset'> & React.RefAttributes<PrimitiveElement<'fieldset'>>>
export const Figcaption = forwardRef<PrimitiveElement<'figcaption'>, PrimitiveProps<'figcaption'>>((props, ref) => <styled.figcaption ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'figcaption'> & React.RefAttributes<PrimitiveElement<'figcaption'>>>
export const Figure = forwardRef<PrimitiveElement<'figure'>, PrimitiveProps<'figure'>>((props, ref) => <styled.figure ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'figure'> & React.RefAttributes<PrimitiveElement<'figure'>>>
export const Footer = forwardRef<PrimitiveElement<'footer'>, PrimitiveProps<'footer'>>((props, ref) => <styled.footer ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'footer'> & React.RefAttributes<PrimitiveElement<'footer'>>>
export const Form = forwardRef<PrimitiveElement<'form'>, PrimitiveProps<'form'>>((props, ref) => <styled.form ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'form'> & React.RefAttributes<PrimitiveElement<'form'>>>
export const H1 = forwardRef<PrimitiveElement<'h1'>, PrimitiveProps<'h1'>>((props, ref) => <styled.h1 ref={ref} {...applyBoxPattern(props, h1())} />) as React.ForwardRefExoticComponent<PrimitiveProps<'h1'> & React.RefAttributes<PrimitiveElement<'h1'>>>
export const H2 = forwardRef<PrimitiveElement<'h2'>, PrimitiveProps<'h2'>>((props, ref) => <styled.h2 ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'h2'> & React.RefAttributes<PrimitiveElement<'h2'>>>
export const H3 = forwardRef<PrimitiveElement<'h3'>, PrimitiveProps<'h3'>>((props, ref) => <styled.h3 ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'h3'> & React.RefAttributes<PrimitiveElement<'h3'>>>
export const H4 = forwardRef<PrimitiveElement<'h4'>, PrimitiveProps<'h4'>>((props, ref) => <styled.h4 ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'h4'> & React.RefAttributes<PrimitiveElement<'h4'>>>
export const H5 = forwardRef<PrimitiveElement<'h5'>, PrimitiveProps<'h5'>>((props, ref) => <styled.h5 ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'h5'> & React.RefAttributes<PrimitiveElement<'h5'>>>
export const H6 = forwardRef<PrimitiveElement<'h6'>, PrimitiveProps<'h6'>>((props, ref) => <styled.h6 ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'h6'> & React.RefAttributes<PrimitiveElement<'h6'>>>
export const Header = forwardRef<PrimitiveElement<'header'>, PrimitiveProps<'header'>>((props, ref) => <styled.header ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'header'> & React.RefAttributes<PrimitiveElement<'header'>>>
export const Hgroup = forwardRef<PrimitiveElement<'hgroup'>, PrimitiveProps<'hgroup'>>((props, ref) => <styled.hgroup ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'hgroup'> & React.RefAttributes<PrimitiveElement<'hgroup'>>>
export const Hr = forwardRef<PrimitiveElement<'hr'>, PrimitiveProps<'hr'>>((props, ref) => <styled.hr ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'hr'> & React.RefAttributes<PrimitiveElement<'hr'>>>
export const I = forwardRef<PrimitiveElement<'i'>, PrimitiveProps<'i'>>((props, ref) => <styled.i ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'i'> & React.RefAttributes<PrimitiveElement<'i'>>>
export const Iframe = forwardRef<PrimitiveElement<'iframe'>, PrimitiveProps<'iframe'>>((props, ref) => <styled.iframe ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'iframe'> & React.RefAttributes<PrimitiveElement<'iframe'>>>
export const Img = forwardRef<PrimitiveElement<'img'>, PrimitiveProps<'img'>>((props, ref) => <styled.img ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'img'> & React.RefAttributes<PrimitiveElement<'img'>>>
export const Input = forwardRef<PrimitiveElement<'input'>, PrimitiveProps<'input'>>((props, ref) => <styled.input ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'input'> & React.RefAttributes<PrimitiveElement<'input'>>>
export const Ins = forwardRef<PrimitiveElement<'ins'>, PrimitiveProps<'ins'>>((props, ref) => <styled.ins ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'ins'> & React.RefAttributes<PrimitiveElement<'ins'>>>
export const Kbd = forwardRef<PrimitiveElement<'kbd'>, PrimitiveProps<'kbd'>>((props, ref) => <styled.kbd ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'kbd'> & React.RefAttributes<PrimitiveElement<'kbd'>>>
export const Label = forwardRef<PrimitiveElement<'label'>, PrimitiveProps<'label'>>((props, ref) => <styled.label ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'label'> & React.RefAttributes<PrimitiveElement<'label'>>>
export const Legend = forwardRef<PrimitiveElement<'legend'>, PrimitiveProps<'legend'>>((props, ref) => <styled.legend ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'legend'> & React.RefAttributes<PrimitiveElement<'legend'>>>
export const Li = forwardRef<PrimitiveElement<'li'>, PrimitiveProps<'li'>>((props, ref) => <styled.li ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'li'> & React.RefAttributes<PrimitiveElement<'li'>>>
export const Main = forwardRef<PrimitiveElement<'main'>, PrimitiveProps<'main'>>((props, ref) => <styled.main ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'main'> & React.RefAttributes<PrimitiveElement<'main'>>>
export const Map = forwardRef<PrimitiveElement<'map'>, PrimitiveProps<'map'>>((props, ref) => <styled.map ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'map'> & React.RefAttributes<PrimitiveElement<'map'>>>
export const Mark = forwardRef<PrimitiveElement<'mark'>, PrimitiveProps<'mark'>>((props, ref) => <styled.mark ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'mark'> & React.RefAttributes<PrimitiveElement<'mark'>>>
export const Menu = forwardRef<PrimitiveElement<'menu'>, PrimitiveProps<'menu'>>((props, ref) => <styled.menu ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'menu'> & React.RefAttributes<PrimitiveElement<'menu'>>>
export const Meter = forwardRef<PrimitiveElement<'meter'>, PrimitiveProps<'meter'>>((props, ref) => <styled.meter ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'meter'> & React.RefAttributes<PrimitiveElement<'meter'>>>
export const Nav = forwardRef<PrimitiveElement<'nav'>, PrimitiveProps<'nav'>>((props, ref) => <styled.nav ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'nav'> & React.RefAttributes<PrimitiveElement<'nav'>>>
export const Obj = forwardRef<PrimitiveElement<'object'>, PrimitiveProps<'object'>>((props, ref) => <styled.object ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'object'> & React.RefAttributes<PrimitiveElement<'object'>>>
export const Ol = forwardRef<PrimitiveElement<'ol'>, PrimitiveProps<'ol'>>((props, ref) => <styled.ol ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'ol'> & React.RefAttributes<PrimitiveElement<'ol'>>>
export const Optgroup = forwardRef<PrimitiveElement<'optgroup'>, PrimitiveProps<'optgroup'>>((props, ref) => <styled.optgroup ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'optgroup'> & React.RefAttributes<PrimitiveElement<'optgroup'>>>
export const Option = forwardRef<PrimitiveElement<'option'>, PrimitiveProps<'option'>>((props, ref) => <styled.option ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'option'> & React.RefAttributes<PrimitiveElement<'option'>>>
export const Output = forwardRef<PrimitiveElement<'output'>, PrimitiveProps<'output'>>((props, ref) => <styled.output ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'output'> & React.RefAttributes<PrimitiveElement<'output'>>>
export const P = forwardRef<PrimitiveElement<'p'>, PrimitiveProps<'p'>>((props, ref) => <styled.p ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'p'> & React.RefAttributes<PrimitiveElement<'p'>>>
export const Picture = forwardRef<PrimitiveElement<'picture'>, PrimitiveProps<'picture'>>((props, ref) => <styled.picture ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'picture'> & React.RefAttributes<PrimitiveElement<'picture'>>>
export const Pre = forwardRef<PrimitiveElement<'pre'>, PrimitiveProps<'pre'>>((props, ref) => <styled.pre ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'pre'> & React.RefAttributes<PrimitiveElement<'pre'>>>
export const Progress = forwardRef<PrimitiveElement<'progress'>, PrimitiveProps<'progress'>>((props, ref) => <styled.progress ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'progress'> & React.RefAttributes<PrimitiveElement<'progress'>>>
export const Q = forwardRef<PrimitiveElement<'q'>, PrimitiveProps<'q'>>((props, ref) => <styled.q ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'q'> & React.RefAttributes<PrimitiveElement<'q'>>>
export const Rp = forwardRef<PrimitiveElement<'rp'>, PrimitiveProps<'rp'>>((props, ref) => <styled.rp ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'rp'> & React.RefAttributes<PrimitiveElement<'rp'>>>
export const Rt = forwardRef<PrimitiveElement<'rt'>, PrimitiveProps<'rt'>>((props, ref) => <styled.rt ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'rt'> & React.RefAttributes<PrimitiveElement<'rt'>>>
export const Ruby = forwardRef<PrimitiveElement<'ruby'>, PrimitiveProps<'ruby'>>((props, ref) => <styled.ruby ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'ruby'> & React.RefAttributes<PrimitiveElement<'ruby'>>>
export const S = forwardRef<PrimitiveElement<'s'>, PrimitiveProps<'s'>>((props, ref) => <styled.s ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'s'> & React.RefAttributes<PrimitiveElement<'s'>>>
export const Samp = forwardRef<PrimitiveElement<'samp'>, PrimitiveProps<'samp'>>((props, ref) => <styled.samp ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'samp'> & React.RefAttributes<PrimitiveElement<'samp'>>>
export const Search = forwardRef<PrimitiveElement<'search'>, PrimitiveProps<'search'>>((props, ref) => <styled.search ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'search'> & React.RefAttributes<PrimitiveElement<'search'>>>
export const Section = forwardRef<PrimitiveElement<'section'>, PrimitiveProps<'section'>>((props, ref) => <styled.section ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'section'> & React.RefAttributes<PrimitiveElement<'section'>>>
export const Select = forwardRef<PrimitiveElement<'select'>, PrimitiveProps<'select'>>((props, ref) => <styled.select ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'select'> & React.RefAttributes<PrimitiveElement<'select'>>>
export const Small = forwardRef<PrimitiveElement<'small'>, PrimitiveProps<'small'>>((props, ref) => <styled.small ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'small'> & React.RefAttributes<PrimitiveElement<'small'>>>
export const Source = forwardRef<PrimitiveElement<'source'>, PrimitiveProps<'source'>>((props, ref) => <styled.source ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'source'> & React.RefAttributes<PrimitiveElement<'source'>>>
export const Span = forwardRef<PrimitiveElement<'span'>, PrimitiveProps<'span'>>((props, ref) => <styled.span ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'span'> & React.RefAttributes<PrimitiveElement<'span'>>>
export const Strong = forwardRef<PrimitiveElement<'strong'>, PrimitiveProps<'strong'>>((props, ref) => <styled.strong ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'strong'> & React.RefAttributes<PrimitiveElement<'strong'>>>
export const Sub = forwardRef<PrimitiveElement<'sub'>, PrimitiveProps<'sub'>>((props, ref) => <styled.sub ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'sub'> & React.RefAttributes<PrimitiveElement<'sub'>>>
export const Summary = forwardRef<PrimitiveElement<'summary'>, PrimitiveProps<'summary'>>((props, ref) => <styled.summary ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'summary'> & React.RefAttributes<PrimitiveElement<'summary'>>>
export const Sup = forwardRef<PrimitiveElement<'sup'>, PrimitiveProps<'sup'>>((props, ref) => <styled.sup ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'sup'> & React.RefAttributes<PrimitiveElement<'sup'>>>
export const Svg = forwardRef<PrimitiveElement<'svg'>, PrimitiveProps<'svg'>>((props, ref) => <styled.svg ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'svg'> & React.RefAttributes<PrimitiveElement<'svg'>>>
export const Table = forwardRef<PrimitiveElement<'table'>, PrimitiveProps<'table'>>((props, ref) => <styled.table ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'table'> & React.RefAttributes<PrimitiveElement<'table'>>>
export const Tbody = forwardRef<PrimitiveElement<'tbody'>, PrimitiveProps<'tbody'>>((props, ref) => <styled.tbody ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'tbody'> & React.RefAttributes<PrimitiveElement<'tbody'>>>
export const Td = forwardRef<PrimitiveElement<'td'>, PrimitiveProps<'td'>>((props, ref) => <styled.td ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'td'> & React.RefAttributes<PrimitiveElement<'td'>>>
export const Textarea = forwardRef<PrimitiveElement<'textarea'>, PrimitiveProps<'textarea'>>((props, ref) => <styled.textarea ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'textarea'> & React.RefAttributes<PrimitiveElement<'textarea'>>>
export const Tfoot = forwardRef<PrimitiveElement<'tfoot'>, PrimitiveProps<'tfoot'>>((props, ref) => <styled.tfoot ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'tfoot'> & React.RefAttributes<PrimitiveElement<'tfoot'>>>
export const Th = forwardRef<PrimitiveElement<'th'>, PrimitiveProps<'th'>>((props, ref) => <styled.th ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'th'> & React.RefAttributes<PrimitiveElement<'th'>>>
export const Thead = forwardRef<PrimitiveElement<'thead'>, PrimitiveProps<'thead'>>((props, ref) => <styled.thead ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'thead'> & React.RefAttributes<PrimitiveElement<'thead'>>>
export const Time = forwardRef<PrimitiveElement<'time'>, PrimitiveProps<'time'>>((props, ref) => <styled.time ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'time'> & React.RefAttributes<PrimitiveElement<'time'>>>
export const Tr = forwardRef<PrimitiveElement<'tr'>, PrimitiveProps<'tr'>>((props, ref) => <styled.tr ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'tr'> & React.RefAttributes<PrimitiveElement<'tr'>>>
export const Track = forwardRef<PrimitiveElement<'track'>, PrimitiveProps<'track'>>((props, ref) => <styled.track ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'track'> & React.RefAttributes<PrimitiveElement<'track'>>>
export const U = forwardRef<PrimitiveElement<'u'>, PrimitiveProps<'u'>>((props, ref) => <styled.u ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'u'> & React.RefAttributes<PrimitiveElement<'u'>>>
export const Ul = forwardRef<PrimitiveElement<'ul'>, PrimitiveProps<'ul'>>((props, ref) => <styled.ul ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'ul'> & React.RefAttributes<PrimitiveElement<'ul'>>>
export const Var = forwardRef<PrimitiveElement<'var'>, PrimitiveProps<'var'>>((props, ref) => <styled.var ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'var'> & React.RefAttributes<PrimitiveElement<'var'>>>
export const Video = forwardRef<PrimitiveElement<'video'>, PrimitiveProps<'video'>>((props, ref) => <styled.video ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'video'> & React.RefAttributes<PrimitiveElement<'video'>>>
export const Wbr = forwardRef<PrimitiveElement<'wbr'>, PrimitiveProps<'wbr'>>((props, ref) => <styled.wbr ref={ref} {...applyBoxPattern(props, undefined)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'wbr'> & React.RefAttributes<PrimitiveElement<'wbr'>>>