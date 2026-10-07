// Writes the bench MDX set: `count` real fragments plus `count` fence-only
// decoys under theme/mdx. It takes the repo dir and the plan's mdxFiles count
// and returns the fragment count; deterministic bytes come from the mdx
// templates. Both generators route through this so the set is identical.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { mdxDecoy, mdxFragment } from '../templates/mdx.ts'

export function writeMdxFiles(dir: string, count: number): number {
  if (count <= 0) {
    return 0
  }
  const folder = join(dir, 'theme', 'mdx')
  mkdirSync(folder, { recursive: true })
  for (let index = 0; index < count; index += 1) {
    writeFileSync(join(folder, `frag${index}.mdx`), mdxFragment(index), 'utf-8')
    writeFileSync(join(folder, `decoy${index}.mdx`), mdxDecoy(index), 'utf-8')
  }
  return count
}
