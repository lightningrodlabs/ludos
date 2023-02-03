<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from 'svelte-materialify';
    import type { BoardType } from './board';
  
    export let handleSave
    export let handleDelete = undefined
    export let cancelEdit
    export let text = ''
    export let story = ''
    export let boardType: BoardType
    let titleElement

    const handleKeydown = (e) => {
      if (e.key === "Escape") {
        cancelEdit()
      } else if (e.key === "Enter" && e.ctrlKey) {
        handleSave(boardType, text, story)
      } else  if (e.key === 'Tab') {
        // trap focus
        const tabbable = Array.from(document.querySelectorAll('.input'))

        let index = tabbable.findIndex((elem)=>elem == document.activeElement)
  
        if (index === -1 && e.shiftKey) index = 0;

        index += tabbable.length + (e.shiftKey ? -1 : 1);
        index %= tabbable.length;

        //@ts-ignore
        tabbable[index].focus();
        e.preventDefault();
      }
    }
    onMount( async () => {
      titleElement.focus()
    })

</script>

<svelte:window on:keydown={handleKeydown}/>

<div class='board-editor'>
  <div class="edit-title">
    Name: <input class='textarea input' bind:value={text} />
  </div>
  <div class="edit-story">
    Background Story: <textarea class='storyarea input' bind:value={story} bind:this={titleElement}  />
  </div>
  <div class='controls'>
    {#if handleDelete}
      <Button on:click={handleDelete} size="small">
        Archive
      </Button>
    {/if}
    <Button on:click={cancelEdit} style="margin-left:10px" size="small">
      Cancel
    </Button>
    <Button style="margin-left:10px" size="small" on:click={() => handleSave(boardType, text, story)} class="primary-color">
      Save
    </Button>
  </div>
</div>


<style>
  .board-editor {
    display: flex;
    flex-basis: 270px;
    margin: 20px;
    font-style: normal;
    font-weight: 600;
    color: #000000;
    flex-direction: column;
    justify-content: flex-start;
  }
  .textarea {
    background-color: rgba(255, 255, 255, 0.72);
    border: 1px solid #C9C9C9;
    box-sizing: border-box;
    border-radius: 3px;
    width: 100%;
    font-weight: normal;

  }
  .storyarea {
    background-color: rgba(255, 255, 255, 0.72);
    border: 1px solid #C9C9C9;
    box-sizing: border-box;
    border-radius: 3px;
    width: 100%;
    height: 200px;
    font-weight: normal;

  }
  .controls {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    padding-left: 7px;
    padding-top: 10px;
  }

</style>