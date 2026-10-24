/**
 * Member refs through copies (ATM-SITE-111). One origin file exports a member object
 * (`O = { c: 'red' }`) and a host holder (`NS = { Panel: Div }`); a middle file copies both
 * (`T = NS`, `Q = O`). Three consumers read them: `direct.tsx` imports the origin, `samefile.tsx`
 * copies the imports in its own file, `exported.tsx` imports the middle file's copies. Each reads
 * `css({ color: X.c })` and `<X.Panel p="4r" />`. The three files must mint the same wants, share
 * one class per atom, and report nothing.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec, type CompileResult } from '../../harness/helpers.js'

const FILES = ['direct.tsx', 'samefile.tsx', 'exported.tsx']

/** The wants minted in one consumer file, without their spelling or position, sorted. */
function wantsIn(result: CompileResult, file: string): string[] {
  return (result.wants ?? [])
    .filter(want => want.file?.endsWith(`/${file}`))
    .map(want => JSON.stringify([want.prop, want.value, want.when, want.important, want.backing ?? null]))
    .sort()
}

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-111',
  verify(result) {
    const [direct, samefile, exported] = FILES.map(file => wantsIn(result, file))
    expect(direct).toHaveLength(2)
    expect(samefile).toEqual(direct)
    expect(exported).toEqual(direct)

    expect(result.css?.classes).toEqual({
      'color:red': '@reference-ui/lib__c_red',
      'p:4r': '@reference-ui/lib__p_4r',
    })
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
