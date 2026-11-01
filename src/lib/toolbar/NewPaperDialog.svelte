<script lang="ts">
  import { i18n } from '../i18n/i18n.svelte'
  // The "New Paper" toolbar button. It asks first, since starting over loses
  // the current page, and offers to export it as a preset before that.
  let { onexport, onconfirm }: { onexport: () => void; onconfirm: () => void } = $props()

  let dialog = $state<HTMLDialogElement>()
  let exported = $state(false)

  function open() {
    exported = false
    dialog?.showModal()
  }
</script>

<button type="button" class="tb-button" onclick={open}>{i18n.t.newPaper.button}</button>

<dialog bind:this={dialog} aria-labelledby="new-paper-title">
  <h2 id="new-paper-title">{i18n.t.newPaper.title}</h2>
  <p>{i18n.t.newPaper.warning}</p>
  <p>{i18n.t.newPaper.keepWork}</p>
  {#if exported}<p class="done" role="status">{i18n.t.newPaper.exported}</p>{/if}
  <div class="actions">
    <button type="button" onclick={() => dialog?.close()}>{i18n.t.newPaper.cancel}</button>
    <button
      type="button"
      onclick={() => {
        onexport()
        exported = true
      }}>{i18n.t.newPaper.exportFirst}</button
    >
    <button
      type="button"
      class="danger"
      onclick={() => {
        dialog?.close()
        onconfirm()
      }}>{i18n.t.newPaper.confirm}</button
    >
  </div>
</dialog>

<style>
  dialog {
    max-width: 420px;
    padding: 20px 22px;
    border: none;
    border-radius: 10px;
    background: #fff;
    color: #222;
    font: 14px/1.45 system-ui, sans-serif;
    box-shadow: 0 10px 40px rgb(0 0 0 / 0.35);
  }

  dialog::backdrop {
    background: rgb(0 0 0 / 0.45);
  }

  h2 {
    margin: 0 0 10px;
    font-size: 17px;
  }

  p {
    margin: 0 0 8px;
  }

  .done {
    color: #2a7a3a;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
  }

  .actions button {
    padding: 6px 12px;
    border: 1px solid rgb(0 0 0 / 0.25);
    border-radius: 5px;
    background: #f4f4f4;
    color: #222;
    font: inherit;
    cursor: pointer;
  }

  .actions button:hover {
    background: #e8e8e8;
  }

  .actions .danger {
    border-color: #a32020;
    background: #b42828;
    color: #fff;
  }

  .actions .danger:hover {
    background: #9c1f1f;
  }
</style>
