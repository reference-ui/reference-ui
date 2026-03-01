/**
 * Register tokens with the CLI. Only run during ref sync – do not import at runtime.
 */

import { tokens } from '@reference-ui/system'
import { tokensConfig } from './tokens'

tokens(tokensConfig)
