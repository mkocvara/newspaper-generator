import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { editor } from './lib/state/editor.svelte'

// Dev only: lets browser test scripts read and drive the live editor.
if (import.meta.env.DEV) Object.assign(window, { __editor: editor })

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
