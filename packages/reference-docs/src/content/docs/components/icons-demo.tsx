// Live Icons demo for the Icons component page.
// It takes nothing and emits the icon specimens. Colocated with the page that embeds it.
import { Div } from '@reference-ui/react'
import { HomeIcon, SearchIcon, SettingsIcon } from '@reference-ui/lib'

/** The three size names, then the filled variant. */
export function IconsDemo() {
  return (
    <Div display="flex" alignItems="center" gap="4r">
      <SearchIcon size="sm" role="img" aria-label="Search" />
      <SearchIcon role="img" aria-label="Search" />
      <SearchIcon size="lg" role="img" aria-label="Search" />
      <SettingsIcon size="lg" role="img" aria-label="Settings" />
      <HomeIcon variant="filled" size="lg" role="img" aria-label="Home" />
    </Div>
  )
}
