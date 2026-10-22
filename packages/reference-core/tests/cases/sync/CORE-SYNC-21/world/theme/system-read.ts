// Theme fragment for the SYNC-21 world: it reads baseSystem while sync evaluates it.
// It takes nothing; evaluation throws on the baseSystem.name read before the :root rule would be emitted.
import { baseSystem, globalCss } from '@reference-ui/system'

globalCss({
  ':root': {
    '--system-name': baseSystem.name,
  },
})
