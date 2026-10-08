import { dynamic, observed } from './recipes'
import { ghost } from '@/recipes'

observed({ tone: { base: 'quiet', md: 'loud' } })
dynamic({ ...props })
ghost({ kind: 'plain' })
