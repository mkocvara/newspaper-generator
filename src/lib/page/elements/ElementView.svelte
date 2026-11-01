<script lang="ts">
  import type { Element } from '../../model/types'
  import Eyecatcher from './Eyecatcher.svelte'
  import ImageElement from './ImageElement.svelte'
  import TextArticle from './TextArticle.svelte'

  let { element, leafId }: { element: Element; leafId: string } = $props()
</script>

{#if element.type === 'eyecatcher'}
  <Eyecatcher {element} {leafId} />
{:else if element.type === 'text'}
  <TextArticle {element} {leafId} />
{:else}
  <ImageElement {element} {leafId} />
{/if}
