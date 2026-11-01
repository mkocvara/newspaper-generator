<script lang="ts">
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
    patchElement<ImageElement>(leafId, { assetId })
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
      <img {src} alt={element.caption} class:greyscale={element.greyscale} class:crop={element.fit === 'crop'} />
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
