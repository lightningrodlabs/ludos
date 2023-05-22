<script lang="ts">
    import { Dialog } from 'svelte-materialify';
    import type { Realm, RealmState, Topology } from './realm';
    import RealmEditor from './RealmEditor.svelte';
    import type { LudosStore } from "./ludosStore";
    import { getContext, onMount } from 'svelte';
    import type { EntryHashB64 } from '@holochain/client';

    export let topology: Topology|undefined
    export let realmHash:EntryHashB64|undefined = undefined
    let editName = ''
    let editStory = ""
    onMount(async () => {

        const realm: Realm | undefined = await store.realmList.getRealm(realmHash)
        if (realm) {
            const state = realm.state()
            editName = state.name
        } else {
            console.log("realm not found:", realmHash)
        }
    })

    export let active = true
    const { getStore } :any = getContext('tsStore');

    const store:LudosStore = getStore();

    const updateRealm = (hash: EntryHashB64) => async (_topology:Topology, name: string) => {
        // ignore realm type we don't update that.
        const realm: Realm | undefined = await store.realmList.getRealm(hash)
        if (realm) {
        let changes = []
        const state: RealmState = realm.state()
        if (state.name != name) {
            store.realmList.requestChanges([
            {
                type: 'set-name',
                hash: realm.hashB64(),
                name: name
            }
            ])
            changes.push(
            {
                type: 'set-name',
                name: name
            })
        }
        if (changes.length > 0) {
            await store.realmList.requestRealmChanges(hash,changes)
        }
        }
        close()
    }
    const archiveRealm = (hash: EntryHashB64) => () => {
        store.realmList.archiveRealm(hash)
        close()
    }
    const close = ()=>{
        active=false
        realmHash=undefined
    }

</script>
<Dialog persistent bind:active>
    <RealmEditor title="Edit Realm" handleSave={updateRealm(realmHash)} handleDelete={archiveRealm(realmHash)} cancelEdit={close} topology={topology} text={editName} story={editStory}/>
</Dialog>
