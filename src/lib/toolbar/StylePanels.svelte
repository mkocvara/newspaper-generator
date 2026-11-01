<script lang="ts">
  import type { Attachment } from 'svelte/attachments'
  import { fontStack, loadFont, parseFontInput } from '../fonts'
  import type { Fonts, FrameStyle, Style } from '../model/types'
  import { EFFECTS, ORNAMENTS } from '../page/nameDecoration'
  import { editor } from '../state/editor.svelte'
  import { FALLBACK_FONT, fontLibrary } from '../state/fontLibrary.svelte'
  import FontSelect from '../ui/FontSelect.svelte'
  import Panel from '../ui/Panel.svelte'

  const style = $derived(editor.page.style)

  const set = (change: (style: Style) => void) => editor.update((page) => change(page.style))

  // --- Fonts
  const FONT_ROLES: [keyof Fonts, string][] = [
    ['body', 'Body text'],
    ['heading', 'Headings'],
    ['caption', 'Image descriptions'],
    ['eyecatcher', 'Eyecatchers'],
    ['headerFooter', 'Header & footer'],
    ['name', 'Newspaper name'],
  ]

  // The font list, plus any font in use that was removed from it (e.g. after
  // undoing a removal) so the menus can still show it.
  const fontOptions = $derived(
    [...new Set([...fontLibrary.families, ...Object.values(style.fonts)])].sort((a, b) => a.localeCompare(b)),
  )
  const libraryFamilies = $derived([...fontLibrary.families].sort((a, b) => a.localeCompare(b)))
  const fontSources = () => [...style.customFonts, ...fontLibrary.fonts]

  function setFont(role: keyof Fonts, family: string) {
    loadFont(family, fontSources())
    set((s) => {
      s.fonts[role] = family
      s.customFonts = fontLibrary.sourcesFor(s.fonts)
    })
  }

  // Removing a font from the list switches text using it to the fallback, as
  // one undoable step. The list itself is per browser and not undoable.
  function removeFont(family: string) {
    fontLibrary.remove(family)
    set((s) => {
      for (const [role] of FONT_ROLES) if (s.fonts[role] === family) s.fonts[role] = FALLBACK_FONT
      s.customFonts = fontLibrary.sourcesFor(s.fonts)
    })
  }

  const usedBy = (family: string) =>
    FONT_ROLES.filter(([role]) => style.fonts[role] === family).map(([, label]) => label)

  // The Fonts panel shows either the font menus or the font list; it opens on
  // the menus.
  let managing = $state(false)
  const resetViewOnClose: Attachment = () => () => (managing = false)

  // The font menus show each name in its own font, so load them all when the
  // Fonts panel opens, glyphs included, so the names don't flash in a fallback
  // font when a menu first opens.
  const loadFontOptions: Attachment = () => {
    for (const family of fontOptions) {
      loadFont(family, fontSources()).then((ok) => {
        if (ok) document.fonts.load(`16px "${family}"`, family)
      })
    }
  }

  let fontInput = $state('')
  let fontMessage = $state('')
  // The panel's content goes away when it closes; take the message with it.
  const clearMessageOnClose: Attachment = () => () => (fontMessage = '')

  async function addFont() {
    const fonts = parseFontInput(fontInput)
    if (fonts.length === 0) {
      fontMessage = 'Enter a font name or a Google Fonts link.'
      return
    }
    fontMessage = 'Loading…'
    const results = await Promise.all(fonts.map((f) => loadFont(f.family, fonts)))
    const added = fonts.filter((_, i) => results[i])
    if (added.length) {
      fontLibrary.add(added)
      fontInput = ''
    }
    const failed = fonts.filter((_, i) => !results[i]).map((f) => f.family)
    fontMessage = failed.length
      ? `Couldn't load ${failed.join(', ')}. Check the name on fonts.google.com.`
      : `Added ${added.map((f) => f.family).join(', ')}.`
  }

  // --- Numbers: committed on change (blur, Enter or a spinner click).
  function numberSetter(min: number, max: number, apply: (s: Style, v: number) => void) {
    return (event: Event & { currentTarget: HTMLInputElement }) => {
      const value = Number(event.currentTarget.value)
      if (!Number.isFinite(value)) return
      set((s) => apply(s, Math.min(max, Math.max(min, value))))
    }
  }

  // Firefox and Chrome don't step a number input with the mouse wheel, so do
  // it while the input is focused: one step per wheel notch, committed at once.
  const wheelStep: Attachment<HTMLInputElement> = (input) => {
    const onWheel = (event: WheelEvent) => {
      if (document.activeElement !== input || event.deltaY === 0) return
      event.preventDefault()
      if (event.deltaY < 0) input.stepUp()
      else input.stepDown()
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }
    input.addEventListener('wheel', onWheel, { passive: false })
    return () => input.removeEventListener('wheel', onWheel)
  }

  // --- Colour: live preview while picking, one undo step for the whole pick.
  let picking = false
  function previewColor(event: Event & { currentTarget: HTMLInputElement }) {
    if (!picking) {
      editor.beginGesture()
      picking = true
    }
    editor.page.style.border.color = event.currentTarget.value
  }
  function commitColor() {
    editor.endGesture()
    picking = false
  }

  const FRAME_STYLES: [FrameStyle, string][] = [
    ['single', 'Single line'],
    ['double', 'Double line'],
    ['thick-outer', 'Thick & thin (thick outside)'],
    ['thin-outer', 'Thick & thin (thin outside)'],
  ]
