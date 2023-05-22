<script lang="ts">
    import { Menu, Button, List, ListItem, Icon } from 'svelte-materialify';
    import { getContext } from "svelte";
    import type { LudosStore } from "./ludosStore";
    import type { EntryHashB64 } from '@holochain/client';
    import NewRealmDialog from './NewRealmDialog.svelte';
    import { mdiChevronDown, mdiImport, mdiShapeSquarePlus, mdiArchiveArrowUp } from '@mdi/js';


    let creating = false

    const { getStore } :any = getContext('tsStore');

    const store:LudosStore = getStore();
    $: realmList = store.realmList.stateStore()
    $: activeHash = store.realmList.activeRealmHash;
    $: state = store.realmList.getReadableRealmState($activeHash);
    $: archivedRealms = $realmList.realms.findIndex((realm)=>realm.status === "archived") >= 0
    $: activeRealms = $realmList.realms.findIndex((realm)=>realm.status !== "archived") >= 0

    const selectRealm = (hash: EntryHashB64) => {
        store.realmList.setActiveRealm(hash)
        store.setUIprops({dreaming: true})

    }

    let fileinput;
	const onFileSelected = (e)=>{
        let file = e.target.files[0];
        let reader = new FileReader();

        reader.addEventListener("load", async () => {
        const b = JSON.parse(reader.result as string)
        const realm = await store.realmList.makeRealm(b)
        selectRealm(realm.hashB64())
        }, false);
        reader.readAsText(file);
    };
    const unarchiveRealm = (hash: EntryHashB64) => () => {
        store.realmList.unarchiveRealm(hash)
    }
</script>

<div class="realm-menu">
<input style="display:none" type="file" accept=".json" on:change={(e)=>onFileSelected(e)} bind:this={fileinput} >
<Button icon on:click={()=>creating = true} style="margin-left:10px" title="New Realm"><Icon path={mdiShapeSquarePlus} /></Button>
<Button icon on:click={()=>{fileinput.click();}} style="margin-left:10px" title="Import Realm"><Icon path={mdiImport} /></Button>
{#if activeRealms}
<Menu>
    <div slot="activator">
        <Button style="margin-left:10px">
            {#if $activeHash}
                {$state.name}
            {:else}
                <i>Enter a Realm</i>
            {/if}
            <Icon path={mdiChevronDown}></Icon>
        </Button>
    </div>
    <List>
        {#each $realmList.realms as realm }
            {#if realm.status !== "archived" }
                <ListItem dense={true} on:click={()=>selectRealm(realm.hash)}>{realm.name}</ListItem>
            {/if}
        {/each}
    </List>
</Menu>
{/if}
{#if archivedRealms}
<Menu>
    <div slot="activator">
        <Button style="margin-left:10px" title="Archived Realms">
            <Icon path={mdiArchiveArrowUp}></Icon>
            <Icon path={mdiChevronDown}></Icon>
        </Button>
    </div>
    <List>
        {#each $realmList.realms as realm }
            {#if realm.status === "archived" }
                <ListItem dense={true} on:click={unarchiveRealm(realm.hash)}>{realm.name}</ListItem>
            {/if}
        {/each}
    </List>
</Menu>
{/if}

{#if creating}
    <NewRealmDialog bind:active={creating}></NewRealmDialog>
{/if}
</div>
<style>
  .realm-menu {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
  }

</style>