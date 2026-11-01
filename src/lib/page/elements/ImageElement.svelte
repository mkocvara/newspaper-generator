<script lang="ts">
  import { findNode } from '../../model/grid'
  import type { ImageElement } from '../../model/types'
  import { editor } from '../../state/editor.svelte'
  import EditableText from '../../ui/EditableText.svelte'
  import { readImage } from '../../ui/readImage'
  import { patchElement, PT_PX } from './edit'

  // An image from the user's device with a centred italic description below.
  let { element, leafId }: { element: ImageElement; leafId: string } = $props()

  const src = $derived(element.assetId ? editor.assets[element.assetId] : undefined)
  const captionPx = $derived(editor.page.style.sizes.captionPt * PT_PX)

  let input = $state<HTMLInputElement>()
  let dragOver = $state(false)

  async function load(file: File | undefined) {
    if (!file?.type.startsWith('image/')) return
    const assetId = editor.addAsset(await readImage(file))
    patchElement<ImageElement>(leafId, { assetId, position: undefined })
  }

  const position = $derived(element.position ?? { x: 50, y: 50 })

  // Dragging a cropped image pans it inside the frame. With object-fit: cover
  // the image overflows the frame on at most one axis; object-position x%
  // offsets it by -overflow * x / 100, so a pointer move of d px changes the
  // percentage by -d / overflow * 100.
  function startPan(event: PointerEvent) {
    if (event.button !== 0) return
    const img = event.currentTarget as HTMLImageElement
    const frame = img.getBoundingClientRect()
    const scale = Math.max(frame.width / img.naturalWidth, frame.height / img.naturalHeight)
    const overflowX = img.naturalWidth * scale - frame.width
    const overflowY = img.naturalHeight * scale - frame.height
    if (overflowX < 1 && overflowY < 1) return

    event.preventDefault()
    img.setPointerCapture(event.pointerId)
    const startX = event.clientX
    const startY = event.clientY
    const start = position
    const clamp = (v: number) => Math.min(100, Math.max(0, v))
    editor.beginGesture()

    const onMove = (move: PointerEvent) => {
      // Mutate through the editor's page, not the element prop.
      const leaf = findNode(editor.page.grid, leafId)
      if (leaf?.kind !== 'leaf' || leaf.element?.type !== 'image') return
      leaf.element.position = {
        x: overflowX < 1 ? start.x : clamp(start.x - ((move.clientX - startX) / overflowX) * 100),
        y: overflowY < 1 ? start.y : clamp(start.y - ((move.clientY - startY) / overflowY) * 100),
      }
    }
    const onEnd = () => {
      img.removeEventListener('pointermove', onMove)
      img.removeEventListener('pointerup', onEnd)
      img.removeEventListener('pointercancel', onEnd)
      editor.endGesture()
    }
    img.addEventListener('pointermove', onMove)
    img.addEventListener('pointerup', onEnd)
    img.addEventListener('pointercancel', onEnd)
  }

  function ondrop(event: DragEvent) {
    event.preventDefault()
    dragOver = false
    load(event.dataTransfer?.files[0])
  }
</script>

<figure
  class="image"
  class:drag-over={dragOver}
  ondragover={(e) => {
    e.preventDefault()
    dragOver = true
  }}
  ondragleave={() => (dragOver = false)}
  {ondrop}
>
  <input
    bind:this={input}
    type="file"
    accept="image/*"
    hidden
    onchange={(e) => {
      load(e.currentTarget.files?.[0])
      e.currentTarget.value = ''
    }}
  />

  <div class="frame">
    {#if src}
      {#if element.fit === 'crop'}
        <img
          {src}
          alt={element.caption}
          class="crop"
          class:greyscale={element.greyscale}
          style:object-position="{position.x}% {position.y}%"
          draggable="false"
          title="Drag to choose which part shows. Double-click to centre."
          onpointerdown={startPan}
          ondblclick={() => patchElement<ImageElement>(leafId, { position: undefined })}
        />
      {:else}
        <img {src} alt={element.caption} class:greyscale={element.greyscale} />
      {/if}
    {:else}
      <button class="choose ui-only" type="button" onclick={() => input?.click()}>
        Choose an image<br /><small>or drop one here</small>
      </button>
    {/if}

    <div class="tools ui-only">
      {#if src}
        <button type="button" title="Replace image" onclick={() => input?.click()}>Replace</button>
      {/if}
      <button
        type="button"
        title="Show the image in black and white"
        aria-pressed={element.greyscale}
        onclick={() => patchElement<ImageElement>(leafId, { greyscale: !element.greyscale })}>B/W</button
      >
      <button
        type="button"
        title={element.fit === 'crop'
          ? 'Cropped to fill the cell. Click to show the whole image.'
          : 'Whole image shown. Click to crop it to fill the cell.'}
        aria-pressed={element.fit === 'crop'}
        onclick={() => patchElement<ImageElement>(leafId, { fit: element.fit === 'crop' ? 'scale' : 'crop' })}
        >Crop</button
      >
    </div>
  </div>

  <figcaption style:font-size="{captionPx}px">
    <EditableText
      value={element.caption}
      onchange={(caption) => patchElement<ImageElement>(leafId, { caption })}
      placeholder="Image description"
      wrap
    />
  </figcaption>
</figure>

<style>
  .image {
    height: 100%;
    margin: 0;
    box-sizing: border-box;
    padding: 2mm 2.5mm;
    display: flex;
    flex-direction: column;
    gap: 1.5mm;
  }

  .drag-over {
    background: rgb(70 120 200 / 0.12);
  }

  .frame {
    position: relative;
    flex: 1;
    min-height: 0;
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  img.crop {
    object-fit: cover;
    cursor: grab;
    touch-action: none;
  }

  img.crop:active {
    cursor: grabbing;
  }

  img.greyscale {
    filter: grayscale(1);
  }

  .choose {
    width: 100%;
    height: 100%;
    border: 1px dashed rgb(0 0 0 / 0.3);
    border-radius: 4px;
    background: rgb(255 255 255 / 0.3);
    color: #555;
    font: 13px/1.4 system-ui, sans-serif;
    cursor: pointer;
  }

  .tools {
    position: absolute;
    right: 4px;
    bottom: 4px;
    display: flex;
    gap: 3px;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .image:hover .tools {
    opacity: 1;
  }

  .tools button {
    padding: 2px 6px;
    border: 1px solid rgb(0 0 0 / 0.2);
    border-radius: 4px;
    background: rgb(255 255 255 / 0.9);
    color: #333;
    font: 11px/1.3 system-ui, sans-serif;
    cursor: pointer;
  }

  .tools button[aria-pressed='true'] {
    background: #2f5ea8;
    border-color: #2f5ea8;
    color: #fff;
  }

  figcaption {
    flex: none;
    font-family: var(--font-caption);
    font-style: italic;
    line-height: 1.25;
    text-align: center;
    white-space: normal;
  }
</style>
