import { Div, H2, H3, P } from '../primitives/index.js';

const resizable = {
  border: '[2px solid #666]',
  padding: '4r',
  marginTop: '2r',
  resize: 'horizontal',
  overflow: 'auto',
  maxWidth: '[100%]',
  minWidth: '[200px]',
};

export function ResponsiveExample() {
  return (
    <Div display="flex" flexDirection="column" gap="4r">
      <Div container css={resizable}>
        <Div
          padding="2r"
          backgroundColor="red.500"
          color="white"
          r={{
            300: { padding: '4r', backgroundColor: 'green.500' },
            500: { padding: '6r', backgroundColor: 'blue.500' },
            700: { padding: '8r', backgroundColor: 'purple.500' },
          }}
        >
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
            backgroundColor="blue.500"
            color="white"
            r={{
              300: { padding: '4r', backgroundColor: 'green.500' },
              500: { padding: '6r', backgroundColor: 'blue.500' },
              700: { padding: '8r', backgroundColor: 'purple.500' },
            }}
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
                backgroundColor="green.500"
                color="white"
                r={{
                  300: { padding: '4r', backgroundColor: 'green.500' },
                  500: { padding: '6r', backgroundColor: 'blue.500' },
                  700: { padding: '8r', backgroundColor: 'purple.500' },
                }}
              >
                <H3 marginBottom="0.5r">Card</H3>
                <P margin="0">Queries &quot;card&quot; across nested layers</P>
              </Div>
            </Div>
          </Div>
        </Div>
      </Div>
    </Div>
  );
}
