<script lang="ts">
  import { onMount } from 'svelte';
  import { Button, Dialog } from "svelte-materialify"
  import type { Connection } from './board';

  export let active = false
  export let handleSave
  export let handleDelete = undefined
  export let cancelEdit
  export let spaces = {}
  export let text = ''
  export let name = ''
  export let props = {}
  export let x = 0
  export let y = 0
  export let connections: Connection[] = []

  let inputElement
  onMount(() => inputElement.focus())
  const handleKeydown = (e) => {
    if (e.key === "Escape") {
      active=false
    } else if (e.key === "Enter" && e.ctrlKey) {
      handleSave(name, text, props, x, y)
    }
  }
</script>
<svelte:window on:keydown={handleKeydown}/>

<Dialog persistent bind:active width={600}>
<div class='space-editor'>
  <div>
    
    x:{x} 
    y:{y}
  </div>

  <div class="space-elements">
    Name: <input class='textinput' bind:value={name} bind:this={inputElement}/>
    Description: <textarea class='textinput' bind:value={text}/>
    Connections:<br />
    {#each connections as  connection}
      To: {spaces[connection.to].name} <textarea class='textinput' bind:value={connection.text}/>
    {/each}

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
    <Button style="margin-left:5px" size="x-small" BoardTypeclass="primary-color" on:click={() => handleSave(name, text, props, x, y, connections) }>
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
    flex-direction: column;
    flex-basis: 100%;
  }
  .textinput {
    background-color: rgba(255, 255, 255, 0.72);
    border: 1px solid #C9C9C9;
    box-sizing: border-box;
    border-radius: 3px;
    font-weight: normal;
    padding: 2px;
  }
  textarea {
    width: 100%;
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
