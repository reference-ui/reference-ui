/**
 * Case specification for TST-SIG-03.
 * Method, call and construct signatures carry their parameters, return type and type parameters as a
 * function type, every overload is a member of its own (also in the display projection), and a method
 * stays kind `method`.
 * Proves the signature lowering in interface member extraction.
 */
import { expect } from 'vitest'
import { formatTastyCallableSignature } from '../../../js/index.js'
import type { StationSpec } from '../../../../../testing/index.js'
import type { TastyCaseResult } from '../../harness/helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-SIG-03',
  async verify({ api }) {
    const notifier = await api.loadSymbolByName('Notifier')
    const members = notifier.getMembers()
    const named = (name: string) => members.filter(member => member.getName() === name)
    const signatureOf = (member: (typeof members)[number]) => {
      const type = member.getType()
      return type ? formatTastyCallableSignature(type) : undefined
    }

    const [call] = named('[call]')
    expect(call?.getKind()).toBe('call')
    expect(signatureOf(call!)).toBe('(message: string, options?: { ... }) => string')
    expect(call?.getParameters().map(param => param.optional)).toEqual([false, true])

    const [construct] = named('[new]')
    expect(construct?.getKind()).toBe('construct')
    expect(signatureOf(construct!)).toBe('new (name: string) => Notifier')

    const [success] = named('success')
    expect(success?.getKind()).toBe('method')
    expect(success?.getParameters().map(param => param.name)).toEqual(['message', '...rest'])

    const [identity] = named('identity')
    expect(identity?.getType()?.getRaw()).toMatchObject({
      kind: 'function',
      params: [{ name: 'value', typeRef: { name: 'Item', typeParameter: true } }],
      returnType: { name: 'Item', typeParameter: true },
    })

    const [clear] = named('clear')
    expect(signatureOf(clear!)).toBe('() => any')

    const finds = named('find')
    expect(finds.map(signatureOf)).toEqual([
      '(id: string) => string',
      '(id: number, fallback?: string) => string | undefined',
    ])

    const displayed = await notifier.getDisplayMembers()
    expect(displayed.filter(member => member.getName() === 'find').map(signatureOf)).toEqual(
      finds.map(signatureOf)
    )

    const [onChange] = named('onChange')
    expect(onChange?.getKind()).toBe('property')
    expect(signatureOf(onChange!)).toBe('(count: number, previous: number) => void')
  },
}

export default spec
