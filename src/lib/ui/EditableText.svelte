<script lang="ts">
  // A plain-text editable box that cooperates with undo/redo:
  // - while focused, its DOM is never rewritten, so the browser's native
  //   Ctrl+Z / Ctrl+Y keep working inside it;
  // - on blur, the edit is handed to `onchange` (one app-history step).
  let {
    value,
    onchange,
    placeholder = '',
    multiline = false,
  }: {
    value: string
    onchange: (value: string) => void
    placeholder?: string
    multiline?: boolean
  } = $props()

  let el = $state<HTMLElement>()

  // Sync from the model only when the user isn't editing (e.g. after undo).
  $effect(() => {
    const next = value
    if (el && document.activeElement !== el && readText(el) !== next) el.textContent = next
  })

  function readText(node: HTMLElement): string {
    const text = node.innerText.replace(/\n$/, '')
    return multiline ? text : text.replace(/\n/g, ' ')
  }

  function onblur() {
    if (!el) return
    const text = readText(el)
    // Leave no stray <br> behind so the :empty placeholder shows again.
    if (text === '') el.textContent = ''
    if (text !== value) onchange(text)
  }

  function onkeydown(event: KeyboardEvent) {
    if (!multiline && event.key === 'Enter') {
      event.preventDefault()
      el?.blur()
    }
  }
</script>

<div
  bind:this={el}
  class="editable"
  class:multiline
  contenteditable="plaintext-only"
  role="textbox"
  tabindex="0"
  aria-multiline={multiline}
  aria-label={placeholder}
  data-placeholder={placeholder}
  {onblur}
  {onkeydown}
></div>

<style>
  .editable {
    outline: none;
    white-space: nowrap;
    min-width: 1ch;
    cursor: text;
  }

  .editable.multiline {
    white-space: pre-wrap;
  }

  .editable:focus {
    background: rgb(70 120 200 / 0.08);
  }

  .editable:empty::before {
    content: attr(data-placeholder);
    opacity: 0.3;
  }

  /* Placeholders are an editing aid only; never exported. */
  :global(.exporting) .editable:empty::before {
    content: none;
  }
</style>
