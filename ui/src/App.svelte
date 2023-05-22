<script lang="ts">
  import { onMount } from 'svelte';
  import Controller from './ludos/Controller.svelte'
  import { AppAgentWebsocket, AdminWebsocket } from '@holochain/client';

  const appId = 'ludos'
  const roleName = 'ludos'
  const appPort: string = import.meta.env.VITE_APP_PORT
  const adminPort: string = import.meta.env.VITE_ADMIN_PORT
  const url = `ws://localhost:${appPort}`;

  let client: AppAgentWebsocket  

  let connected = false
  initialize()

  async function initialize() : Promise<void> {
    console.log("adminPort is", adminPort)
    if (adminPort) {
      const adminWebsocket = await AdminWebsocket.connect(`ws://localhost:${adminPort}`)
      const x = await adminWebsocket.listApps({})
      console.log("apps", x)
      const cellIds = await adminWebsocket.listCellIds()
      console.log("CELL IDS",cellIds)
      await adminWebsocket.authorizeSigningCredentials(cellIds[0])
    }
    console.log("appPort and Id is", appPort, appId)
    client = await AppAgentWebsocket.connect(url, appId)

    connected = true
  }
</script>

<style>
:global(body) {
  font-family: Roboto,'Open Sans','Helvetica Neue',sans-serif;
	}
</style>

<svelte:head>
</svelte:head>
{#if connected}
  <Controller client={client} roleName={roleName}></Controller>
{:else}
  Loading
{/if}