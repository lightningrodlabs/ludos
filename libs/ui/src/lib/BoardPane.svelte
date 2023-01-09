<script lang="ts">
  import { getContext } from "svelte";
  import { fade } from 'svelte/transition';
  import SpaceEditor from "./SpaceEditor.svelte";
  import PlusIcon from "./icons/PlusIcon.svelte";
  import ExIcon from "./icons/ExIcon.svelte";
  import ExportIcon from "./icons/ExportIcon.svelte";
  import EmojiIcon from "./icons/EmojiIcon.svelte";
  import type { v1 as uuidv1 } from "uuid";
  import { sortBy } from "lodash/fp";
  import type { LudosStore } from "./ludosStore";
  import { Marked, Renderer } from "@ts-stack/markdown";
  import { cloneDeep, isEqual } from "lodash";
  import { Pane } from "./pane";
  import { UngroupedId, type Space } from "./board";
  import { empty, onMount } from "svelte/internal";
  import Collapsable from "./Collapsable.svelte";
  import Terminal from "./Terminal.svelte";

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
  $: stickies = $state ? $state.stickies : undefined;
  $: sortStickies = (stickies) => stickies;
  $: currentSpace = findSpace(location.x, location.y ,stickies)

  $: sortedStickies = sortStickies(stickies);
  $: groupedStickies = groupStickies(stickies);
  $: totalStickies = stickies ? stickies.length : 0
  $: stickesCounts = countStickies(sortedStickies)
  $: rows = makeRows(stickies)

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

  const makeRows = (stickes): Array<Array<Space>> => {
    minX = 1000;
    minY = 1000;
    maxX = -1000;
    maxY = -1000;
    dx = 0;
    dy = 0;
    stickies.forEach((sticky: Space) => {
      if (sticky.y < minY) {
        minY = sticky.y
      }
      if (sticky.x < minX) {
        minX = sticky.x
      }
      if (sticky.y > maxY) {
        maxY = sticky.y
      }
      if (sticky.x > maxX) {
        maxX = sticky.x
      }
    })
    dx = maxX - minX + 1
    dy = maxY - minY + 1
    const rows:Array<Array<Space>> = []
    stickies.forEach((sticky: Space) => {
      const y = sticky.y - minY
      const x = sticky.x - minX
      if (rows[y]===undefined) {
        rows[y]=[]
      }
      rows[y][x] = sticky
    })
    console.log("ROWS",rows)
    return rows
  }
  let creatingInGroup: uuidv1 | undefined = undefined;
  let createX = 0;
  let createY = 0;
  let editText = "";
  let editingSpaceId: uuidv1

  let groupIds = []
  let groups = []
  let ungroupedStickies = 0

  const countStickies = (stickies) : {} => {
    let counts = {}
    stickies.forEach((sticky: Space) => {
      counts[sticky.group] = counts[sticky.group] != undefined ? counts[sticky.group]+1 : 1
    })
    return counts
  }
    
  const groupStickies = (stickies) => {
    ungroupedStickies = 0
    if ($state) {
      groups = cloneDeep($state.groups);
      groupIds = groups.map(c => c.id)

      stickies.forEach((sticky) => {
        if (!groupIds.includes(sticky.group)) ungroupedStickies += 1
      });
      groups.unshift({id:UngroupedId, name:""})
    }
  };

  const newSpace = (group: uuidv1, x:number, y:number) => () => {
      createX = x
      createY = y
      creatingInGroup = group;
  };
  
  const createSpace = (text: string, _groupId: uuidv1, props) => {
    pane.addSpace(text, creatingInGroup, props, createX, createY)
    location.x = createX
    location.y = createY
    creatingInGroup = undefined
  }

  const clearEdit = () => {
    editingSpaceId = null;
    editText = "";
  };

  const cancelEdit = () => {
    creatingInGroup = undefined;
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
    const space = findSpace(x,y, stickies)
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
</script>

<div class="board">
  <div class="close-board global-board-button" on:click={closeBoard} title="Close Realm">
    <ExIcon />
  </div>
  <div class="export-board global-board-button" on:click={() => pane.exportBoard($state)} title="Export Realm">
    <ExportIcon />
  </div>
  {#if $state}
    <div class="top-bar">
      <h2 style="margin-right:10px">{$state.name}</h2>
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
                      <div class="space-button space-button-new" on:click={newSpace(UngroupedId,space.x,space.y-1)}></div>
                    {/if}
                    <div class="space-no-button"></div>                    
                  </div>
                  <div class="space-button-row">
                    {#if !row[x-1]}
                      <div class="space-button space-button-new" on:click={newSpace(UngroupedId,space.x-1,space.y)}></div>                    
                    {:else}
                      <div class="space-no-button"></div>                    
                    {/if}
                    <div class="space-button space-button-edit" on:click={editSpace(space.id, space.text, space.x, space.y)}></div>                    
                    {#if !row[x+1]}
                      <div class="space-button space-button-new" on:click={newSpace(UngroupedId,space.x+1,space.y)}></div>                    
                    {:else}
                      <div class="space-no-button"></div>                    
                    {/if}
                  </div>
                  <div class="space-button-row">
                    <div class="space-no-button"></div>                    
                    {#if rows[y+1] && rows[y+1][x]}
                      <div class="space-no-button"></div>                    
                    {:else}
                      <div class="space-button space-button-new" on:click={newSpace(UngroupedId,space.x,space.y+1)}></div>
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
    {#if creatingInGroup !==undefined}
    <SpaceEditor handleSave={createSpace} {cancelEdit} groups={groups} />
    {/if}
    {#if editingSpaceId }
      <SpaceEditor
        handleSave={
          pane.updateSpace(stickies, editingSpaceId, clearEdit)
        }
        handleDelete={
          pane.deleteSpace(editingSpaceId, clearEdit)
        }
        {cancelEdit}
        text={editText}
        groupId={UngroupedId}
        groups={groups}
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
      Dreaming preview: <a href="#" class="button" on:click={()=>dream(true)}>Dream Now</a>
      <Terminal bind:this={terminal} welcome={`Welcome to the realm of ${$state.name} (type ? for help)`} doCommand={doCommand} fullscreen={false} fontSize={"14px"} maxWidth={"400px"} maxHeight={"200px"}/>
    </div>
  {/if}

</div>

<style>
  .top-bar {
    display: flex;
  }
  .grid {
    display: flex;
    flex-direction: column;
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
    padding: 30px 60px;
    background-color: white;
    box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.25);
  }
  .global-board-button {
    position: absolute;
    margin-top: -18px;
    cursor: pointer;
  }
  .close-board {
    right: 45px;
  }
  .export-board {
    right: 70px;
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
    max-width: 400px;
    max-height: 200px;
  }
  a.button{
  display:inline-block;
  padding:0.3em 1.2em;
  margin:0 0.3em 0.3em 0;
  border-radius:2em;
  box-sizing: border-box;
  text-decoration:none;
  font-family:'Roboto',sans-serif;
  font-weight:300;
  color:#FFFFFF;
  background-color:#4eb5f1;
  text-align:center;
  transition: all 0.2s;
  }
  a.button:hover{
  background-color:#4095c6;
  }
  @media all and (max-width:30em){
    a.button{
    display:block;
    margin:0.2em auto;
    }
  }
</style>