</script>

<Panel label="Fonts">
  <div class="form fonts" {@attach loadFontOptions} {@attach resetViewOnClose}>
    {#if !managing}
      {#each FONT_ROLES as [role, label] (role)}
        <div class="row">
          <span>{label}</span>
          <FontSelect
            value={style.fonts[role]}
            options={fontOptions}
            {label}
            onchange={(family) => setFont(role, family)}
          />
        </div>
      {/each}
      <button type="button" class="panel-button manage" onclick={() => (managing = true)}>Manage fonts…</button>
    {:else}
      <div class="manage-head">
        <button type="button" class="link-button" onclick={() => (managing = false)}>‹ Back</button>
        <span>Your fonts</span>
      </div>

      <ul class="font-list" aria-label="Your fonts">
        {#each libraryFamilies as family (family)}
          {@const uses = usedBy(family)}
          <li>
            <span class="font-name" style:font-family={fontStack(family)}>{family}</span>
            {#if uses.length}<span class="in-use" title="Used for {uses.join(', ')}">in use</span>{/if}
            <button
              type="button"
              class="remove"
              aria-label="Remove {family}"
              title={uses.length
                ? `Remove ${family}. ${uses.join(', ')} will switch to ${FALLBACK_FONT}.`
                : `Remove ${family}`}
              onclick={() => removeFont(family)}>×</button
            >
          </li>
        {:else}
          <li class="empty">No fonts. Add one below or restore the default fonts.</li>
        {/each}
      </ul>

      <div class="add-font">
        <span class="hint"
          >Add a <a href="https://fonts.google.com/" target="_blank" rel="noopener noreferrer">Google Font</a> by name or link</span
        >
        <div class="inline">
          <input
            type="text"
            placeholder="e.g. Crimson Text"
            bind:value={fontInput}
            onkeydown={(e) => e.key === 'Enter' && addFont()}
          />
          <button type="button" class="panel-button" onclick={addFont}>Add</button>
        </div>
        {#if fontMessage}<span class="hint" role="status" {@attach clearMessageOnClose}>{fontMessage}</span>{/if}
      </div>

      {#if fontLibrary.missingDefaults.length}
        <button type="button" class="link-button" onclick={() => fontLibrary.restoreDefaults()}>
          Restore default fonts ({fontLibrary.missingDefaults.length} removed)
        </button>
      {/if}
      <span class="hint">This list is kept in this browser and shared by all your pages.</span>
    {/if}
  </div>
</Panel>

<Panel label="Text sizes">
  <div class="form">
    <label class="row">
      <span>Body text</span>
      <input
        type="number"
        min="5"
        max="20"
        step="0.5"
        value={style.sizes.bodyPt}
        onchange={numberSetter(5, 20, (s, v) => (s.sizes.bodyPt = v))}
        {@attach wheelStep}
      />
    </label>
    <label class="row">
      <span>Headings</span>
      <input
        type="number"
        min="6"
        max="48"
        step="0.5"
        value={style.sizes.headingPt}
        onchange={numberSetter(6, 48, (s, v) => (s.sizes.headingPt = v))}
        {@attach wheelStep}
      />
    </label>
    <label class="row">
      <span>Image descriptions</span>
      <input
        type="number"
        min="4"
        max="16"
        step="0.5"
        value={style.sizes.captionPt}
        onchange={numberSetter(4, 16, (s, v) => (s.sizes.captionPt = v))}
        {@attach wheelStep}
      />
    </label>
    <span class="hint"
      >Sizes are in points. When article text doesn't fit its cell, its body text shrinks first, then its heading.
      Header, footer and eyecatcher text sizes follow their cells.</span
    >
  </div>
</Panel>

<Panel label="Frame & borders">
  <div class="form">
    <fieldset>
      <legend>Header & footer frame</legend>
      {#each FRAME_STYLES as [value, label] (value)}
        <label class="choice">
          <input
            type="radio"
            name="frame-style"
            {value}
            checked={style.frameStyle === value}
            onchange={() => set((s) => (s.frameStyle = value))}
          />
          {label}
        </label>
      {/each}
    </fieldset>
    <label class="row">
      <span>Cell border thickness (pt)</span>
      <input
        type="number"
        min="0"
        max="6"
        step="0.25"
        value={style.border.widthPt}
        onchange={numberSetter(0, 6, (s, v) => (s.border.widthPt = v))}
      />
    </label>
    <label class="row">
      <span>Cell border colour</span>
      <input type="color" value={style.border.color} oninput={previewColor} onchange={commitColor} />
    </label>
  </div>
</Panel>

<Panel label="Newspaper name">
  <div class="form">
    <label class="row">
      <span>Ornaments</span>
      <select
        value={style.nameDecoration.ornament}
        onchange={(e) => {
          const ornament = e.currentTarget.value as Style['nameDecoration']['ornament']
          set((s) => (s.nameDecoration.ornament = ornament))
        }}
      >
        {#each ORNAMENTS as o (o.value)}
          <option value={o.value}>{o.symbols ? `${o.label}  ${o.symbols[0]} … ${o.symbols[1]}` : o.label}</option>
        {/each}
      </select>
    </label>
    {#if style.nameDecoration.ornament === 'custom'}
      <label class="row">
        <span>Before the name</span>
        <input
          type="text"
          class="symbol"
          placeholder="e.g. ✦"
          value={style.nameDecoration.customBefore}
          onchange={(e) => {
            const value = e.currentTarget.value
            set((s) => (s.nameDecoration.customBefore = value))
          }}
        />
      </label>
      <label class="row">
        <span>After the name</span>
        <input
          type="text"
          class="symbol"
          placeholder="same as before"
          value={style.nameDecoration.customAfter}
          onchange={(e) => {
            const value = e.currentTarget.value
            set((s) => (s.nameDecoration.customAfter = value))
          }}
        />
      </label>
      <span class="hint">Any Unicode symbols, e.g. ✦ ✠ ☼ ✶ » «</span>
    {/if}
    <label class="row">
      <span>Effect</span>
      <select
        value={style.nameDecoration.effect}
        onchange={(e) => {
          const effect = e.currentTarget.value as Style['nameDecoration']['effect']
          set((s) => (s.nameDecoration.effect = effect))
        }}
      >
        {#each EFFECTS as effect (effect.value)}
          <option value={effect.value}>{effect.label}</option>
        {/each}
      </select>
    </label>
  </div>
</Panel>

<style>
  .form {
    display: grid;
    gap: 10px;
    min-width: 300px;
  }

  .form.fonts {
    min-width: 350px;
  }

  .row {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 12px;
  }

  select,
  input[type='text'],
  input[type='number'] {
    font: inherit;
    padding: 3px 6px;
    border: 1px solid rgb(0 0 0 / 0.25);
    border-radius: 4px;
    background: #fff;
    color: #222;
  }

  select {
    max-width: 210px;
  }

  input[type='number'] {
    width: 72px;
  }

  input.symbol {
    width: 110px;
  }

  input[type='color'] {
    width: 48px;
    height: 26px;
    padding: 0;
    border: 1px solid rgb(0 0 0 / 0.25);
    border-radius: 4px;
  }

  fieldset {
    display: grid;
    gap: 4px;
    margin: 0;
    padding: 8px 10px;
    border: 1px solid rgb(0 0 0 / 0.15);
    border-radius: 6px;
  }

  legend {
    padding: 0 4px;
  }

  .choice {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .panel-button:hover {
    background: #e8e8e8;
  }

  .manage {
    justify-self: start;
    margin-top: 2px;
  }

  .link-button {
    justify-self: start;
    padding: 0;
    border: none;
    background: none;
    color: #2f5ea8;
    font: inherit;
    cursor: pointer;
  }

  .link-button:hover {
    text-decoration: underline;
  }

  .manage-head {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }

  .manage-head span {
    font-weight: 600;
  }

  .font-list {
    max-height: 300px;
    overflow-y: auto;
    margin: 0;
    padding: 4px;
    border: 1px solid rgb(0 0 0 / 0.15);
    border-radius: 6px;
    list-style: none;
  }

  .font-list li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 4px 2px 8px;
    border-radius: 4px;
  }

  .font-list li:hover {
    background: rgb(70 120 200 / 0.08);
  }

  .font-name {
    flex: 1;
    font-size: 16px;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .in-use {
    color: #666;
    font-size: 11px;
  }

  .remove {
    width: 22px;
    height: 22px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 4px;
    background: none;
    color: #888;
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
  }

  .remove:hover {
    border-color: rgb(180 40 40 / 0.4);
    background: rgb(180 40 40 / 0.08);
    color: #b42828;
  }

  .font-list .empty {
    color: #666;
    font-size: 12px;
  }

  .add-font {
    display: grid;
    gap: 4px;
    padding-top: 8px;
    border-top: 1px solid rgb(0 0 0 / 0.1);
  }

  .inline {
    display: flex;
    gap: 6px;
  }

  .inline input {
    flex: 1;
  }

  .panel-button {
    font: inherit;
    padding: 3px 12px;
    border: 1px solid rgb(0 0 0 / 0.25);
    border-radius: 4px;
    background: #f4f4f4;
    cursor: pointer;
  }

  .hint {
    color: #666;
    font-size: 12px;
  }

  .hint a {
    color: #2f5ea8;
  }
</style>
