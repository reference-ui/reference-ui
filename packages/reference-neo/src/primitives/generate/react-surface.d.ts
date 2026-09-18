// Stable type surface for the generated @reference-ui/react entry.
// It takes nothing and declares the component surface sync emits per world.
// The tag lines mirror tags.ts through toJsxName (generate.test.ts holds the
// set); StylePropName stays wide on purpose — per-world emit narrows it.

import type * as React from 'react';

/** Styling keys every primitive accepts. Worlds promise shape, not membership. */
export type StylePropName = string;
export type StyleProps = { [K in StylePropName]?: unknown };
export type PrimitiveCssProp = Record<string, unknown>;

/** Every platform tag the generated primitives cover. */
export type PrimitiveTag = 'a' | 'abbr' | 'address' | 'area' | 'article' | 'aside' | 'audio' | 'b' | 'bdi' | 'bdo' | 'blockquote' | 'br' | 'button' | 'canvas' | 'caption' | 'cite' | 'code' | 'col' | 'colgroup' | 'data' | 'datalist' | 'dd' | 'del' | 'details' | 'dfn' | 'dialog' | 'div' | 'dl' | 'dt' | 'em' | 'embed' | 'fieldset' | 'figcaption' | 'figure' | 'footer' | 'form' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'header' | 'hgroup' | 'hr' | 'i' | 'iframe' | 'img' | 'input' | 'ins' | 'kbd' | 'label' | 'legend' | 'li' | 'main' | 'map' | 'mark' | 'menu' | 'meter' | 'nav' | 'object' | 'ol' | 'optgroup' | 'option' | 'output' | 'p' | 'picture' | 'pre' | 'progress' | 'q' | 'rp' | 'rt' | 'ruby' | 's' | 'samp' | 'search' | 'section' | 'select' | 'small' | 'source' | 'span' | 'strong' | 'sub' | 'summary' | 'sup' | 'svg' | 'table' | 'tbody' | 'td' | 'textarea' | 'tfoot' | 'th' | 'thead' | 'time' | 'tr' | 'track' | 'u' | 'ul' | 'var' | 'video' | 'wbr';

/** React types two tags with the generic HTMLElement instead of the real host. */
interface PrimitiveElementOverrides {
  caption: HTMLTableCaptionElement;
  menu: HTMLMenuElement;
}
/** Host element for one tag, with the caption/menu overrides applied. */
export type PrimitiveElement<T extends PrimitiveTag> = T extends keyof PrimitiveElementOverrides ? PrimitiveElementOverrides[T] : React.ComponentRef<T>;

export type AProps = Omit<React.ComponentPropsWithoutRef<"a">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const A: (props: AProps & { ref?: React.Ref<React.ComponentRef<"a">> }) => React.ReactNode;

export type AbbrProps = Omit<React.ComponentPropsWithoutRef<"abbr">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Abbr: (props: AbbrProps & { ref?: React.Ref<React.ComponentRef<"abbr">> }) => React.ReactNode;

export type AddressProps = Omit<React.ComponentPropsWithoutRef<"address">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Address: (props: AddressProps & { ref?: React.Ref<React.ComponentRef<"address">> }) => React.ReactNode;

export type AreaProps = Omit<React.ComponentPropsWithoutRef<"area">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Area: (props: AreaProps & { ref?: React.Ref<React.ComponentRef<"area">> }) => React.ReactNode;

export type ArticleProps = Omit<React.ComponentPropsWithoutRef<"article">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Article: (props: ArticleProps & { ref?: React.Ref<React.ComponentRef<"article">> }) => React.ReactNode;

export type AsideProps = Omit<React.ComponentPropsWithoutRef<"aside">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Aside: (props: AsideProps & { ref?: React.Ref<React.ComponentRef<"aside">> }) => React.ReactNode;

export type AudioProps = Omit<React.ComponentPropsWithoutRef<"audio">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Audio: (props: AudioProps & { ref?: React.Ref<React.ComponentRef<"audio">> }) => React.ReactNode;

