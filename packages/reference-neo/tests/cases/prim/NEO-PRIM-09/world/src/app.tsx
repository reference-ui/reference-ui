// Entry for the PRIM-09 world. It takes the generated tag primitives and emits
// one self-closing probe per tag inside a plain census root. No style props:
// the claim is element identity, so every probe carries only its tag id.
import { A, Abbr, Address, Area, Article, Aside, Audio, B, Bdi, Bdo, Blockquote, Br, Button, Canvas, Caption, Cite, Code, Col, Colgroup, Data, Datalist, Dd, Del, Details, Dfn, Dialog, Div, Dl, Dt, Em, Embed, Fieldset, Figcaption, Figure, Footer, Form, H1, H2, H3, H4, H5, H6, Header, Hgroup, Hr, I, Iframe, Img, Input, Ins, Kbd, Label, Legend, Li, Main, Map, Mark, Menu, Meter, Nav, Obj, Ol, Optgroup, Option, Output, P, Picture, Pre, Progress, Q, Rp, Rt, Ruby, S, Samp, Search, Section, Select, Small, Source, Span, Strong, Sub, Summary, Sup, Svg, Table, Tbody, Td, Textarea, Tfoot, Th, Thead, Time, Tr, Track, U, Ul, Var, Video, Wbr, createRoot } from '@reference-ui/react'

export function PrimCensus() {
  return (
    <div id="census-root">
      <A id="tag-a" />
      <Abbr id="tag-abbr" />
      <Address id="tag-address" />
      <Area id="tag-area" />
      <Article id="tag-article" />
      <Aside id="tag-aside" />
      <Audio id="tag-audio" />
      <B id="tag-b" />
      <Bdi id="tag-bdi" />
      <Bdo id="tag-bdo" />
      <Blockquote id="tag-blockquote" />
      <Br id="tag-br" />
      <Button id="tag-button" />
      <Canvas id="tag-canvas" />
      <Caption id="tag-caption" />
      <Cite id="tag-cite" />
      <Code id="tag-code" />
      <Col id="tag-col" />
      <Colgroup id="tag-colgroup" />
      <Data id="tag-data" />
      <Datalist id="tag-datalist" />
      <Dd id="tag-dd" />
      <Del id="tag-del" />
      <Details id="tag-details" />
      <Dfn id="tag-dfn" />
      <Dialog id="tag-dialog" />
      <Div id="tag-div" />
      <Dl id="tag-dl" />
      <Dt id="tag-dt" />
      <Em id="tag-em" />
      <Embed id="tag-embed" />
      <Fieldset id="tag-fieldset" />
      <Figcaption id="tag-figcaption" />
      <Figure id="tag-figure" />
      <Footer id="tag-footer" />
      <Form id="tag-form" />
      <H1 id="tag-h1" />
      <H2 id="tag-h2" />
      <H3 id="tag-h3" />
      <H4 id="tag-h4" />
      <H5 id="tag-h5" />
      <H6 id="tag-h6" />
      <Header id="tag-header" />
      <Hgroup id="tag-hgroup" />
      <Hr id="tag-hr" />
      <I id="tag-i" />
      <Iframe id="tag-iframe" />
      <Img id="tag-img" />
      <Input id="tag-input" />
      <Ins id="tag-ins" />
      <Kbd id="tag-kbd" />
      <Label id="tag-label" />
      <Legend id="tag-legend" />
      <Li id="tag-li" />
      <Main id="tag-main" />
      <Map id="tag-map" />
      <Mark id="tag-mark" />
      <Menu id="tag-menu" />
      <Meter id="tag-meter" />
      <Nav id="tag-nav" />
      <Obj id="tag-object" />
      <Ol id="tag-ol" />
      <Optgroup id="tag-optgroup" />
      <Option id="tag-option" />
      <Output id="tag-output" />
      <P id="tag-p" />
      <Picture id="tag-picture" />
      <Pre id="tag-pre" />
      <Progress id="tag-progress" />
      <Q id="tag-q" />
      <Rp id="tag-rp" />
      <Rt id="tag-rt" />
      <Ruby id="tag-ruby" />
      <S id="tag-s" />
      <Samp id="tag-samp" />
      <Search id="tag-search" />
      <Section id="tag-section" />
      <Select id="tag-select" />
      <Small id="tag-small" />
      <Source id="tag-source" />
      <Span id="tag-span" />
      <Strong id="tag-strong" />
      <Sub id="tag-sub" />
      <Summary id="tag-summary" />
      <Sup id="tag-sup" />
      <Svg id="tag-svg" />
      <Table id="tag-table" />
      <Tbody id="tag-tbody" />
      <Td id="tag-td" />
      <Textarea id="tag-textarea" />
      <Tfoot id="tag-tfoot" />
      <Th id="tag-th" />
      <Thead id="tag-thead" />
      <Time id="tag-time" />
      <Tr id="tag-tr" />
      <Track id="tag-track" />
      <U id="tag-u" />
      <Ul id="tag-ul" />
      <Var id="tag-var" />
      <Video id="tag-video" />
      <Wbr id="tag-wbr" />
    </div>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<PrimCensus />)
