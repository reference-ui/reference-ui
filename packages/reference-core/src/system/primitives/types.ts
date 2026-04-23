/**
 * Primitive type re-exports and concrete per-tag component types (tsdown-friendly aliases).
 */

/// <reference lib="dom" />

import type * as React from 'react'
import type { StyleProps } from '../../types/style-props'
import type { ColorModeProps } from '../../types/props'
import type * as PrimitivesCore from '../../types/primitives'

export type {
  PrimitiveComponent,
  PrimitiveCssProps,
  PrimitiveElement,
  PrimitiveProps,
  PrimitiveTag,
} from '../../types/primitives'

type PrimitiveOwnProps = StyleProps & ColorModeProps & PrimitivesCore.PrimitiveCssProps

/** DOM props + style/colorMode/css for a given intrinsic tag (shared by all concrete *Component aliases). */
export type PrimitivePropsBase<T extends PrimitivesCore.PrimitiveTag> = Omit<
  React.ComponentPropsWithoutRef<T>,
  keyof PrimitiveOwnProps
> &
  PrimitiveOwnProps

// Type aliases for all HTML element components

export type AComponent = React.ForwardRefExoticComponent<
  Omit<React.ComponentPropsWithoutRef<'a'>, keyof PrimitiveOwnProps> &
    PrimitiveOwnProps &
    React.RefAttributes<HTMLAnchorElement>