export type BProps = Omit<React.ComponentPropsWithoutRef<"b">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const B: (props: BProps & { ref?: React.Ref<React.ComponentRef<"b">> }) => React.ReactNode;

export type BdiProps = Omit<React.ComponentPropsWithoutRef<"bdi">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Bdi: (props: BdiProps & { ref?: React.Ref<React.ComponentRef<"bdi">> }) => React.ReactNode;

export type BdoProps = Omit<React.ComponentPropsWithoutRef<"bdo">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Bdo: (props: BdoProps & { ref?: React.Ref<React.ComponentRef<"bdo">> }) => React.ReactNode;

export type BlockquoteProps = Omit<React.ComponentPropsWithoutRef<"blockquote">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Blockquote: (props: BlockquoteProps & { ref?: React.Ref<React.ComponentRef<"blockquote">> }) => React.ReactNode;

export type BrProps = Omit<React.ComponentPropsWithoutRef<"br">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Br: (props: BrProps & { ref?: React.Ref<React.ComponentRef<"br">> }) => React.ReactNode;

export type ButtonProps = Omit<React.ComponentPropsWithoutRef<"button">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Button: (props: ButtonProps & { ref?: React.Ref<React.ComponentRef<"button">> }) => React.ReactNode;

export type CanvasProps = Omit<React.ComponentPropsWithoutRef<"canvas">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Canvas: (props: CanvasProps & { ref?: React.Ref<React.ComponentRef<"canvas">> }) => React.ReactNode;

export type CaptionProps = Omit<React.ComponentPropsWithoutRef<"caption">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Caption: (props: CaptionProps & { ref?: React.Ref<React.ComponentRef<"caption">> }) => React.ReactNode;

export type CiteProps = Omit<React.ComponentPropsWithoutRef<"cite">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Cite: (props: CiteProps & { ref?: React.Ref<React.ComponentRef<"cite">> }) => React.ReactNode;

export type CodeProps = Omit<React.ComponentPropsWithoutRef<"code">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Code: (props: CodeProps & { ref?: React.Ref<React.ComponentRef<"code">> }) => React.ReactNode;

export type ColProps = Omit<React.ComponentPropsWithoutRef<"col">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Col: (props: ColProps & { ref?: React.Ref<React.ComponentRef<"col">> }) => React.ReactNode;

export type ColgroupProps = Omit<React.ComponentPropsWithoutRef<"colgroup">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Colgroup: (props: ColgroupProps & { ref?: React.Ref<React.ComponentRef<"colgroup">> }) => React.ReactNode;

export type DataProps = Omit<React.ComponentPropsWithoutRef<"data">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Data: (props: DataProps & { ref?: React.Ref<React.ComponentRef<"data">> }) => React.ReactNode;

export type DatalistProps = Omit<React.ComponentPropsWithoutRef<"datalist">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Datalist: (props: DatalistProps & { ref?: React.Ref<React.ComponentRef<"datalist">> }) => React.ReactNode;

export type DdProps = Omit<React.ComponentPropsWithoutRef<"dd">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Dd: (props: DdProps & { ref?: React.Ref<React.ComponentRef<"dd">> }) => React.ReactNode;

export type DelProps = Omit<React.ComponentPropsWithoutRef<"del">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Del: (props: DelProps & { ref?: React.Ref<React.ComponentRef<"del">> }) => React.ReactNode;

export type DetailsProps = Omit<React.ComponentPropsWithoutRef<"details">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Details: (props: DetailsProps & { ref?: React.Ref<React.ComponentRef<"details">> }) => React.ReactNode;

export type DfnProps = Omit<React.ComponentPropsWithoutRef<"dfn">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Dfn: (props: DfnProps & { ref?: React.Ref<React.ComponentRef<"dfn">> }) => React.ReactNode;

export type DialogProps = Omit<React.ComponentPropsWithoutRef<"dialog">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Dialog: (props: DialogProps & { ref?: React.Ref<React.ComponentRef<"dialog">> }) => React.ReactNode;

export type DivProps = Omit<React.ComponentPropsWithoutRef<"div">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Div: (props: DivProps & { ref?: React.Ref<React.ComponentRef<"div">> }) => React.ReactNode;

