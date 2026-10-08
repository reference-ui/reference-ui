// Registers the census ESM loader hooks for the process.
// Run the runner as: node --import <this-file> run.mjs <cwd>
import { register } from 'node:module'

register('./hooks.mjs', import.meta.url)
