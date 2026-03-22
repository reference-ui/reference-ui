import { Div, H2, H3, P } from '@reference-ui/react'

/**
 * Container-query demo: `r` breakpoint styles must use values Panda can emit inside
 * `@container` blocks. Semantic color tokens (e.g. green.500) in `r` often do not
 * resolve there — use hex (or css prop) so backgrounds visibly change when resizing.
 */
const rColorSteps = {
  260: { padding: '4r', backgroundColor: '#16a34a' },
  420: { padding: '6r', backgroundColor: '#2563eb' },
  580: { padding: '8r', backgroundColor: '#7c3aed' },
} as const

const resizable = {
  border: '[2px solid #666]',
  padding: '4r',
  marginTop: '2r',
  resize: 'horizontal',
  overflow: 'auto',
  maxWidth: '[100%]',
  minWidth: '[200px]',
}

export function ResponsiveExample() {
  return (
    <Div display="flex" flexDirection="column" gap="4r">
      <P margin="0" color="gray.600" fontSize="sm">
        Drag the lower-right corner of each box to resize. Backgrounds step up as the{' '}
        <strong>container</strong> crosses each min-width breakpoint (narrow → green →
        blue → purple).
      </P>

      <Div container css={resizable}>
        <Div padding="2r" backgroundColor="#dc2626" color="#fafafa" r={rColorSteps}>
          <H3 marginBottom="0.5r">Responsive Div</H3>
          <P margin="0">Queries nearest ancestor container</P>
        </Div>
      </Div>

      <H2 marginTop="2r">2. Named containers</H2>
      <Div
        css={{
          ...resizable,
          display: 'flex',
          flexDirection: 'row',
          gap: '2r',
        }}
      >
        <Div
          container="sidebar"
          flex="1"
          minWidth="120px"
          padding="2r"
          border="1px solid"
          borderColor="blue.300"
        >
          <Div
            container="sidebar"
            padding="2r"
            backgroundColor="#1e40af"
            color="#fafafa"
            r={rColorSteps}
          >
            <H3 marginBottom="0.5r">Sidebar</H3>
            <P margin="0">Queries &quot;sidebar&quot;</P>
          </Div>
        </Div>
        <Div
          container="card"
          flex="1"
          minWidth="120px"
          padding="2r"
          border="1px solid"
          borderColor="green.300"
        >
          <Div padding="1r" backgroundColor="gray.100">
            <Div padding="1r">
              <Div
                container="card"
                padding="2r"
                backgroundColor="#9a3412"
                color="#fafafa"
                r={rColorSteps}
              >
                <H3 marginBottom="0.5r">Card</H3>
                <P margin="0">Queries &quot;card&quot; across nested layers</P>
              </Div>
            </Div>
          </Div>
        </Div>
      </Div>
    </Div>
  )
}
