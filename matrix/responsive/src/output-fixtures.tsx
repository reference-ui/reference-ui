import { Div } from '@reference-ui/react'

export function ResponsiveOutputFixtures() {
  return (
    <Div hidden data-testid="responsive-output-fixtures">
      <Div
        data-testid="responsive-output-anonymous"
        container
        r={{
          333: { padding: '1.25rem' },
        }}
      >
        Anonymous container query source fixture
      </Div>

      <Div
        data-testid="responsive-output-named"
        container="shell"
        r={{
          777: { fontSize: '1.125rem' },
        }}
      >
        Named container query source fixture
      </Div>

      <Div container>
        <Div
          data-testid="responsive-output-nested-anonymous"
          r={{
            300: { padding: '0.5rem' },
            600: { padding: '1.5rem' },
          }}
        >
          Nested anonymous container query source fixture
        </Div>
      </Div>

      <Div container="sidebar">
        <Div
          data-testid="responsive-output-nested-named"
          container="sidebar"
          r={{
            400: { padding: '1rem', fontSize: '1.125rem' },
          }}
        >
          Named nested container query source fixture
        </Div>
      </Div>
    </Div>
  )
}