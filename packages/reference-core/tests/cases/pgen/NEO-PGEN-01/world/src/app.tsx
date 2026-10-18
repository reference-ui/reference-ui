// Entry for the PGEN-01 world. It takes the bound flow primitives and emits
// one probe per html-flow family member inside a plain census root. Every
// probe paints the brand color through a sibling style prop; the Article
// probe adds a css-prop background so both style paths paint in one world.
import { createRoot } from 'react-dom/client'
import { Address, Article, Aside, Blockquote, Dd, Div, Dl, Dt, Figcaption, Figure, Footer, H1, H2, H3, H4, H5, H6, Header, Hgroup, Li, Main, Nav, Ol, Pre, Search, Section, Ul } from '@reference-ui/react'

export function PgenFlow() {
  return (
    <div id="flow-root">
      <Address id="flow-address" color="brand">address</Address>
      <Article id="flow-article" color="brand" css={{ backgroundColor: 'ink' }}>article</Article>
      <Aside id="flow-aside" color="brand">aside</Aside>
      <Blockquote id="flow-blockquote" color="brand">blockquote</Blockquote>
      <Dd id="flow-dd" color="brand">dd</Dd>
      <Div id="flow-div" color="brand">div</Div>
      <Dl id="flow-dl" color="brand">dl</Dl>
      <Dt id="flow-dt" color="brand">dt</Dt>
      <Figcaption id="flow-figcaption" color="brand">figcaption</Figcaption>
      <Figure id="flow-figure" color="brand">figure</Figure>
      <Footer id="flow-footer" color="brand">footer</Footer>
      <H1 id="flow-h1" color="brand">h1</H1>
      <H2 id="flow-h2" color="brand">h2</H2>
      <H3 id="flow-h3" color="brand">h3</H3>
      <H4 id="flow-h4" color="brand">h4</H4>
      <H5 id="flow-h5" color="brand">h5</H5>
      <H6 id="flow-h6" color="brand">h6</H6>
      <Header id="flow-header" color="brand">header</Header>
      <Hgroup id="flow-hgroup" color="brand">hgroup</Hgroup>
      <Li id="flow-li" color="brand">li</Li>
      <Main id="flow-main" color="brand">main</Main>
      <Nav id="flow-nav" color="brand">nav</Nav>
      <Ol id="flow-ol" color="brand">ol</Ol>
      <Pre id="flow-pre" color="brand">pre</Pre>
      <Search id="flow-search" color="brand">search</Search>
      <Section id="flow-section" color="brand">section</Section>
      <Ul id="flow-ul" color="brand">ul</Ul>
    </div>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<PgenFlow />)
