/**
 * The one home for the file-reading helpers the quality gate shares. It takes absolute paths
 * and returns text plus line counts, so the runner and the metrics counter stop carrying rival
 * copies of the same loop. Sync reads serve the counter; the async batch read serves the gate tiers.
 */
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

// One file, synchronously. Returns null when the file cannot be read.
export function readTextFileSync(file: string): string | null {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

// Many files, asynchronously. Every input path gets a map entry; unreadable files map to null.
export async function readTextFiles(files: string[]): Promise<Map<string, string | null>> {
  const texts = new Map<string, string | null>();
  for (const f of files) {
    try {
      texts.set(f, await readFile(f, 'utf8'));
    } catch {
      texts.set(f, null);
    }
  }
  return texts;
}

// Line count matching the metrics tier: an empty file has zero lines, otherwise newline count plus one.
export function countLines(text: string): number {
  return text === '' ? 0 : text.split('\n').length;
}