export type DlProps = Omit<React.ComponentPropsWithoutRef<"dl">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Dl: (props: DlProps & { ref?: React.Ref<React.ComponentRef<"dl">> }) => React.ReactNode;

export type DtProps = Omit<React.ComponentPropsWithoutRef<"dt">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Dt: (props: DtProps & { ref?: React.Ref<React.ComponentRef<"dt">> }) => React.ReactNode;

export type EmProps = Omit<React.ComponentPropsWithoutRef<"em">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Em: (props: EmProps & { ref?: React.Ref<React.ComponentRef<"em">> }) => React.ReactNode;

export type EmbedProps = Omit<React.ComponentPropsWithoutRef<"embed">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Embed: (props: EmbedProps & { ref?: React.Ref<React.ComponentRef<"embed">> }) => React.ReactNode;

export type FieldsetProps = Omit<React.ComponentPropsWithoutRef<"fieldset">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Fieldset: (props: FieldsetProps & { ref?: React.Ref<React.ComponentRef<"fieldset">> }) => React.ReactNode;

export type FigcaptionProps = Omit<React.ComponentPropsWithoutRef<"figcaption">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Figcaption: (props: FigcaptionProps & { ref?: React.Ref<React.ComponentRef<"figcaption">> }) => React.ReactNode;

export type FigureProps = Omit<React.ComponentPropsWithoutRef<"figure">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Figure: (props: FigureProps & { ref?: React.Ref<React.ComponentRef<"figure">> }) => React.ReactNode;

export type FooterProps = Omit<React.ComponentPropsWithoutRef<"footer">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Footer: (props: FooterProps & { ref?: React.Ref<React.ComponentRef<"footer">> }) => React.ReactNode;

export type FormProps = Omit<React.ComponentPropsWithoutRef<"form">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Form: (props: FormProps & { ref?: React.Ref<React.ComponentRef<"form">> }) => React.ReactNode;

export type H1Props = Omit<React.ComponentPropsWithoutRef<"h1">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const H1: (props: H1Props & { ref?: React.Ref<React.ComponentRef<"h1">> }) => React.ReactNode;

export type H2Props = Omit<React.ComponentPropsWithoutRef<"h2">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const H2: (props: H2Props & { ref?: React.Ref<React.ComponentRef<"h2">> }) => React.ReactNode;

export type H3Props = Omit<React.ComponentPropsWithoutRef<"h3">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const H3: (props: H3Props & { ref?: React.Ref<React.ComponentRef<"h3">> }) => React.ReactNode;

export type H4Props = Omit<React.ComponentPropsWithoutRef<"h4">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const H4: (props: H4Props & { ref?: React.Ref<React.ComponentRef<"h4">> }) => React.ReactNode;

export type H5Props = Omit<React.ComponentPropsWithoutRef<"h5">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const H5: (props: H5Props & { ref?: React.Ref<React.ComponentRef<"h5">> }) => React.ReactNode;

export type H6Props = Omit<React.ComponentPropsWithoutRef<"h6">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const H6: (props: H6Props & { ref?: React.Ref<React.ComponentRef<"h6">> }) => React.ReactNode;

export type HeaderProps = Omit<React.ComponentPropsWithoutRef<"header">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Header: (props: HeaderProps & { ref?: React.Ref<React.ComponentRef<"header">> }) => React.ReactNode;

export type HgroupProps = Omit<React.ComponentPropsWithoutRef<"hgroup">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Hgroup: (props: HgroupProps & { ref?: React.Ref<React.ComponentRef<"hgroup">> }) => React.ReactNode;

export type HrProps = Omit<React.ComponentPropsWithoutRef<"hr">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Hr: (props: HrProps & { ref?: React.Ref<React.ComponentRef<"hr">> }) => React.ReactNode;

export type IProps = Omit<React.ComponentPropsWithoutRef<"i">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const I: (props: IProps & { ref?: React.Ref<React.ComponentRef<"i">> }) => React.ReactNode;

