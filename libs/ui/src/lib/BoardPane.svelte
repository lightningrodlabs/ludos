<script lang="ts">
  import { getContext } from "svelte";
  import { fade } from 'svelte/transition';
  import SpaceEditor from "./SpaceEditor.svelte";
  import type { v1 as uuidv1 } from "uuid";
  import type { LudosStore } from "./ludosStore";
  import { Marked, Renderer } from "@ts-stack/markdown";
  import { Pane } from "./pane";
  import { BoardType, type Space } from "./board";
  import { onMount } from "svelte/internal";
  import Terminal from "./Terminal.svelte";
  import { Button, Icon } from "svelte-materialify";
  import { mdiCloseBoxOutline, mdiCog, mdiExport } from "@mdi/js";
  import EditBoardDialog from "./EditBoardDialog.svelte";
  import { cloneDeep } from "lodash";

  const pane = new Pane();

  Marked.setOptions
  ({
    renderer: new Renderer,
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: true,
    smartLists: true,
    smartypants: false
  });

  const { getStore } :any = getContext("tsStore");
  let tsStore: LudosStore = getStore();
  let minX = 1000;
  let minY = 1000;
  let maxX = -1000;
  let maxY = -1000;
  let dx = 0;
  let dy = 0;

  let location={x:0,y:0}
  let terminal
  let dreaming = false

  $: activeHash = tsStore.boardList.activeBoardHash;
  $: state = tsStore.boardList.getReadableBoardState($activeHash);
  $: spaces = $state ? $state.spaces : undefined;
  $: currentSpace = findSpace(location.x, location.y ,spaces)

  $: rows = makeRows(spaces)

  onMount(async () => {
    if (currentSpace) {
      terminal.addToScreen("")
      terminal.addToScreen($state.story)
      terminal.addToScreen("")
  		terminal.addToScreen(currentSpace.text)
    }
    terminal.focus()
	});
  const findSpace = (x, y, spaces) => {
    let result: Space | undefined 
    if (spaces) {
      for (const space of spaces) {
        if (space.x == x && space.y == y) {
          return space
        }
      }
    }
    return result
  }

  const makeRows = (spaces): Array<Array<Space>> => {
    minX = 1000;
    minY = 1000;
    maxX = -1000;
    maxY = -1000;
    dx = 0;
    dy = 0;
    spaces.forEach((space: Space) => {
      if (space.y < minY) {
        minY = space.y
      }
      if (space.x < minX) {
        minX = space.x
      }
      if (space.y > maxY) {
        maxY = space.y
      }
      if (space.x > maxX) {
        maxX = space.x
      }
    })
    dx = maxX - minX + 1
    dy = maxY - minY + 1
    const rows:Array<Array<Space>> = []
      spaces.forEach((space: Space) => {
      const y = space.y - minY
      const x = space.x - minX
      if (rows[y]===undefined) {
        rows[y]=[]
      }
      rows[y][x] = space
    })
    console.log("ROWS",rows)
    return rows
  }
  let createX = 0;
  let createY = 0;
  let editText = "";
  let editingSpaceId: uuidv1
  let creatingSpace = false

  const newSpace = (x:number, y:number) => () => {
      creatingSpace = true

      createX = x
      createY = y
  };
  
  const createSpace = (text: string, props) => {
    pane.addSpace(text, props, createX, createY)
    location.x = createX
    location.y = createY
    creatingSpace = false
  }

  const clearEdit = () => {
    creatingSpace = false
    editingSpaceId = null;
    editText = "";
  };

  const cancelEdit = () => {
    clearEdit();
  }
  
  const editSpace = (id:uuidv1, text: string, x,y) => () => {
    editingSpaceId = id;
    editText = text;
    location.x = x
    location.y = y
  };

  const closeBoard = () => {
    tsStore.boardList.closeActiveBoard();
  };

  const moveTo = (x,y) => {
    const space = findSpace(x,y, spaces)
    if (space) {
      location.x = x
      location.y = y
      return space.text
    }
    return "Your way is blocked"
   };

  const doCommand = (command:string):string => {
    switch(command) {
      case "?":
      case "help":
        return "You can type the cardinal directions to move around\nType 'look' to see what's in the space\nType 'story' to remember the backstory of this realm\nType 'awaken' to wake from your dreaming\n"
      case "story":
        return $state.story
      case "look":
        return currentSpace.text
      case "hack":
        return `You are at: ${location.x},${location.y}\nSpace details: ${JSON.stringify(currentSpace)}`
      case "awaken":
      case "wake":
      case "wakeup":
        dream(false)
        return "you have awoken from the dreaming in "+$state.name
      case "dream":
        dream(true)
        return "you slip into dreaming about the realm of "+$state.name
      case "n": 
      case "north":
        return moveTo(location.x,location.y-1)
      case "s": 
      case "south":
        return moveTo(location.x,location.y+1)
      case "e":
      case "east":
        return moveTo(location.x+1,location.y)
      case "w":
      case "west":
        return moveTo(location.x-1,location.y)
      default: return `I don't understand "${command}"`
    }    
  }
const dream = (state) =>{
  dreaming = state
}
let editing = false

</script>

