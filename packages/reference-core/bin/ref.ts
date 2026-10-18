#!/usr/bin/env node
// ref — the Neo host CLI entry. It takes the raw argv tail and emits the
// process exit code, nothing else: Commander wiring, the sync/clean/watch
// runs, and every human line live in src/cli/ by the thinness law.
import { runCli } from '../src/cli/index.ts';

const code = await runCli(process.argv.slice(2));
process.exit(code);
