<script lang="ts">
  import type { Attachment } from 'svelte/attachments'
  import { fontStack, loadFont, parseFontInput } from '../fonts'
  import type { Fonts, FrameStyle, Style } from '../model/types'
  import { EFFECTS, ORNAMENTS, SYMBOL_CHOICES } from '../page/nameDecoration'
  import { PAPERS } from '../page/papers'
  import { i18n } from '../i18n/i18n.svelte'
  import { editor } from '../state/editor.svelte'
  import { FALLBACK_FONT, fontLibrary } from '../state/fontLibrary.svelte'
  import FontSelect from '../ui/FontSelect.svelte'
  import Panel from '../ui/Panel.svelte'

  const style = $derived(editor.page.style)

  const set = (change: (style: Style) => void) => editor.update((page) => change(page.style))

  // --- Fonts
  const FONT_ROLES: (keyof Fonts)[] = ['body', 'heading', 'caption', 'eyecatcher', 'headerFooter', 'name']

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
      for (const role of FONT_ROLES) if (s.fonts[role] === family) s.fonts[role] = FALLBACK_FONT
      s.customFonts = fontLibrary.sourcesFor(s.fonts)
    })
  }

  const usedBy = (family: string) =>
    FONT_ROLES.filter((role) => style.fonts[role] === family).map((role) => i18n.t.fonts.roles[role])

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
      fontMessage = i18n.t.fonts.needInput
      return
    }
    fontMessage = i18n.t.fonts.loading
    const results = await Promise.all(fonts.map((f) => loadFont(f.family, fonts)))
    const added = fonts.filter((_, i) => results[i])
    if (added.length) {
      fontLibrary.add(added)
      fontInput = ''
    }
    const failed = fonts.filter((_, i) => !results[i]).map((f) => f.family)
    fontMessage = failed.length
      ? i18n.t.fonts.couldNotLoad(failed)
      : i18n.t.fonts.added(added.map((f) => f.family))
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

  // --- Ink: live preview while picking, one undo step for the whole pick.
  // Names in the UI text (i18n `ink.presetNames`), in this order.
  const INK_PRESETS = ['#1b1a17', '#5b3a1e', '#1f2f55', '#6e1a1a', '#1f4a2c']
  let picking = false
  function previewInk(event: Event & { currentTarget: HTMLInputElement }) {
    if (!picking) {
      editor.beginGesture()
      picking = true
    }
    editor.page.style.ink = event.currentTarget.value
  }
  function commitInk() {
    editor.endGesture()
    picking = false
  }

  // --- Custom ornament symbols. The grid inserts into whichever field was
  // focused last (Before until one is), at its cursor, as one undoable step.
  type SymbolField = 'customBefore' | 'customAfter'
  let symbolField = $state<SymbolField>('customBefore')
  const symbolInputs = $state<Partial<Record<SymbolField, HTMLInputElement>>>({})

  function insertSymbol(symbol: string) {
    const input = symbolInputs[symbolField]
    if (!input) return
    const start = input.selectionStart ?? input.value.length
    const end = input.selectionEnd ?? start
    const value = input.value.slice(0, start) + symbol + input.value.slice(end)
    input.value = value
    const field = symbolField
    set((s) => (s.nameDecoration[field] = value))
    input.focus()
    input.setSelectionRange(start + symbol.length, start + symbol.length)
  }

  const FRAME_STYLES: FrameStyle[] = [
    'single',
    'double',
    'thick-outer',
    'thin-outer',
    'dashed',
    'dotted',
    'dash-dot',
    'zigzag',
    'wave',
  ]
</script>

