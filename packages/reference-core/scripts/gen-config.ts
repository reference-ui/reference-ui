#!/usr/bin/env npx tsx
/**
 * Generate font system and panda config before panda codegen.
 * Runs createFontSystem, createBoxPattern, and createPandaConfig.
 */
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createPandaConfig } from '../src/cli/panda/config/createPandaConfig'

const __dirname = dirname(fileURLToPath(import.meta.url))
const coreDir = resolve(__dirname, '..')
await createPandaConfig(coreDir)
