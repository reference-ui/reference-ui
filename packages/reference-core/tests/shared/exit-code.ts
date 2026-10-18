/**
 * Exit codes for the child processes the neo tooling runs. A child killed by a signal has no exit code and
 * must never read as success, so exitCodeOf maps it to 128 plus the signal number (the shell convention) and
 * names the signal. execExitCode reads the error execFile reports for a failed child under the same rule.
 */
import { constants as signalConstants } from 'node:os';

function signalNumber(signal: string): number {
  const entry = Object.entries(signalConstants.signals).find(([name]) => name === signal);
  return entry ? entry[1] : 1;
}

export function exitCodeOf(code: number | null, signal: string | null): number {
  if (code !== null) return code;
  if (!signal) return 1;
  const exitCode = 128 + signalNumber(signal);
  console.error(`child process was killed by ${signal} (exit ${exitCode}).`);
  return exitCode;
}

// execFile reports a failed child as an error carrying its numeric code, or only a signal when it was killed.
export function execExitCode(err: { code?: unknown; signal?: unknown } | null): number {
  if (!err) return 0;
  const code = typeof err.code === 'number' ? err.code : null;
  const signal = typeof err.signal === 'string' ? err.signal : null;
  return exitCodeOf(code, signal);
}