export type IframeProps = Omit<React.ComponentPropsWithoutRef<"iframe">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Iframe: (props: IframeProps & { ref?: React.Ref<React.ComponentRef<"iframe">> }) => React.ReactNode;

export type ImgProps = Omit<React.ComponentPropsWithoutRef<"img">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Img: (props: ImgProps & { ref?: React.Ref<React.ComponentRef<"img">> }) => React.ReactNode;

export type InputProps = Omit<React.ComponentPropsWithoutRef<"input">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Input: (props: InputProps & { ref?: React.Ref<React.ComponentRef<"input">> }) => React.ReactNode;

export type InsProps = Omit<React.ComponentPropsWithoutRef<"ins">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Ins: (props: InsProps & { ref?: React.Ref<React.ComponentRef<"ins">> }) => React.ReactNode;

export type KbdProps = Omit<React.ComponentPropsWithoutRef<"kbd">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Kbd: (props: KbdProps & { ref?: React.Ref<React.ComponentRef<"kbd">> }) => React.ReactNode;

export type LabelProps = Omit<React.ComponentPropsWithoutRef<"label">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Label: (props: LabelProps & { ref?: React.Ref<React.ComponentRef<"label">> }) => React.ReactNode;

export type LegendProps = Omit<React.ComponentPropsWithoutRef<"legend">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Legend: (props: LegendProps & { ref?: React.Ref<React.ComponentRef<"legend">> }) => React.ReactNode;

export type LiProps = Omit<React.ComponentPropsWithoutRef<"li">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Li: (props: LiProps & { ref?: React.Ref<React.ComponentRef<"li">> }) => React.ReactNode;

export type MainProps = Omit<React.ComponentPropsWithoutRef<"main">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Main: (props: MainProps & { ref?: React.Ref<React.ComponentRef<"main">> }) => React.ReactNode;

export type MapProps = Omit<React.ComponentPropsWithoutRef<"map">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Map: (props: MapProps & { ref?: React.Ref<React.ComponentRef<"map">> }) => React.ReactNode;

export type MarkProps = Omit<React.ComponentPropsWithoutRef<"mark">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Mark: (props: MarkProps & { ref?: React.Ref<React.ComponentRef<"mark">> }) => React.ReactNode;

export type MenuProps = Omit<React.ComponentPropsWithoutRef<"menu">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Menu: (props: MenuProps & { ref?: React.Ref<React.ComponentRef<"menu">> }) => React.ReactNode;

export type MeterProps = Omit<React.ComponentPropsWithoutRef<"meter">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Meter: (props: MeterProps & { ref?: React.Ref<React.ComponentRef<"meter">> }) => React.ReactNode;

export type NavProps = Omit<React.ComponentPropsWithoutRef<"nav">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Nav: (props: NavProps & { ref?: React.Ref<React.ComponentRef<"nav">> }) => React.ReactNode;

export type ObjProps = Omit<React.ComponentPropsWithoutRef<"object">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Obj: (props: ObjProps & { ref?: React.Ref<React.ComponentRef<"object">> }) => React.ReactNode;

export type OlProps = Omit<React.ComponentPropsWithoutRef<"ol">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Ol: (props: OlProps & { ref?: React.Ref<React.ComponentRef<"ol">> }) => React.ReactNode;

export type OptgroupProps = Omit<React.ComponentPropsWithoutRef<"optgroup">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Optgroup: (props: OptgroupProps & { ref?: React.Ref<React.ComponentRef<"optgroup">> }) => React.ReactNode;

export type OptionProps = Omit<React.ComponentPropsWithoutRef<"option">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Option: (props: OptionProps & { ref?: React.Ref<React.ComponentRef<"option">> }) => React.ReactNode;

export type OutputProps = Omit<React.ComponentPropsWithoutRef<"output">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Output: (props: OutputProps & { ref?: React.Ref<React.ComponentRef<"output">> }) => React.ReactNode;

export type PProps = Omit<React.ComponentPropsWithoutRef<"p">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const P: (props: PProps & { ref?: React.Ref<React.ComponentRef<"p">> }) => React.ReactNode;

