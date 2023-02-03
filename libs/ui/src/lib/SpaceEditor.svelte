<script>
  import { onMount } from 'svelte';
  import { Button, Dialog } from "svelte-materialify"

  export let active = false
  export let handleSave
  export let handleDelete = undefined
  export let cancelEdit
  export let text = ''
  export let props = {}
  export let x = 0
  export let y = 0
  const setColor = (color) => {
    // TODO fix later when there are more properties
    props = {color}
  }
  let inputElement
  onMount(() => inputElement.focus())
  const handleKeydown = (e) => {
    if (e.key === "Escape") {
      active=false
    } else if (e.key === "Enter" && e.ctrlKey) {
      handleSave(text, props, x, y)
    }
  }
</script>
<svelte:window on:keydown={handleKeydown}/>

<Dialog persistent bind:active width={600}>
<div class='space-editor' style:background-color={props.color}>
  <div>x:{x} y:{y}</div>
  <div class="space-elements">
  <textarea class='textarea' bind:value={text} bind:this={inputElement}/>

  </div>
  <div class='controls'>
    {#if handleDelete}
      <Button text size="x-small" on:click={handleDelete} class="red white-text">
        Delete
      </Button>
    {/if}
    <Button style="margin-left:5px" size="x-small" on:click={cancelEdit}>
      Cancel
    </Button>
    <Button style="margin-left:5px" size="x-small" class="primary-color" on:click={() => handleSave(text, props, x, y) }>
      Save
    </Button>
  </div>
</div>
</Dialog>

<style>
  .space-editor {
    display: flex;
    height: 500px;
    margin: 10px;
    padding: 10px;
    font-size: 12px;
    flex-direction: column;
  }
  .space-elements {
    display: flex;
    flex-direction: row;
    flex-basis: 100%;
  }
  .textarea {
    background-color: rgba(255, 255, 255, 0.72);
    border: 1px solid #C9C9C9;
    box-sizing: border-box;
    border-radius: 3px;
    width: 100%;
    height: 100%;
    font-weight: normal;
    padding: 2px;
  }
  .controls {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    padding-left: 7px;
    padding-top: 5px;
  }
</style>
