import * as React from 'react'
import { createRoot } from 'react-dom/client'
import './app/book.css'
import { BookShell } from './app/BookShell'

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <BookShell />
    </React.StrictMode>
  )
}
