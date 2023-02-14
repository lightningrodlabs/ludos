<script lang="ts">
  import { type Space, type Connection, Topology } from "./board";
  import type { Dictionary } from "@holochain-open-dev/core-types";
  import type { v1 as uuidv1 } from "uuid";
  import { isEqual } from "lodash";

  export let spaces: Dictionary<Space>
  export let connections: Dictionary<Connection>
  export let connect: (from:uuidv1, x:number, y:number)=> void
  export let edit: (id:uuidv1)=>void
  export let topology
  
  let selectedElement = undefined
  let scale: number = 1.0

  const handleWheel = (e:WheelEvent) => {
    if (e.deltaY > 0) {
      scale *= 1.1
    } else if (e.deltaY < 0 ) {
      scale *= .9
    }
  }
  const availableConnections = (from:Space) => {
    const location = from.location
    const connsFrom = Object.values(connections).filter(c=>c.from == from.id)

    // plane topology
    let topoConns = [];
    switch(topology) {
      case Topology.Plane: 
        topoConns = [
        {x:location.x+1, y:location.y},
        {x:location.x-1, y:location.y},
        {x:location.x, y:location.y-1},
        {x:location.x, y:location.y+1},]
        break;
      case Topology.Rhyzome: 
        topoConns = [
        {x:location.x+1, y:location.y+1},
        {x:location.x-1, y:location.y+1},
        {x:location.x, y:location.y+1},]
        break;
      case Topology.Line: 
        topoConns = [
        {x:location.x, y:location.y+1},]
        break;
    } 
    let conns = []
    topoConns.forEach((loc, i)=>{
      const idx = connsFrom.findIndex( (c) => {
        const to = spaces[c.to].location
        return to.x == loc.x && to.y == loc.y
      })
      if (idx == -1) conns.push(topoConns[i])
    })
    return conns
  }
</script>
<svelte:window on:wheel={handleWheel}/>

<div class="map" >
  <svg viewBox={`${-300*scale} ${-200*scale} ${600*scale} ${400*scale}`}>
    <filter id="selected">
      <feDropShadow dx="0" dy="0" stdDeviation="0.5"
          flood-color="cyan"/>
    </filter>
  {#each Object.values(connections).map( c=>{
      return {
      id: c.id,
      src: spaces[c.from],
      dst: spaces[c.to],
      text: c.text}
    }) as x}
      <line 
        on:click={()=>{selectedElement = selectedElement == x.id ? undefined : x.id} }
        class="connection"
        class:selected-connection={selectedElement == x.id} 
        x1="{x.src.location.x*100}" y1="{x.src.location.y*100}" 
        x2="{x.dst.location.x*100}" y2="{x.dst.location.y*100}"
        />
  {/each}
  {#each Object.values(spaces) as space}
      <circle 
        cx="{space.location.x*100}" 
        cy="{space.location.y*100}" r="40"
        class="space"
        class:selected-space={selectedElement == space.id} 
        on:click={()=>{
          edit(space.id)
          //electedElement = selectedElement == space.id ? undefined : space.id
          } }
        />
      {#each availableConnections(space) as {x,y}}
        {#if topology == Topology.Rhyzome && x!=space.location.x}
        <circle
          cx="{space.location.x*100+(x-space.location.x)*28}" 
          cy="{space.location.y*100+(y-space.location.y)*28}"
          r="10"
          class="connector"
          on:click={()=>{connect(space.id, x, y)} }
        />
        {:else}
        <circle
          cx="{space.location.x*100+(x-space.location.x)*40}" 
          cy="{space.location.y*100+(y-space.location.y)*40}"
          r="10"
          class="connector"
          on:click={()=>{connect(space.id, x, y)} }
        />
        {/if}
      {/each}
  {/each}
</svg>
</div>

<style>
  .map {
    margin: 0;
    border: solid 1px;
  }
  .space {
    stroke: green;
    stroke-width: 4;
    fill: yellow;
  }
  .connector {
    stroke-width: 0;
    fill: blue;
  }
  .connection {
    stroke:green;
    stroke-width:5
  }
  .selected-space {
    stroke-width:6;
    filter:drop-shadow(0px 0px 8px green)
  }
  .selected-connection {
    stroke-width:10;
    filter:drop-shadow(0px 0px 8px green)
  }
</style>