<script lang="ts">
    import { Dialog } from 'svelte-materialify';
    import RealmEditor from './RealmEditor.svelte';
    import type { LudosStore } from "./ludosStore";
    import { getContext } from 'svelte';
    import { v1 as uuidv1 } from "uuid";
    import type { Topology } from './realm';

    export let active = true
    const { getStore } :any = getContext('tsStore');

    const store:LudosStore = getStore();

    const addRealm = async (topology: Topology, name: string, story: string) => {
        const realm = await store.realmList.makeRealm({topology, name, story, spaces:[
      {
          id: uuidv1(),
          location: {x: 0, y: 0, z:0},
          name: "The Unamed Space",
          text: "You are in a space that has no qualities whatsoever.",
          props: {},
        }
    ]})
        store.realmList.setActiveRealm(realm.hashB64())
        active = false
    }

</script>
<Dialog persistent bind:active>
    <RealmEditor handleSave={addRealm} cancelEdit={()=>active=false} />
</Dialog>