>
export type AbbrComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'abbr'> & React.RefAttributes<HTMLElement>
>
export type AddressComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'address'> & React.RefAttributes<HTMLElement>
>
export type AreaComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'area'> & React.RefAttributes<HTMLAreaElement>
>
export type ArticleComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'article'> & React.RefAttributes<HTMLElement>
>
export type AsideComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'aside'> & React.RefAttributes<HTMLElement>
>
export type AudioComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'audio'> & React.RefAttributes<HTMLAudioElement>
>
export type BComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'b'> & React.RefAttributes<HTMLElement>
>
export type BdiComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'bdi'> & React.RefAttributes<HTMLElement>
>
export type BdoComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'bdo'> & React.RefAttributes<HTMLElement>
>
export type BlockquoteComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'blockquote'> & React.RefAttributes<HTMLQuoteElement>
>
export type BrComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'br'> & React.RefAttributes<HTMLBRElement>
>
export type ButtonComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'button'> & React.RefAttributes<HTMLButtonElement>
>
export type CanvasComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'canvas'> & React.RefAttributes<HTMLCanvasElement>
>
export type CaptionComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'caption'> & React.RefAttributes<HTMLTableCaptionElement>
>
export type CiteComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'cite'> & React.RefAttributes<HTMLElement>
>
export type CodeComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'code'> & React.RefAttributes<HTMLElement>
>
export type ColComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'col'> & React.RefAttributes<HTMLTableColElement>
>
export type ColgroupComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'colgroup'> & React.RefAttributes<HTMLTableColElement>
>
export type DataComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'data'> & React.RefAttributes<HTMLDataElement>
>
export type DatalistComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'datalist'> & React.RefAttributes<HTMLDataListElement>
>
export type DdComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'dd'> & React.RefAttributes<HTMLElement>
>
export type DelComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'del'> & React.RefAttributes<HTMLModElement>
>
export type DetailsComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'details'> & React.RefAttributes<HTMLDetailsElement>
>
export type DfnComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'dfn'> & React.RefAttributes<HTMLElement>
>
export type DialogComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'dialog'> & React.RefAttributes<HTMLDialogElement>
>
export type DivComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'div'> & React.RefAttributes<HTMLDivElement>
>
export type DlComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'dl'> & React.RefAttributes<HTMLDListElement>
>
export type DtComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'dt'> & React.RefAttributes<HTMLElement>
>
export type EmComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'em'> & React.RefAttributes<HTMLElement>
>
export type EmbedComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'embed'> & React.RefAttributes<HTMLEmbedElement>
>
export type FieldsetComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'fieldset'> & React.RefAttributes<HTMLFieldSetElement>
>
export type FigcaptionComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'figcaption'> & React.RefAttributes<HTMLElement>
>
export type FigureComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'figure'> & React.RefAttributes<HTMLElement>
>
export type FooterComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'footer'> & React.RefAttributes<HTMLElement>
>
export type FormComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'form'> & React.RefAttributes<HTMLFormElement>
>
export type H1Component = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'h1'> & React.RefAttributes<HTMLHeadingElement>
>
export type H2Component = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'h2'> & React.RefAttributes<HTMLHeadingElement>
>
export type H3Component = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'h3'> & React.RefAttributes<HTMLHeadingElement>
>
export type H4Component = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'h4'> & React.RefAttributes<HTMLHeadingElement>
>
export type H5Component = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'h5'> & React.RefAttributes<HTMLHeadingElement>
>
export type H6Component = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'h6'> & React.RefAttributes<HTMLHeadingElement>
>
export type HeaderComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'header'> & React.RefAttributes<HTMLElement>
>
export type HgroupComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'hgroup'> & React.RefAttributes<HTMLElement>
>
export type HrComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'hr'> & React.RefAttributes<HTMLHRElement>
>
export type IComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'i'> & React.RefAttributes<HTMLElement>
>
export type IframeComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'iframe'> & React.RefAttributes<HTMLIFrameElement>
>
export type ImgComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'img'> & React.RefAttributes<HTMLImageElement>
>
export type InputComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'input'> & React.RefAttributes<HTMLInputElement>
>
export type InsComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'ins'> & React.RefAttributes<HTMLModElement>
>
export type KbdComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'kbd'> & React.RefAttributes<HTMLElement>
>
export type LabelComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'label'> & React.RefAttributes<HTMLLabelElement>
>
export type LegendComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'legend'> & React.RefAttributes<HTMLLegendElement>
>
export type LiComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'li'> & React.RefAttributes<HTMLLIElement>
>
export type MainComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'main'> & React.RefAttributes<HTMLElement>
>
export type MapComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'map'> & React.RefAttributes<HTMLMapElement>
>
export type MarkComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'mark'> & React.RefAttributes<HTMLElement>
>
export type MenuComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'menu'> & React.RefAttributes<HTMLMenuElement>
>
export type MeterComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'meter'> & React.RefAttributes<HTMLMeterElement>
>
export type NavComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'nav'> & React.RefAttributes<HTMLElement>
>
export type ObjectComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'object'> & React.RefAttributes<HTMLObjectElement>
>
export type OlComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'ol'> & React.RefAttributes<HTMLOListElement>
>
export type OptgroupComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'optgroup'> & React.RefAttributes<HTMLOptGroupElement>
>
export type OptionComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'option'> & React.RefAttributes<HTMLOptionElement>
>
export type OutputComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'output'> & React.RefAttributes<HTMLOutputElement>
>
export type PComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'p'> & React.RefAttributes<HTMLParagraphElement>
>
export type PictureComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'picture'> & React.RefAttributes<HTMLPictureElement>
>
export type PreComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'pre'> & React.RefAttributes<HTMLPreElement>
>
export type ProgressComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'progress'> & React.RefAttributes<HTMLProgressElement>
>
export type QComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'q'> & React.RefAttributes<HTMLQuoteElement>
>
export type RpComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'rp'> & React.RefAttributes<HTMLElement>
>
export type RtComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'rt'> & React.RefAttributes<HTMLElement>
>
export type RubyComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'ruby'> & React.RefAttributes<HTMLElement>
>
export type SComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'s'> & React.RefAttributes<HTMLElement>
>
export type SampComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'samp'> & React.RefAttributes<HTMLElement>
>
export type SearchComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'search'> & React.RefAttributes<HTMLElement>
>
export type SectionComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'section'> & React.RefAttributes<HTMLElement>
>
export type SelectComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'select'> & React.RefAttributes<HTMLSelectElement>
>
export type SmallComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'small'> & React.RefAttributes<HTMLElement>
>
export type SourceComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'source'> & React.RefAttributes<HTMLSourceElement>
>
export type SpanComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'span'> & React.RefAttributes<HTMLSpanElement>
>
export type StrongComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'strong'> & React.RefAttributes<HTMLElement>
>
export type SubComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'sub'> & React.RefAttributes<HTMLElement>
>
export type SupComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'sup'> & React.RefAttributes<HTMLElement>
>
export type SummaryComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'summary'> & React.RefAttributes<HTMLElement>
>
export type SvgComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'svg'> & React.RefAttributes<SVGSVGElement>
>
export type TableComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'table'> & React.RefAttributes<HTMLTableElement>
>
export type TbodyComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'tbody'> & React.RefAttributes<HTMLTableSectionElement>
>
export type TdComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'td'> & React.RefAttributes<HTMLTableDataCellElement>
>
export type TfootComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'tfoot'> & React.RefAttributes<HTMLTableSectionElement>
>
export type ThComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'th'> & React.RefAttributes<HTMLTableHeaderCellElement>
>
export type TheadComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'thead'> & React.RefAttributes<HTMLTableSectionElement>
>
export type TimeComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'time'> & React.RefAttributes<HTMLTimeElement>
>
export type TrComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'tr'> & React.RefAttributes<HTMLTableRowElement>
>
export type TrackComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'track'> & React.RefAttributes<HTMLTrackElement>
>
export type UComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'u'> & React.RefAttributes<HTMLElement>
>
export type UlComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'ul'> & React.RefAttributes<HTMLUListElement>
>
export type VarComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'var'> & React.RefAttributes<HTMLElement>
>
export type VideoComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'video'> & React.RefAttributes<HTMLVideoElement>
>
export type WbrComponent = React.ForwardRefExoticComponent<
  PrimitivePropsBase<'wbr'> & React.RefAttributes<HTMLElement>
>

export type SimplifiedPrimitive<T extends PrimitivesCore.PrimitiveTag> =
  React.ForwardRefExoticComponent<
    Omit<React.ComponentPropsWithoutRef<T>, keyof PrimitiveOwnProps> &
      PrimitiveOwnProps &
      React.RefAttributes<React.ComponentRef<T>>
  >