<div class="board">
  {#if editing}
    <EditBoardDialog bind:active={editing} boardHash={cloneDeep($activeHash)} boardType={BoardType.Ludos}></EditBoardDialog>
  {/if}

  {#if $state}
    <div class="top-bar">
      <div class="left-items">
        <h5>{$state.name}</h5>
        <Button on:click={()=>dream(true)} title="Enter the dreaming..." style="margin-left:20px;">
          Dream Now
        </Button>
      </div>
      <div class="right-items">
        <Button size=small icon on:click={()=>editing=true} title="Settings">
          <Icon path={mdiCog} />
        </Button>
        <Button size=small icon on:click={() => pane.exportBoard($state)} title="Export">
          <Icon path={mdiExport} />
        </Button>
        <Button size=small icon on:click={closeBoard} title="Close">
          <Icon path={mdiCloseBoxOutline} />
        </Button>
      </div>
    </div>
    <div class="grid">
      {#each rows as row, y}
        <div class="row">
          {#if row}
            {#each row as space, x}
              {#if space}
                <div class="space filled {(location.x == space.x && location.y == space.y)?"pulsing":''}" title={space.text}>
                  <div class="space-button-row">
                    <div class="space-no-button"></div>
                    {#if rows[y-1] && rows[y-1][x]}
                      <div class="space-no-button"></div>                    
                    {:else}
                      <div class="space-button space-button-new" on:click={newSpace(space.x,space.y-1)}></div>
                    {/if}
                    <div class="space-no-button"></div>                    
                  </div>
                  <div class="space-button-row">
                    {#if !row[x-1]}
                      <div class="space-button space-button-new" on:click={newSpace(space.x-1,space.y)}></div>                    
                    {:else}
                      <div class="space-no-button"></div>                    
                    {/if}
                    <div class="space-button space-button-edit" on:click={editSpace(space.id, space.text, space.x, space.y)}></div>                    
                    {#if !row[x+1]}
                      <div class="space-button space-button-new" on:click={newSpace(space.x+1,space.y)}></div>                    
                    {:else}
                      <div class="space-no-button"></div>                    
                    {/if}
                  </div>
                  <div class="space-button-row">
                    <div class="space-no-button"></div>                    
                    {#if rows[y+1] && rows[y+1][x]}
                      <div class="space-no-button"></div>                    
                    {:else}
                      <div class="space-button space-button-new" on:click={newSpace(space.x,space.y+1)}></div>
                    {/if}
                    <div class="space-no-button"></div>                    
                  </div>
                </div>
              {:else}
                <div class="space"></div>
              {/if}
            {/each}
          {:else}
              {#each Array(dx) as _, index (index) }
              <div class="space">
                --
              </div>
              {/each}
          {/if}
        </div>
      {/each}
    </div>
    {#if creatingSpace}
    <SpaceEditor handleSave={createSpace} {cancelEdit} bind:active={creatingSpace} x={createX} y={createY} />
    {/if}
    {#if editingSpaceId }
      <SpaceEditor
        x={location.x}
        y={location.y}
        bind:active={editingSpaceId}
        handleSave={() => {
          pane.updateSpace(spaces, editingSpaceId, clearEdit)
          editingSpaceId = undefined
          }
        }
        handleDelete={ () => {
          pane.deleteSpace(editingSpaceId, clearEdit)
          editingSpaceId = undefined
          }
        }
        {cancelEdit}
        text={editText}
        props={{}}
      />
    {/if}
  {/if}
  {#if dreaming}
    <div  transition:fade>
      <Terminal bind:this={terminal} welcome={`Welcome to the realm of ${$state.name} (type ? for help)`} doCommand={doCommand} fullscreen={true}/>
    </div>
  {:else}
    <div id="dreaming-preview" transition:fade>
      Dreaming preview: 
      <Terminal bind:this={terminal} welcome={`Welcome to the realm of ${$state.name} (type ? for help)`} doCommand={doCommand} fullscreen={false} fontSize={"14px"} maxHeight={"200px"}/>
    </div>
  {/if}

</div>

<style>

  .top-bar {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    background-color: white;
    border-bottom: 2px solid #bbb;
    padding-left: 10px;
    padding-right: 10px;
    border-radius: 3px 3px 0 0;
  }
  .left-items {
    display: flex;
    align-items: center;
  }
  .right-items {
    display: flex;
    align-items: center;
  }
  .grid {
    display: flex;
    flex-direction: column;
    margin: auto;
  }
  .row {
    display: flex;
    flex-direction: row;
  }
  .space {
    display: inline-block;
    margin: 1px;
    min-width: 30px;
  }
  .filled {
    background-color: lightgray;
  }
  .pulsing {
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 1);
  	transform: scale(1);
    animation: pulse 2s infinite;
  }
  .space-button-row {
    display: flex;
    flex-direction: row;
    height: 10px;
  }
  .space-button {
    display: inline-block;
    width: 10px;
    height: 10px;
    margin: 0;
  }
  .space-button-new {
    background-color: green;
  }
  .space-button-edit {
    background-color: yellow;
  }

  .space-no-button {
    display: inline-block;
    width: 10px;
    height: 10px;
    margin: 0;
  }
  .board {
    display: flex;
    flex-direction: column;
    min-height: 500px;
    box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.25);
    border-radius: 3px;
    background-color: #f0f0f0;
    margin-left: 15px;
    margin-right: 15px;
    margin-top: 15px;
  }

  @keyframes pulse {
    0% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.7);
    }

    70% {
      transform: scale(1);
      box-shadow: 0 0 0 10px rgba(0, 0, 0, 0);
    }

    100% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
    }
  }
  #dreaming-preview {
    margin-top: 20px;
  }

</style>
