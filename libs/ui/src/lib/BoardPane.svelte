<script lang="ts">
  import { getContext } from "svelte";
  import { fade } from 'svelte/transition';
  import SpaceEditor from "./SpaceEditor.svelte";
  import Map from "./Map.svelte";
  import { v1 as uuidv1 } from "uuid";
  import type { LudosStore } from "./ludosStore";
  import { Marked, Renderer } from "@ts-stack/markdown";
  import { Connection, Topology, type BoardState, type Space } from "./board";
  import { onMount } from "svelte/internal";
  import Terminal from "./Terminal.svelte";
  import { Button, Icon, Tooltip } from "svelte-materialify";
  import { mdiCloseBoxOutline, mdiCog, mdiExport } from "@mdi/js";
  import EditBoardDialog from "./EditBoardDialog.svelte";
  import { cloneDeep, isEqual } from "lodash";
  import { createEventDispatcher } from "svelte";

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

  let location={x:0,y:0}
  let terminal
  let dreaming = false
  let dispatch = createEventDispatcher()

  $: activeHash = tsStore.boardList.activeBoardHash;
  $: state = tsStore.boardList.getReadableBoardState($activeHash);
  $: spaces = $state ? $state.spaces : undefined;
  $: connections = $state ? $state.connections : undefined;
  $: currentSpace = findSpace(location.x, location.y ,spaces)

  onMount(async () => {
    if (currentSpace) {
      terminal.addToScreen("")
      terminal.addToScreen($state.story)
      terminal.addToScreen("")
  		terminal.addToScreen(currentSpace.text)
  		terminal.addToScreen(connTexts(currentSpace.id).join("\n"))
    }
    terminal.focus()
	});
  const exportBoard = (state: BoardState) => {
        const fileName = `ts_${state.name}.json`
        download(fileName, JSON.stringify(state))
        alert(`Your board was exported to your Downloads folder as: '${fileName}'`)
    }
    
  const download = (filename: string, text: string) => {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  const findSpace = (x, y, spaces) => {
    let result: Space | undefined 
    if (spaces) {
      for (const space of Object.values(spaces) as Space[]) {
        if (space.location.x == x && space.location.y == y) {
          return space
        }
      }
    }
    return result
  }

  let createX = 0;
  let createY = 0;
  let createFrom = ""
  let editText = "";
  let editName = ""
  let editConnections = []
  let editingSpaceId: uuidv1
  let creatingSpace = false

  const makeConnections = (from: Space, to: Space) => {
    const fromConn = new Connection(from.id, to.id, `this space leads to ${to.name}`)
    const toConn = new Connection(to.id, from.id, `this space leads to ${from.name}`)
    dispatch("requestChange", [{ type: "add-connection", connection: fromConn}, { type: "add-connection", connection: toConn}]);
  }

  const connect = (from: uuidv1, x:number, y:number) => {
    const space = findSpace(x,y, spaces)
    if (space) {
      const conn = Object.values(connections).find(c=>c.from == from && c.to == space.id)
      if (conn === undefined) {
        makeConnections(spaces[from], space)
      } else {
        editSpace(space.id)
      }
    } else {
      creatingSpace = true
      createX = x
      createY = y
      createFrom = from
    }
  }
  
  const createSpace = (name: string, text: string, props, connections: Connection[]) => {
    const space = {
          id: uuidv1(),
          name,
          location: {x: createX,y: createY, z:0},
          text,
          props,
        };
    dispatch("requestChange", [{ type: "add-space", value: space }]);

    makeConnections(spaces[createFrom],space)
    location.x = createX
    location.y = createY
    creatingSpace = false
  }

  const clearEdit = () => {
    creatingSpace = false
    editingSpaceId = undefined    
    editText = "";
    editName = "";
  };

  const cancelEdit = () => {
    clearEdit();
  }
  
  const editSpace = (id: uuidv1 ) => {
    const space:Space = spaces[id]
    if (space) {
      editingSpaceId = id;
      editText = space.text;
      editName = space.name;
      editConnections = cloneDeep(Object.values(connections).filter(c => c.from==id))
      location.x = space.location.x
      location.y = space.location.y
    }
  };

  const closeBoard = () => {
    tsStore.boardList.closeActiveBoard();
  };

  const moveTo = (x,y) => {
    const space = findSpace(x,y, spaces)
    if (space) {
      location.x = x
      location.y = y
      return space.text + connTexts(space.id).join("\n")
    }
    return "Your way is blocked"
   };

  const connTexts = (from: uuidv1) : string[] => {
    return Object.values(connections).filter(c=>c.from==from).map(c=>c.text)
  }

  const doCommand = (command:string):string => {
    switch(command) {
      case "?":
      case "help":
        return "You can type the cardinal directions to move around\nType 'look' to see what's in the space\nType 'story' to remember the backstory of this realm\nType 'awaken' to wake from your dreaming\n"
      case "story":
        return $state.story
      case "look":
        return currentSpace.text+"\n"+connTexts(currentSpace.id).join("\n")
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
const deleteSpace = () => {
    this.dispatch("requestChange", [{ type: "delete-space", editingSpaceId }]);
    cancelEdit()
}
const updateSpace = (name:string, text:string, props:any) => {
    const space = spaces[editingSpaceId];
    if (!space) {
      console.error("Failed to find item with id", editingSpaceId);
    } else {
      let changes = []
      if (space.name != name) {
        changes.push({ type: "update-space-name", id: space.id, text: text })
      }
      if (space.text != text) {
        changes.push({ type: "update-space-text", id: space.id, text: text })
      }
      console.log("space.props", space.props, "props", props)
      if (!isEqual(space.props, props)) {
        changes.push({ type: "update-space-props", id: space.id, props: cloneDeep(props)})
      }
      if (changes.length > 0) {
      this.dispatch("requestChange", changes);
      }
    }
    cancelEdit()
};
</script>

<div class="board">
  {#if editing}
    <EditBoardDialog bind:active={editing} boardHash={cloneDeep($activeHash)} topology={$state.topology}></EditBoardDialog>
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
        <Button size=small icon on:click={() => exportBoard($state)} title="Export">
          <Icon path={mdiExport} />
        </Button>
        <Button size=small icon on:click={closeBoard} title="Close">
          <Icon path={mdiCloseBoxOutline} />
        </Button> 
      </div>
    </div>
    <Map topology={$state.topology} spaces={spaces} connections={connections} connect={connect} edit={editSpace}></Map>
  
    {#if creatingSpace}
    <SpaceEditor spaces={spaces} handleSave={createSpace} {cancelEdit} bind:active={creatingSpace} x={createX} y={createY}
      connections={[]} />
    {/if}
    {#if editingSpaceId }
      <SpaceEditor
        spaces={spaces}
        x={location.x}
        y={location.y}
        bind:active={editingSpaceId}
        handleSave={updateSpace}
        handleDelete={deleteSpace}
        {cancelEdit}
        name={editName}
        text={editText}
        props={{}}
        connections={editConnections}
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
