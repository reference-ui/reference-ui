import { HomeIcon, SearchIcon, SettingsIcon } from '@reference-ui/lib'

/** Three icons: default size, a size token, and the filled variant. */
export function IconsDemo() {
  return (
    <>
      <SearchIcon aria-label="Search" />
      <SettingsIcon size="lg" aria-label="Settings" />
      <HomeIcon variant="filled" size="lg" aria-label="Home" />
    </>
  )
}
