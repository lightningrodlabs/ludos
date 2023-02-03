<script lang="ts">
    import { Dialog } from 'svelte-materialify';
    import { BoardType } from './board';
    import BoardEditor from './BoardEditor.svelte';
    import type { LudosStore } from "./ludosStore";
    import { getContext } from 'svelte';
    import { v1 as uuidv1 } from "uuid";

    export let boardType
    export let active = true
    const { getStore } :any = getContext('tsStore');

    const store:LudosStore = getStore();

    const addBoard = async (type: BoardType, name: string, story: string) => {
        const board = await store.boardList.makeBoard({type, name, story, spaces:[
      {
          id: uuidv1(),
          x: 0,
          y: 0,
          text: "You are in a space that has no qualities whatsoever.",
          props: {},
        }
    ]})
        store.boardList.setActiveBoard(board.hashB64())
        active = false
    }

</script>
<Dialog persistent bind:active>
    <BoardEditor handleSave={addBoard} cancelEdit={()=>active=false} boardType={boardType} />
</Dialog>