<Panel label={i18n.t.fonts.panel}>
  <div class="form fonts" {@attach loadFontOptions} {@attach resetViewOnClose}>
    {#if !managing}
      {#each FONT_ROLES as role (role)}
        <div class="row">
          <span>{i18n.t.fonts.roles[role]}</span>
          <FontSelect
            value={style.fonts[role]}
            options={fontOptions}
            label={i18n.t.fonts.roles[role]}
            onchange={(family) => setFont(role, family)}
          />
        </div>
      {/each}
      <button type="button" class="panel-button manage" onclick={() => (managing = true)}>{i18n.t.fonts.manage}</button>
    {:else}
      <div class="manage-head">
        <button type="button" class="panel-button" onclick={() => (managing = false)}>{i18n.t.fonts.back}</button>
        <span>{i18n.t.fonts.yourFonts}</span>
      </div>

      <ul class="font-list" aria-label={i18n.t.fonts.yourFonts}>
        {#each libraryFamilies as family (family)}
          {@const uses = usedBy(family)}
          <li>
            <span class="font-name" style:font-family={fontStack(family)}>{family}</span>
            {#if uses.length}<span class="in-use" title={i18n.t.fonts.usedFor(uses)}>{i18n.t.fonts.inUse}</span>{/if}
            <button
              type="button"
              class="remove"
              aria-label={i18n.t.fonts.remove(family)}
              title={uses.length ? i18n.t.fonts.removeInUse(family, uses, FALLBACK_FONT) : i18n.t.fonts.remove(family)}
              onclick={() => removeFont(family)}>×</button
            >
          </li>
        {:else}
          <li class="empty">{i18n.t.fonts.none}</li>
        {/each}
      </ul>

      <div class="add-font">
        <span class="hint"
          >{i18n.t.fonts.addBefore}<a href="https://fonts.google.com/" target="_blank" rel="noopener noreferrer"
            >{i18n.t.fonts.addLink}</a
          >{i18n.t.fonts.addAfter}</span
        >
        <div class="inline">
          <input
            type="text"
            placeholder={i18n.t.fonts.addPlaceholder}
            bind:value={fontInput}
            onkeydown={(e) => e.key === 'Enter' && addFont()}
          />
          <button type="button" class="panel-button" onclick={addFont}>{i18n.t.fonts.add}</button>
        </div>
        {#if fontMessage}<span class="hint" role="status" {@attach clearMessageOnClose}>{fontMessage}</span>{/if}
      </div>

      {#if fontLibrary.missingDefaults.length}
        <button type="button" class="panel-button restore" onclick={() => fontLibrary.restoreDefaults()}>
          {i18n.t.fonts.restore(fontLibrary.missingDefaults.length)}
        </button>
      {/if}
      <span class="hint">{i18n.t.fonts.listNote}</span>
    {/if}
  </div>
</Panel>

<Panel label={i18n.t.sizes.panel}>
  <div class="form">
    <label class="row">
      <span>{i18n.t.sizes.body}</span>
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
      <span>{i18n.t.sizes.heading}</span>
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
      <span>{i18n.t.sizes.caption}</span>
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
    <span class="hint">{i18n.t.sizes.hint}</span>
  </div>
</Panel>

<Panel label={i18n.t.frame.panel}>
  <div class="form">
    <fieldset>
      <legend>{i18n.t.frame.legend}</legend>
      {#each FRAME_STYLES as value (value)}
        <label class="choice">
          <input
            type="radio"
            name="frame-style"
            {value}
            checked={style.frameStyle === value}
            onchange={() => set((s) => (s.frameStyle = value))}
          />
          {i18n.t.frame.styles[value]}
        </label>
      {/each}
    </fieldset>
    <label class="row">
      <span>{i18n.t.frame.borderWidth}</span>
      <input
        type="number"
        min="0"
        max="6"
        step="0.25"
        value={style.border.widthPt}
        onchange={numberSetter(0, 6, (s, v) => (s.border.widthPt = v))}
        {@attach wheelStep}
      />
    </label>
  </div>
</Panel>

<Panel label={i18n.t.paper.panel}>
  <div class="papers" role="radiogroup" aria-label={i18n.t.paper.panel}>
    {#each PAPERS as paper (paper)}
      <button
        type="button"
        role="radio"
        class="paper-choice"
        aria-checked={style.paper === paper}
        onclick={() => set((s) => (s.paper = paper))}
      >
        <span class="paper-sample" aria-hidden="true"><span class="sheet paper-{paper}"></span></span>
        <span>{i18n.t.paper.styles[paper]}</span>
      </button>
    {/each}
  </div>
</Panel>

<Panel label={i18n.t.ink.panel}>
  <div class="form">
    <div class="swatches" role="group" aria-label={i18n.t.ink.presets}>
      {#each INK_PRESETS as color, i (color)}
        <button
          type="button"
          class="swatch"
          aria-label={i18n.t.ink.presetNames[i]}
          title={i18n.t.ink.presetNames[i]}
          aria-pressed={style.ink.toLowerCase() === color}
          style:--swatch={color}
          onclick={() => set((s) => (s.ink = color))}
        ></button>
      {/each}
    </div>
    <label class="row">
      <span>{i18n.t.ink.custom}</span>
      <input type="color" value={style.ink} oninput={previewInk} onchange={commitInk} />
    </label>
    <span class="hint">{i18n.t.ink.hint}</span>
  </div>
</Panel>

<Panel label={i18n.t.name.panel}>
  <div class="form">
    <label class="row">
      <span>{i18n.t.name.ornaments}</span>
      <select
        value={style.nameDecoration.ornament}
        onchange={(e) => {
          const ornament = e.currentTarget.value as Style['nameDecoration']['ornament']
          set((s) => (s.nameDecoration.ornament = ornament))
        }}
      >
        {#each ORNAMENTS as o (o.value)}
          {@const label = i18n.t.name.ornamentStyles[o.value]}
          <option value={o.value}>{o.symbols ? `${label}  ${o.symbols[0]} … ${o.symbols[1]}` : label}</option>
        {/each}
      </select>
    </label>
    {#if style.nameDecoration.ornament !== 'none' && style.nameDecoration.ornament !== 'rules'}
      <label class="row">
        <span>{i18n.t.name.ornamentSize}</span>
        <input
          type="number"
          min="30"
          max="250"
          step="10"
          value={style.nameDecoration.ornamentScale}
          onchange={numberSetter(30, 250, (s, v) => (s.nameDecoration.ornamentScale = v))}
          {@attach wheelStep}
        />
      </label>
      <span class="hint">{i18n.t.name.ornamentSizeHint}</span>
    {/if}
    {#if style.nameDecoration.ornament === 'custom'}
      <label class="row">
        <span>{i18n.t.name.before}</span>
        <input
          type="text"
          class="symbol"
          placeholder={i18n.t.name.beforePlaceholder}
          class:target={symbolField === 'customBefore'}
          bind:this={symbolInputs.customBefore}
          onfocus={() => (symbolField = 'customBefore')}
          value={style.nameDecoration.customBefore}
          onchange={(e) => {
            const value = e.currentTarget.value
            set((s) => (s.nameDecoration.customBefore = value))
          }}
        />
      </label>
      <label class="row">
        <span>{i18n.t.name.after}</span>
        <input
          type="text"
          class="symbol"
          placeholder={i18n.t.name.afterPlaceholder}
          class:target={symbolField === 'customAfter'}
          bind:this={symbolInputs.customAfter}
          onfocus={() => (symbolField = 'customAfter')}
          value={style.nameDecoration.customAfter}
          onchange={(e) => {
            const value = e.currentTarget.value
            set((s) => (s.nameDecoration.customAfter = value))
          }}
        />
      </label>
      <div class="symbols" role="group" aria-label={i18n.t.name.symbols}>
        {#each SYMBOL_CHOICES as symbol (symbol)}
          <button
            type="button"
            aria-label={symbolField === 'customBefore' ? i18n.t.name.insertBefore(symbol) : i18n.t.name.insertAfter(symbol)}
            style:font-family={fontStack(style.fonts.name)}
            onpointerdown={(e) => e.preventDefault()}
            onclick={() => insertSymbol(symbol)}>{symbol}</button
          >
        {/each}
      </div>
      <span class="hint">{i18n.t.name.symbolsHint}</span>
    {/if}
    <label class="row">
      <span>{i18n.t.name.effect}</span>
      <select
        value={style.nameDecoration.effect}
        onchange={(e) => {
          const effect = e.currentTarget.value as Style['nameDecoration']['effect']
          set((s) => (s.nameDecoration.effect = effect))
        }}
      >
        {#each EFFECTS as effect (effect)}
          <option value={effect}>{i18n.t.name.effects[effect]}</option>
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
    border: 1px solid var(--menu-field-border);
    border-radius: 4px;
    background: var(--menu-field);
    color: var(--menu-text);
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

  input.symbol.target {
    border-color: var(--menu-accent);
    box-shadow: 0 0 0 1px var(--menu-accent);
  }

  .symbols {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 3px;
    max-height: 200px;
    overflow-y: auto;
  }

  .symbols button {
    aspect-ratio: 1;
    padding: 0;
    border: 1px solid var(--menu-rule);
    border-radius: 4px;
    background: var(--menu-field);
    color: var(--menu-text);
    font-size: 17px;
    line-height: 1;
    cursor: pointer;
  }

  .symbols button:hover {
    border-color: var(--menu-accent);
    background: var(--menu-hover);
  }

  input[type='color'] {
    width: 48px;
    height: 26px;
    padding: 0;
    border: 1px solid var(--menu-field-border);
    border-radius: 4px;
  }

  .papers {
    display: grid;
    grid-template-columns: repeat(5, 84px);
    gap: 10px;
  }

  .paper-choice {
    display: grid;
    justify-items: center;
    gap: 6px;
    padding: 6px 4px;
    border: 2px solid transparent;
    border-radius: 6px;
    background: none;
    color: var(--menu-text);
    font: inherit;
    font-size: 12px;
    line-height: 1.2;
    text-align: center;
    cursor: pointer;
  }

  .paper-choice:hover {
    background: var(--menu-hover);
  }

  .paper-choice[aria-checked='true'] {
    border-color: var(--menu-accent);
  }

  /* A4 in miniature: the paper is drawn on a full-size sheet scaled down,
     so its mm-sized details (creases, edges) shrink in proportion. */
  .paper-sample {
    width: 63px;
    height: 89px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgb(0 0 0 / 0.35);
  }

  .sheet {
    display: block;
    width: 210mm;
    height: 297mm;
    /* 63px / 210mm */
    transform: scale(0.0794);
    transform-origin: 0 0;
    box-shadow: var(--paper-inset, none);
  }

  .swatches {
    display: flex;
    gap: 8px;
  }

  .swatch {
    width: 34px;
    height: 34px;
    padding: 0;
    border: 2px solid #fff;
    border-radius: 50%;
    background: var(--swatch);
    box-shadow: 0 0 0 1px rgb(0 0 0 / 0.25);
    cursor: pointer;
  }

  .swatch[aria-pressed='true'] {
    box-shadow: 0 0 0 2px var(--menu-accent);
  }

  fieldset {
    display: grid;
    gap: 4px;
    margin: 0;
    padding: 8px 10px;
    border: 1px solid var(--menu-rule);
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
    background: var(--menu-field-hover);
  }

  .manage {
    margin-top: 2px;
  }

  .manage,
  .restore {
    text-align: center;
  }

  .manage-head {
    display: flex;
    align-items: center;
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
    border: 1px solid var(--menu-rule);
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
    background: var(--menu-hover);
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
    color: var(--menu-hint);
    font-size: 11px;
  }

  .remove {
    width: 22px;
    height: 22px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 4px;
    background: none;
    color: var(--menu-hint);
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
  }

  .remove:hover {
    border-color: var(--menu-danger);
    background: rgb(122 27 27 / 0.12);
    color: var(--menu-danger);
  }

  .font-list .empty {
    color: var(--menu-hint);
    font-size: 12px;
  }

  .add-font {
    display: grid;
    gap: 4px;
    padding-top: 8px;
    border-top: 1px solid var(--menu-rule);
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
    border: 1px solid var(--menu-field-border);
    border-radius: 4px;
    background: var(--menu-field);
    cursor: pointer;
  }

  .hint {
    color: var(--menu-hint);
    font-size: 12px;
  }

  .hint a {
    color: var(--menu-link);
  }

  /* Phone: the panels open inside the full-width tools sheet. (Last, so it
     overrides the rules above.) */
  @media (max-width: 700px) {
    .form,
    .form.fonts {
      min-width: 0;
    }

    .papers {
      grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
    }
  }
</style>
