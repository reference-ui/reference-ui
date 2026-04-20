import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const jsxNamesPath = join(packageRoot, 'src', 'jsx-names.ts')
const iconComponentsPath = join(
  packageRoot,
  '..',
  'reference-core',
  'src',
  'system',
  'panda',
  'config',
  'icon-components.ts'
)

function readConstArray(source, constName) {
  const pattern = new RegExp(`export const ${constName} = (\\[[\\s\\S]*?\\]) as const`)
  const match = source.match(pattern)
  if (!match) {
    throw new Error(`Unable to find ${constName}`)
  }

  return JSON.parse(match[1])
}

const [jsxNamesSource, iconComponentsSource] = await Promise.all([
  readFile(jsxNamesPath, 'utf8'),
  readFile(iconComponentsPath, 'utf8'),
])

const jsxNames = readConstArray(jsxNamesSource, 'ICON_JSX_NAMES')
const iconComponents = readConstArray(iconComponentsSource, 'ICON_COMPONENT_NAMES')

if (JSON.stringify(jsxNames) !== JSON.stringify(iconComponents)) {
  throw new Error('ICON_COMPONENT_NAMES does not match ICON_JSX_NAMES')
}

console.error(`reference-icons: icon-components parity ok (${jsxNames.length} names)`)