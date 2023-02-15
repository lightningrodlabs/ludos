<script lang="ts">
  import { getContext } from "svelte";
  import { fade } from 'svelte/transition';
  import SpaceEditor from "./SpaceEditor.svelte";
  import Map from "./Map.svelte";
  import { v1 as uuidv1 } from "uuid";
  import type { LudosStore } from "./ludosStore";
  import { Marked, Renderer } from "@ts-stack/markdown";
  import { Connection, Topology, type RealmState, type Space } from "./realm";
  import { onMount } from "svelte/internal";
  import Terminal from "./Terminal.svelte";
  import { Button, Icon, Tooltip } from "svelte-materialify";
  import { mdiCloseBoxOutline, mdiCog, mdiExport } from "@mdi/js";
  import EditRealmDialog from "./EditRealmDialog.svelte";
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

  let location={x:0,y:0,z:0}
  let terminal
  let dreaming = false
  let dispatch = createEventDispatcher()

  $: activeHash = tsStore.realmList.activeRealmHash;
  $: state = tsStore.realmList.getReadableRealmState($activeHash);
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
  const exportRealm = (state: RealmState) => {
        const fileName = `ts_${state.name}.json`
        download(fileName, JSON.stringify(state))
        alert(`Your realm was exported to your Downloads folder as: '${fileName}'`)
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

  const closeRealm = () => {
    tsStore.realmList.closeActiveRealm();
  };
  const lookText = (s:Space) => {
    return s.text?s.text:s.name+"\n" + connTexts(s.id).join("\n")
  }
  const moveTo = (x,y) => {
    x = location.x+x
    y = location.y+y
    const conns = Object.values(connections).filter(c=>c.from == currentSpace.id)
    for (const c of conns) {
      const s = spaces[c.to]
      if (s && s.location.x == x && s.location.y == y) {
        location = s.location
        return lookText(s)
      }
    }
    return "Can't go that way"
  }

  const moveUp = () => {
    const conns = Object.values(connections).filter(c=>c.from == currentSpace.id)
    for (const c of conns) {
      const s = spaces[c.to]
      if (s && s.location.y == location.y-1) {
        location = s.location
        return lookText(s)
      }
    }
    return "Can't go that way"
  }

  const connTexts = (from: uuidv1) : string[] => {
    return Object.values(connections).filter(c=>c.from==from).map(c=>c.text)
  }

  const helpCmd = () => {
    let help =`Type 'look' to see what's in the space.
Type 'story' to remember the backstory of this realm.
Type 'awaken' to wake from your dreaming
`
    switch ($state.topology) {
      case Topology.Rhyzome:
        help += `You can type 'left' or 'right', 'down' or 'up' to move between spaces.\n`
        break;
      case Topology.Line:
        help += `You can type 'next' or 'previous' to move between spaces.\n`
        break;
      case Topology.Plane:
        help += "You can type the cardinal directions to move around.\n"
        break;
    }
    return help
  }
  const wakeCmd = ()=>{
    dream(false)
    return "you have awoken from the dreaming in "+$state.name
  }
  const baseCommands = {
    '?':helpCmd,
    'help':helpCmd,
    'h':helpCmd,
    'wake':wakeCmd,
    'awake':wakeCmd,
    'waken':wakeCmd,
    'wakeup':wakeCmd,
    'hack':()=>{return `You are at: ${location.x},${location.y}\nSpace details: ${JSON.stringify(currentSpace)}`},
    'dream':()=>{dream(true)
        return "you slip into dreaming about the realm of "+$state.name
    },
    'look':()=>{return lookText(currentSpace)}
  }
  const rhyzomeCommands = {
    "l":()=>{return moveTo(-1,1)},
    "left":()=>{return moveTo(-1,1)},
    "r":()=>{return moveTo(1,1)},
    "right":()=>{return moveTo(1,1)},
    "u":()=>{return moveUp()},
    "up":()=>{return moveUp()},
    "d":()=>{return moveTo(0,1)},
    "down":()=>{return moveTo(0,1)},
  }
  const planeCommands = {
    "n":()=>{return moveTo(0,-1)},
    "north":()=>{return moveTo(0,-1)},
    "s":()=>{return moveTo(0,1)},
    "south":()=>{return moveTo(0,1)},
    "e":()=>{return moveTo(-1,0)},
    "east":()=>{return moveTo(-1,0)},
    "w":()=>{return moveTo(1,0)},
    "west":()=>{return moveTo(1,0)},
  }
  const lineCommands = {
    "p":()=>{return moveTo(0,-1)},
    "prev":()=>{return moveTo(0,-1)},
    "previous":()=>{return moveTo(0,-1)},
    "n":()=>{return moveTo(0,1)},
    "next":()=>{return moveTo(0,1)},
  }
  const doCommand = (command:string):string => {
    let cmd = baseCommands[command]
    if (cmd) {
      return cmd()
    }
    switch ($state.topology) {
      case Topology.Rhyzome:
        cmd = rhyzomeCommands[command]
        break;
      case Topology.Line:
        cmd = lineCommands[command]
        break;
      case Topology.Plane:
        cmd = planeCommands[command]
        break;
    }
    if (cmd) {
      return cmd()
    }
    return `I don't understand "${command}"`
  }
const dream = (state) =>{
  dreaming = state
}
let editing = false
const deleteSpace = () => {
    dispatch("requestChange", [{ type: "delete-space", editingSpaceId }]);
    cancelEdit()
}
const updateSpace = (name:string, text:string, props:any) => {
    const space = spaces[editingSpaceId];
    if (!space) {
      console.error("Failed to find item with id", editingSpaceId);
    } else {
      let changes = []
      if (space.name != name) {
        changes.push({ type: "update-space-name", id: space.id, name })
      }
      if (space.text != text) {
        changes.push({ type: "update-space-text", id: space.id, text })
      }
      console.log("space.props", space.props, "props", props)
      if (!isEqual(space.props, props)) {
        changes.push({ type: "update-space-props", id: space.id, props: cloneDeep(props)})
      }
      if (changes.length > 0) {
      dispatch("requestChange", changes);
      }
    }
    cancelEdit()
};
</script>

<div class="realm">
  {#if editing}
    <EditRealmDialog bind:active={editing} realmHash={cloneDeep($activeHash)} topology={$state.topology}></EditRealmDialog>
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
        <Button size=small icon on:click={() => exportRealm($state)} title="Export">
          <Icon path={mdiExport} />
        </Button>
        <Button size=small icon on:click={closeRealm} title="Close">
          <Icon path={mdiCloseBoxOutline} />
        </Button> 
      </div>
    </div>
    <Map topology={$state.topology} location={location} spaces={spaces} connections={connections} connect={connect} edit={editSpace}></Map>
  
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
  .realm {
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
