<script lang="ts">
  import { getContext } from "svelte";
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
  import { empty } from "svelte/internal";

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

  $: activeHash = tsStore.boardList.activeBoardHash;
  $: state = tsStore.boardList.getReadableBoardState($activeHash);
  $: stickies = $state ? $state.stickies : undefined;
  $: sortStickies = (stickies) => stickies;

  $: sortedStickies = sortStickies(stickies);
  $: groupedStickies = groupStickies(stickies);
  $: totalStickies = stickies ? stickies.length : 0
  $: stickesCounts = countStickies(sortedStickies)
  $: rows = makeRows(stickies)

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
  
  const editSpace = (id:uuidv1, text: string) => () => {
    editingSpaceId = id;
    editText = text;
  };

  const countVotes = (votes, type) => {
    if (typeof votes[type] === 'undefined') {
      return []
    }
    const agentKeys = Object.keys(votes[type]);
    return agentKeys.reduce(
      (total, agentKey) => total + (votes[type][agentKey] || 0),
      0
    );
  };

  const myVotes = (votes, type) => {
    if (typeof votes[type] === 'undefined') {
      return 0
    }
    return votes[type][tsStore.myAgentPubKey()] || 0;
  };

  const closeBoard = () => {
    tsStore.boardList.closeActiveBoard();
  };

  const inGroup = (curGroupId, groupId) => {
    return curGroupId === groupId || (curGroupId === 0 && !groupIds.includes(groupId))
  }
  const groupWidth = (groupId) : string => {
    const len = groups.length > 0 ? (stickesCounts[UngroupedId] > 0 ? groups.length : groups.length - 1) : 1
    // TODO: maybe set width dynamically by number of cards in group...
    if (len <= 4) {
      return 100/len+"%"
    }
    if (len == 5) {
      return "33%"
    }
    if (len == 6) {
      return "33%"
    }
    if (len == 7) {
      return "25%"
    }
    if (len == 8) {
      return "25%"
    }
    if (len == 9) {
      return "33%"
    }
    if (len == 10) {
      return "25%"
    }
    return 'fit-content'
  }
</script>

<div class="board">
  <div class="close-board global-board-button" on:click={closeBoard} title="Close Board">
    <ExIcon />
  </div>
  <div class="export-board global-board-button" on:click={() => pane.exportBoard($state)} title="Export Board">
    <ExportIcon />
  </div>
  <div class="top-bar">
    <h1>{$state.name}</h1>
    {#if $state.groups.length == 0}
      <div class="add-sticky" on:click={newSpace(UngroupedId, 0, 0)} style="margin-left:5px" title="New Space">
        <PlusIcon />
      </div>
    {/if}
  </div>
  {#if $state}
    <div class="background">
      {@html Marked.parse($state.story)}
    </div>

    <div class="grid">
      {#each rows as row, y}
        <div class="row">
          {#if row}
            {#each row as space, x}
              {#if space}
                <div class="space filled" title={space.text}>
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
                    <div class="space-button space-button-edit" on:click={editSpace(space.id, space.text)}></div>                    
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
</div>

<style>
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
    border-radius: 3px;
    flex: 1;
  }
  .top-bar {
    display: flex;
    flex-direction: row;
    align-items: center;
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
  .add-sticky, h2 {
    display: inline-block;
  }
  .groups {
    display: flex;
    flex-wrap: wrap;
  }
  .group {
    display: block;
    min-width: 290px;
  }
  .group-title {
    padding-left: 10px;
    padding-right: 10px;
    max-width: 270px;
  }
  .stickies {
    display: flex;
    flex-wrap: wrap;
  }
  .sticky {
    background-color: #d4f3ee;
    flex-basis: 200px;
    height: 200px;
    min-width: 250px;
    margin: 10px;
    padding: 10px;
    box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.5);
    font-size: 12px;
    line-height: 16px;
    color: #000000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .sticky-content {
    overflow-y: auto;
    max-width: 300px;
  }
  .add-sticky :global(svg) {
    margin-right: 6px;
    height: 30px;
    width: 30px;
  }
  .votes {
    display: flex;
    align-items: center;
    justify-content: space-around;
    margin-top: auto;
  }
  .vote {
    display: flex;
    align-items: center;
    background: white;
    border-radius: 5px;
    flex-basis: 26px;
    height: 25px;
    padding: 0 5px;
    border: 1px solid white;
    position: relative;
    cursor: pointer;
  }
  .voted {
    border-color: black;
  }
  .vote-counts {
    padding-top: 2px;
    display: flex;
    flex-direction: column;
    position: absolute;
    left: -3px;
    justify-content: flex-start;
  }
  .vote-count {
    border-radius: 50px;
    width: 5px;
    height: 5px;
    background-color: black;
    margin-bottom: 2px;
  }
</style>
