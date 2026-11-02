import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { editor } from './lib/state/editor.svelte'

// iOS turns transparent home-screen icons black, so iPhones and iPads get an
// opaque icon. It's added here, on iOS only, because other browsers (Firefox on
// Android) would use it too, in place of the transparent favicon. Safari reads
// the page at "Add to Home Screen" time, so a link added now still counts.
// (iPads report themselves as Macs, but have touch.)
const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
if (ios) {
  const link = document.createElement('link')
  link.rel = 'apple-touch-icon'
  link.href = './apple-touch-icon.png'
  document.head.append(link)
}

// Dev only: lets browser test scripts read and drive the live editor.
if (import.meta.env.DEV) Object.assign(window, { __editor: editor })

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