export type PictureProps = Omit<React.ComponentPropsWithoutRef<"picture">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Picture: (props: PictureProps & { ref?: React.Ref<React.ComponentRef<"picture">> }) => React.ReactNode;

export type PreProps = Omit<React.ComponentPropsWithoutRef<"pre">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Pre: (props: PreProps & { ref?: React.Ref<React.ComponentRef<"pre">> }) => React.ReactNode;

export type ProgressProps = Omit<React.ComponentPropsWithoutRef<"progress">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Progress: (props: ProgressProps & { ref?: React.Ref<React.ComponentRef<"progress">> }) => React.ReactNode;

export type QProps = Omit<React.ComponentPropsWithoutRef<"q">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Q: (props: QProps & { ref?: React.Ref<React.ComponentRef<"q">> }) => React.ReactNode;

export type RpProps = Omit<React.ComponentPropsWithoutRef<"rp">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Rp: (props: RpProps & { ref?: React.Ref<React.ComponentRef<"rp">> }) => React.ReactNode;

export type RtProps = Omit<React.ComponentPropsWithoutRef<"rt">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Rt: (props: RtProps & { ref?: React.Ref<React.ComponentRef<"rt">> }) => React.ReactNode;

export type RubyProps = Omit<React.ComponentPropsWithoutRef<"ruby">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Ruby: (props: RubyProps & { ref?: React.Ref<React.ComponentRef<"ruby">> }) => React.ReactNode;

export type SProps = Omit<React.ComponentPropsWithoutRef<"s">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const S: (props: SProps & { ref?: React.Ref<React.ComponentRef<"s">> }) => React.ReactNode;

export type SampProps = Omit<React.ComponentPropsWithoutRef<"samp">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Samp: (props: SampProps & { ref?: React.Ref<React.ComponentRef<"samp">> }) => React.ReactNode;

export type SearchProps = Omit<React.ComponentPropsWithoutRef<"search">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Search: (props: SearchProps & { ref?: React.Ref<React.ComponentRef<"search">> }) => React.ReactNode;

export type SectionProps = Omit<React.ComponentPropsWithoutRef<"section">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Section: (props: SectionProps & { ref?: React.Ref<React.ComponentRef<"section">> }) => React.ReactNode;

export type SelectProps = Omit<React.ComponentPropsWithoutRef<"select">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Select: (props: SelectProps & { ref?: React.Ref<React.ComponentRef<"select">> }) => React.ReactNode;

export type SmallProps = Omit<React.ComponentPropsWithoutRef<"small">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Small: (props: SmallProps & { ref?: React.Ref<React.ComponentRef<"small">> }) => React.ReactNode;

export type SourceProps = Omit<React.ComponentPropsWithoutRef<"source">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Source: (props: SourceProps & { ref?: React.Ref<React.ComponentRef<"source">> }) => React.ReactNode;

export type SpanProps = Omit<React.ComponentPropsWithoutRef<"span">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Span: (props: SpanProps & { ref?: React.Ref<React.ComponentRef<"span">> }) => React.ReactNode;

export type StrongProps = Omit<React.ComponentPropsWithoutRef<"strong">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Strong: (props: StrongProps & { ref?: React.Ref<React.ComponentRef<"strong">> }) => React.ReactNode;

export type SubProps = Omit<React.ComponentPropsWithoutRef<"sub">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Sub: (props: SubProps & { ref?: React.Ref<React.ComponentRef<"sub">> }) => React.ReactNode;

export type SummaryProps = Omit<React.ComponentPropsWithoutRef<"summary">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Summary: (props: SummaryProps & { ref?: React.Ref<React.ComponentRef<"summary">> }) => React.ReactNode;

export type SupProps = Omit<React.ComponentPropsWithoutRef<"sup">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Sup: (props: SupProps & { ref?: React.Ref<React.ComponentRef<"sup">> }) => React.ReactNode;

export type SvgProps = Omit<React.ComponentPropsWithoutRef<"svg">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Svg: (props: SvgProps & { ref?: React.Ref<React.ComponentRef<"svg">> }) => React.ReactNode;

