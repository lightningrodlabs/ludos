<script lang="ts">
    import { Dialog } from 'svelte-materialify';
    import type { Board, BoardState, Topology } from './board';
    import BoardEditor from './BoardEditor.svelte';
    import type { LudosStore } from "./ludosStore";
    import { getContext, onMount } from 'svelte';
    import type { EntryHashB64 } from '@holochain/client';

    export let topology: Topology|undefined
    export let boardHash:EntryHashB64|undefined = undefined
    let editName = ''
    let editStory = ""
    onMount(async () => {

        const board: Board | undefined = await store.boardList.getBoard(boardHash)
        if (board) {
            const state = board.state()
            editName = state.name
        } else {
            console.log("board not found:", boardHash)
        }
    })

    export let active = true
    const { getStore } :any = getContext('tsStore');

    const store:LudosStore = getStore();

    const updateBoard = (hash: EntryHashB64) => async (_topology:Topology, name: string) => {
        // ignore board type we don't update that.
        const board: Board | undefined = await store.boardList.getBoard(hash)
        if (board) {
        let changes = []
        const state: BoardState = board.state()
        if (state.name != name) {
            store.boardList.requestChanges([
            {
                type: 'set-name',
                hash: board.hashB64(),
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
            await store.boardList.requestBoardChanges(hash,changes)
        }
        }
        close()
    }
    const archiveBoard = (hash: EntryHashB64) => () => {
        store.boardList.archiveBoard(hash)
        close()
    }
    const close = ()=>{
        active=false
        boardHash=undefined
    }

</script>
<Dialog persistent bind:active>
    <BoardEditor handleSave={updateBoard(boardHash)} handleDelete={archiveBoard(boardHash)} cancelEdit={close} topology={topology} text={editName} story={editStory}/>
</Dialog>
