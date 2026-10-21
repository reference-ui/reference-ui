/**
 * Child-side driver for the hook-cycle test, run through runIsolated in its own Node process.
 * It builds the tasty api over the given manifest with a type-parameter hook shaped like reference-core's projector: a
 * reference to `P` is answered with the display members of `Sys`, read through the displayMembersOf the walk hands in.
 * It returns those members, how often the hook ran and the runtime notices. It imports only the built dist, so a walk
 * that never returns ends the child, not the test worker.
 */
import { createTastyApi } from '../../../../dist/tasty.mjs'

export async function displayThroughHook(manifestPath) {
  let hookCalls = 0
  const api = createTastyApi({
    manifestPath,
    projectTypeParameterMembers: async ({ api: owner, reference, displayMembersOf }) => {
      if (reference.name !== 'P') return undefined
      hookCalls += 1
      const sys = await owner.loadSymbolByName('Sys')
      return displayMembersOf(sys)
    },
  })
  await api.ready()
  const sys = await api.loadSymbolByName('Sys')
  const members = await sys.getDisplayMembers()
  return {
    members: members.map(member => member.getName()).sort(),
    hookCalls,
    notices: api.getRuntimeNotices(),
  }
}