export type TableProps = Omit<React.ComponentPropsWithoutRef<"table">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Table: (props: TableProps & { ref?: React.Ref<React.ComponentRef<"table">> }) => React.ReactNode;

export type TbodyProps = Omit<React.ComponentPropsWithoutRef<"tbody">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Tbody: (props: TbodyProps & { ref?: React.Ref<React.ComponentRef<"tbody">> }) => React.ReactNode;

export type TdProps = Omit<React.ComponentPropsWithoutRef<"td">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Td: (props: TdProps & { ref?: React.Ref<React.ComponentRef<"td">> }) => React.ReactNode;

export type TextareaProps = Omit<React.ComponentPropsWithoutRef<"textarea">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Textarea: (props: TextareaProps & { ref?: React.Ref<React.ComponentRef<"textarea">> }) => React.ReactNode;

export type TfootProps = Omit<React.ComponentPropsWithoutRef<"tfoot">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Tfoot: (props: TfootProps & { ref?: React.Ref<React.ComponentRef<"tfoot">> }) => React.ReactNode;

export type ThProps = Omit<React.ComponentPropsWithoutRef<"th">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Th: (props: ThProps & { ref?: React.Ref<React.ComponentRef<"th">> }) => React.ReactNode;

export type TheadProps = Omit<React.ComponentPropsWithoutRef<"thead">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Thead: (props: TheadProps & { ref?: React.Ref<React.ComponentRef<"thead">> }) => React.ReactNode;

export type TimeProps = Omit<React.ComponentPropsWithoutRef<"time">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Time: (props: TimeProps & { ref?: React.Ref<React.ComponentRef<"time">> }) => React.ReactNode;

export type TrProps = Omit<React.ComponentPropsWithoutRef<"tr">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Tr: (props: TrProps & { ref?: React.Ref<React.ComponentRef<"tr">> }) => React.ReactNode;

export type TrackProps = Omit<React.ComponentPropsWithoutRef<"track">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Track: (props: TrackProps & { ref?: React.Ref<React.ComponentRef<"track">> }) => React.ReactNode;

export type UProps = Omit<React.ComponentPropsWithoutRef<"u">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const U: (props: UProps & { ref?: React.Ref<React.ComponentRef<"u">> }) => React.ReactNode;

export type UlProps = Omit<React.ComponentPropsWithoutRef<"ul">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Ul: (props: UlProps & { ref?: React.Ref<React.ComponentRef<"ul">> }) => React.ReactNode;

export type VarProps = Omit<React.ComponentPropsWithoutRef<"var">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Var: (props: VarProps & { ref?: React.Ref<React.ComponentRef<"var">> }) => React.ReactNode;

export type VideoProps = Omit<React.ComponentPropsWithoutRef<"video">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Video: (props: VideoProps & { ref?: React.Ref<React.ComponentRef<"video">> }) => React.ReactNode;

export type WbrProps = Omit<React.ComponentPropsWithoutRef<"wbr">, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & { css?: PrimitiveCssProp; colorMode?: unknown; variant?: unknown };
export declare const Wbr: (props: WbrProps & { ref?: React.Ref<React.ComponentRef<"wbr">> }) => React.ReactNode;

export declare const LayerScopeContext: React.Context<boolean>;
export declare const ColorModeContext: React.Context<string | undefined>;
export declare const DocumentContext: React.Context<Document | null>;
export declare function useColorMode(): string | undefined;
export { Fragment } from 'react';
export { createElement } from 'react';
export { createRoot } from 'react-dom/client';

/** Bound style runtimes the react bundle carries (D4 moved them out of styled). */
export type CssStyles = Record<string, unknown>;
export type SystemStyleObject = Record<string, unknown>;
export declare function css(...styles: Array<CssStyles | CssStyles[]>): string;
export type RecipeConfig = Record<string, unknown>;
export type RecipeRuntimeFn = (props?: Record<string, unknown>) => string;
export declare function recipe(config: RecipeConfig): RecipeRuntimeFn;
