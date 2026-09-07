import type * as React from 'react'

export interface BookStory {
  name: string
  component: React.ComponentType<any>
}

export interface BookMeta {
  title?: string
  category?: string
  description?: string
}

export interface BookModule {
  default?: React.ComponentType<any> | Record<string, React.ComponentType<any>>
  meta?: BookMeta
  [key: string]: any
}

export interface BookEntry {
  id: string
  name: string
  title: string
  category: string
  filePath: string
  module: BookModule
  stories: BookStory[]
}

export interface BookCategory {
  name: string
  entries: BookEntry[]
}

export type ViewportPreset = 'full' | 'mobile' | 'tablet' | 'desktop'

export interface ViewportConfig {
  id: ViewportPreset
  label: string
  width: string
  height: string
}
