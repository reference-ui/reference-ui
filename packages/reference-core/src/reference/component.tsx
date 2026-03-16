import * as React from 'react'
import {
  createTastyApiFromManifest,
  type RawTastyManifest,
  type TastyApi,
  type TastyMember,
  type TastySymbol,
} from '@reference-ui/rust/tasty'
import {
  Code,
  Div,
  H2,
  P,
  Small,
  Span,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '../system/primitives'
import { referenceTokens } from './tokens'

export interface ReferenceProps {
  name: string
}

export interface ReferenceRuntimeModule {
  manifest: RawTastyManifest
  manifestUrl: string
  importTastyArtifact(specifier: string): Promise<unknown>
}

export type ReferenceRuntimeLoader = () => Promise<ReferenceRuntimeModule>

interface LoadedReferenceState {
  symbol: TastySymbol
  members: TastyMember[]
}

type ReferenceStatus =
  | { state: 'loading' }
  | { state: 'ready'; data: LoadedReferenceState }
  | { state: 'error'; message: string }

function formatModifiers(member: TastyMember): string {
  const modifiers = [
    member.isReadonly() ? 'readonly' : null,
    member.isOptional() ? 'optional' : null,
  ].filter(Boolean)

  return modifiers.length > 0 ? modifiers.join(', ') : '-'
}

function renderSummary(status: ReferenceStatus, name: string): React.ReactNode {
  if (status.state === 'loading') {
    return (
      <P margin="0" color={referenceTokens.color.muted}>
        Loading reference docs for{' '}
        <Code fontFamily={referenceTokens.font.mono}>{name}</Code>.
      </P>
    )
  }

  if (status.state === 'error') {
    return (
      <P margin="0" color={referenceTokens.color.muted}>
        Failed to load <Code fontFamily={referenceTokens.font.mono}>{name}</Code>:{' '}
        {status.message}
      </P>
    )
  }

  const { symbol } = status.data
  const extendsNames = symbol.getExtends().map(ref => ref.getName())
  const typeParameterNames = symbol.getTypeParameters().map(param => param.name)
  const kindLabel = symbol.getKind() === 'typeAlias' ? 'Type alias' : 'Interface'

  return (
    <Div display="grid" gap={referenceTokens.space.xs}>
      <P margin="0" color={referenceTokens.color.muted}>
        {kindLabel} loaded from the generated Tasty manifest for{' '}
        <Code fontFamily={referenceTokens.font.mono}>{symbol.getName()}</Code>.
      </P>
      {typeParameterNames.length > 0 ? (
        <Small color={referenceTokens.color.muted}>
          Generics: {typeParameterNames.join(', ')}
        </Small>
      ) : null}
      {extendsNames.length > 0 ? (
        <Small color={referenceTokens.color.muted}>
          Extends: {extendsNames.join(', ')}
        </Small>
      ) : null}
    </Div>
  )
}

function renderContent(status: ReferenceStatus): React.ReactNode {
  if (status.state !== 'ready') {
    return null
  }

  const { symbol, members } = status.data

  if (symbol.getKind() === 'typeAlias') {
    return (
      <Div
        marginTop={referenceTokens.space.lg}
        display="grid"
        gap={referenceTokens.space.sm}
      >
        <Small color={referenceTokens.color.muted}>Definition</Small>
        <Code
          display="block"
          fontFamily={referenceTokens.font.mono}
          padding={referenceTokens.space.sm}
          background={referenceTokens.color.subtleBackground}
        >
          {symbol.getUnderlyingType()?.describe() ?? 'unknown'}
        </Code>
      </Div>
    )
  }

  return (
    <Div
      marginTop={referenceTokens.space.lg}
      display="grid"
      gap={referenceTokens.space.sm}
    >
      <Small color={referenceTokens.color.muted}>Members</Small>
      <Div overflow="auto">
        <Table
          width="100%"
          borderCollapse="collapse"
          css={{ tableLayout: 'fixed', minWidth: '42rem' }}
        >
          <Thead background={referenceTokens.color.subtleBackground}>
            <Tr>
              <Th
                textAlign="left"
                verticalAlign="top"
                padding={referenceTokens.space.sm}
                borderWidth="1px"
                borderStyle="solid"
                borderColor={referenceTokens.color.border}
              >
                <Span>Name</Span>
              </Th>
              <Th
                textAlign="left"
                verticalAlign="top"
                padding={referenceTokens.space.sm}
                borderWidth="1px"
                borderStyle="solid"
                borderColor={referenceTokens.color.border}
              >
                <Span>Type</Span>
              </Th>
              <Th
                textAlign="left"
                verticalAlign="top"
                padding={referenceTokens.space.sm}
                borderWidth="1px"
                borderStyle="solid"
                borderColor={referenceTokens.color.border}
              >
                <Span>Modifiers</Span>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {members.map(member => (
              <Tr key={member.getName()}>
                <Td
                  verticalAlign="top"
                  padding={referenceTokens.space.sm}
                  borderWidth="1px"
                  borderStyle="solid"
                  borderColor={referenceTokens.color.border}
                >
                  <Code fontFamily={referenceTokens.font.mono}>{member.getName()}</Code>
                </Td>
                <Td
                  verticalAlign="top"
                  padding={referenceTokens.space.sm}
                  borderWidth="1px"
                  borderStyle="solid"
                  borderColor={referenceTokens.color.border}
                >
                  <Code fontFamily={referenceTokens.font.mono}>
                    {member.getType()?.describe() ?? 'unknown'}
                  </Code>
                </Td>
                <Td
                  verticalAlign="top"
                  padding={referenceTokens.space.sm}
                  borderWidth="1px"
                  borderStyle="solid"
                  borderColor={referenceTokens.color.border}
                >
                  {formatModifiers(member)}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Div>
    </Div>
  )
}

export function createReferenceComponent(loadRuntime: ReferenceRuntimeLoader) {
  let apiPromise: Promise<TastyApi> | undefined

  function getReferenceApi(): Promise<TastyApi> {
    if (!apiPromise) {
      apiPromise = loadRuntime().then(async (runtime) => {
        const api = createTastyApiFromManifest({
          manifest: runtime.manifest,
          importer: runtime.importTastyArtifact,
        })
        await api.ready()
        return api
      })
    }

    return apiPromise
  }

  async function loadReferenceState(name: string): Promise<LoadedReferenceState> {
    const api = await getReferenceApi()
    const symbol = await api.loadSymbolByName(name)
    const members =
      symbol.getKind() === 'interface'
        ? await api.graph.flattenInterfaceMembers(symbol)
        : []

    return {
      symbol,
      members,
    }
  }

  function Reference({ name }: ReferenceProps) {
    const [status, setStatus] = React.useState<ReferenceStatus>({ state: 'loading' })

    React.useEffect(() => {
      let active = true
      setStatus({ state: 'loading' })

      void loadReferenceState(name)
        .then(data => {
          if (!active) return
          setStatus({ state: 'ready', data })
        })
        .catch((error: unknown) => {
          if (!active) return
          const message = error instanceof Error ? error.message : String(error)
          setStatus({ state: 'error', message })
        })

      return () => {
        active = false
      }
    }, [name])

    return (
      <Div
        css={{
          color: referenceTokens.color.foreground,
          background: referenceTokens.color.background,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: referenceTokens.color.border,
          padding: referenceTokens.space.lg,
        }}
      >
        <H2 margin="0 0 0.5rem 0" fontSize="1rem">
          Reference
        </H2>
        {renderSummary(status, name)}
        {renderContent(status)}
      </Div>
    )
  }

  Reference.displayName = 'Reference'
  return Reference
}
