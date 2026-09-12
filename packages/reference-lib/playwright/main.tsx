import * as React from 'react'
import { createHost } from 'ct-host'
import '@reference-ui/react/styles.css'
import '../book/app/book.css'

const stories = import.meta.glob('../src/**/*.story.{tsx,jsx}')
const id = (file: string) => file.replace(/^(\.\.\/)+src\//, '').replace(/\.story\.\w+$/, '')

async function resolve(storyId: string) {
  const sep = storyId.lastIndexOf('/')
  const [path, name] = [storyId.slice(0, sep), storyId.slice(sep + 1)]
  const file = Object.keys(stories).find((filePath) => id(filePath) === path || id(filePath).endsWith('/' + path))
  const mod = (file && (await stories[file]())) as Record<string, unknown> | undefined
  const Story = (mod?.[name] ?? mod?.default) as React.ComponentType<Record<string, unknown>> | undefined
  return Story
}

const host = createHost(document.getElementById('root')!)

window.mount = async ({ story, props }) => {
  const Story = await resolve(story)
  if (!Story) {
    throw new Error(`Unknown story: ${story}`)
  }
  document.documentElement.setAttribute('data-panda-theme', 'dark')
  document.documentElement.setAttribute('data-react-version', React.version)
  document.documentElement.style.colorScheme = 'dark'
  host.render(
    <React.StrictMode>
      <Story {...props} />
    </React.StrictMode>,
  )
}

window.unmount = async () => {
  host.unmount()
}
