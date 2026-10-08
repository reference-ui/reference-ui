/**
 * Source code formatting utilities for Rust canon emitters.
 * Chunks array slices across line boundaries with consistent indentation and line breaks.
 * Used across HTML, CSS, and dialect emitter templates for readable generated source.
 */

export function formatChunks(items: string[], indent = '    ', perLine = 2): string {
  const lines: string[] = [];
  for (let i = 0; i < items.length; i += perLine) {
    const chunk = items.slice(i, i + perLine).join(', ');
    lines.push(`${indent}${chunk},`);
  }
  return lines.join('\n');
}
