import { Div, css, type CssStyles } from '@reference-ui/react'

const resizable = {
  border: '[2px solid #666]',
  padding: '4r',
  marginTop: '2r',
  resize: 'horizontal',
  overflow: 'auto',
  maxWidth: '[100%]',
  minWidth: '[220px]',
}

const frameClass = css(
  {
    display: 'grid',
    gap: '3r',
    padding: '3r',
    borderRadius: 'xl',
    backgroundColor: 'gray.50',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'gray.300',
    r: {
      280: {
        gap: '4r',
        padding: '4r',
      },
      460: {
        gridTemplateColumns: 'minmax(0, 1.5fr) minmax(180px, 1fr)',
        alignItems: 'stretch',
      },
      620: {
        padding: '5r',
      },
    },
  } as unknown as CssStyles,
)

const heroClass = css(
  {
    display: 'grid',
    gap: '2r',
    padding: '4r',
    borderRadius: 'xl',
    backgroundColor: 'red.600',
    color: 'white',
    r: {
      280: {
        padding: '5r',
        backgroundColor: 'green.600',
      },
      460: {
        gap: '3r',
        backgroundColor: 'blue.600',
      },
      620: {
        padding: '6r',
        backgroundColor: 'purple.600',
      },
    },
  } as unknown as CssStyles,
)

const eyebrowClass = css({
  margin: '0',
  fontSize: 'xs',
  fontWeight: '700',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  opacity: '0.82',
})

const titleClass = css(
  {
    margin: '0',
    fontSize: 'lg',
    fontWeight: '700',
    lineHeight: '1.1',
    r: {
      460: {
        fontSize: 'xl',
      },
      620: {
        fontSize: '2xl',
      },
    },
  } as unknown as CssStyles,
)

const copyClass = css(
  {
    margin: '0',
    fontSize: 'sm',
    lineHeight: '1.6',
    maxWidth: '52ch',
    r: {
      460: {
        fontSize: 'md',
      },
    },
  } as unknown as CssStyles,
)

const tagRowClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2r',
})

const tagClass = css({
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'white',
  backgroundColor: 'white',
  color: 'gray.900',
  borderRadius: '999px',
  px: '2.5r',
  py: '1r',
  fontSize: 'xs',
  fontWeight: '700',
})

const noteClass = css(
  {
    display: 'grid',
    gap: '2.5r',
    padding: '3r',
    borderRadius: 'lg',
    borderWidth: '1px',
    borderStyle: 'dashed',
    borderColor: 'gray.400',
    backgroundColor: 'white',
    color: 'gray.900',
    r: {
      280: {
        padding: '4r',
      },
    },
  } as unknown as CssStyles,
)

const noteTextClass = css({
  margin: '0',
  fontSize: 'sm',
  lineHeight: '1.6',
  color: 'gray.600',
})

const actionClass = css(
  {
    justifySelf: 'start',
    border: 'none',
    borderRadius: '999px',
    backgroundColor: 'gray.900',
    color: 'white',
    px: '3r',
    py: '1.5r',
    fontSize: 'xs',
    fontWeight: '700',
    cursor: 'pointer',
    r: {
      460: {
        fontSize: 'sm',
      },
    },
  } as unknown as CssStyles,
)

export function ResponsiveCssSugarDemo() {
  return (
    <Div display="grid" gap="4r">
      <Div color="gray.600" fontSize="sm">
        Docs smoke test for the same `css()` plus `r` pattern used in the library fixture.
        If this breaks here too, the issue is in the shared virtual-to-CSS path rather than
        Cosmos.
      </Div>

      <Div container css={resizable}>
        <div className={frameClass}>
          <div className={heroClass}>
            <p className={eyebrowClass}>Docs preview</p>
            <h3 className={titleClass}>Raw primitives react to the Div container</h3>
            <p className={copyClass}>
              Resize through each breakpoint to watch spacing, layout, and color shift from
              `r` inside `css()` on the inner elements.
            </p>
            <div className={tagRowClass}>
              <div className={tagClass}>280px</div>
              <div className={tagClass}>460px</div>
              <div className={tagClass}>620px</div>
            </div>
          </div>

          <div className={noteClass}>
            <p className={noteTextClass}>
              This is a docs-side control for the sugar path: `container` on Div,
              responsive styling authored as `r` inside `css()`, and raw HTML elements as
              the actual targets.
            </p>
            <button type="button" className={actionClass}>
              css() button
            </button>
          </div>
        </div>
      </Div>
    </Div>
  )
}