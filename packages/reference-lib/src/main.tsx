import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { BookRoot } from './Book'

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <BookRoot />
    </React.StrictMode>
  )
}
