<script lang="ts">
    import Toolbar from './Toolbar.svelte'
    import BoardPane from './BoardPane.svelte'
    import { LudosStore } from './ludosStore'
    import { setContext } from 'svelte';
    import type { AppAgentClient } from '@holochain/client';
    import type { SynStore } from '@holochain-syn/store';
    import { BoardType } from './board';
    import { MaterialApp, Icon } from 'svelte-materialify';
    import { mdiArchiveArrowUp, mdiCog, mdiShapeSquarePlus } from '@mdi/js';
    import { fade } from 'svelte/transition';

    export let boardType: BoardType = BoardType.Ludos
    export let roleName = ""

    let synStore: SynStore;
    let tsStore: LudosStore;
    
    export let client : AppAgentClient

    $: activeBoardIndex = tsStore ? tsStore.boardList.activeBoardHash : undefined
    $: activeBoardType = tsStore ? tsStore.boardList.activeBoardType : undefined
    $: boardList = tsStore ? tsStore.boardList.stateStore() : undefined
    $: archivedBoards = boardList ? $boardList.boards.filter((board)=>board.status === "archived") : []
    $: activeBoards = boardList ? $boardList.boards.filter((board)=>board.status !== "archived") : []

    initialize()

    setContext('synStore', {
      getStore: () => synStore,
    });
  
    setContext('tsStore', {
      getStore: () => tsStore,
    });

    async function initialize() : Promise<void> {
      const store = createStore()
      synStore = store.synStore;
      try {
        await store.loadBoards()
        tsStore = store
      } catch (e) {
        console.log("Error loading boards:", e)
      }
    }
    function createStore() : LudosStore {
      const store = new LudosStore(
        client,
        roleName
      );
      return store
    }
  </script>
   
  <svelte:head>
    <script src='https://kit.fontawesome.com/80d72fa568.js' crossorigin='anonymous'></script>
  </svelte:head>
<MaterialApp>
  <div class='app'>
    {#if tsStore}
      <Toolbar boardType={boardType}/>
      <div class="transition-container">
      {#if boardList && $boardList.boards.length == 0}
        <div class="welcome-text" transition:fade>
          <p>
          The <a href="https://docs.google.com/document/d/1HBNgIooElD5widCuX9XmiOzbVIpEF5XXH67mZbnUFjo">Players of Ludos</a> had a game they played that involved creating fictional realms.
          These realms were crafted by the players who took turns writing new spaces one-by-one and adding them to the previous ones creating a kind of map, that other players
          could then wander through and read, almost as novel.
          </p>
          <p>
            The players considered their play, like our living, a kind of dreaming.  And so when they were crafting new games they felt themselves to be awake.
          </p>
          <p>      
          So, here, dear players, we offer you the chance to join into this long lost game-form. To shift between the dreaming and the waking. 
          </p>
          <p>
            Click on the <Icon style="width:20px; color:black; vertical-align: bottom;" path={mdiShapeSquarePlus}></Icon> above to create your first realm.

            Click on the yellow square to edit the description of the space.  You can type in the terminal to begin your dreaming, or if you are clicky type person who remains awake and crafting, then click on a green squares to add an adjacent space.  
            Soon you will have crafted an entire realm to share!
          </p>
          <p>
          May your collective imaginations flourish and your dreams be of delight to you...
          </p>
        </div>
      {/if}
      {#if boardList && $boardList.boards.length > 0 && $activeBoardIndex === undefined}
        <div class="welcome-text" transition:fade>
          <p>Active Realms: {activeBoards.length}, Archived Realms: {archivedBoards.length}</p>
            <p>
              Select a realm from the dropdown above, or add a new one with the  <Icon style="width:20px; color:black; vertical-align: bottom;" path={mdiShapeSquarePlus}></Icon> button.
            </p>

          <p>You can always edit these settings with the <Icon style="width:20px; color:black; vertical-align: bottom;" path={mdiCog}></Icon> button in the upper right when you have a realm selected. </p>
          <p>Any realms that you have archived will appear under the <Icon style="width:20px; color:black; vertical-align: bottom;" path={mdiArchiveArrowUp}></Icon> button, and you can un-archive them by selecting them from the list.</p>
        </div>
      {/if}

      {#if $activeBoardIndex !== undefined}
        {#if $activeBoardType === BoardType.Ludos}
          <div transition:fade>
          <BoardPane on:requestChange={(event) => {tsStore.boardList.requestBoardChanges($activeBoardIndex,event.detail)}}/>
          </div>
        {/if}
      {/if}
    </div>
    {:else}
      <div class="loading"><div class="loader"></div></div>
    {/if}
  </div>
</MaterialApp>

<style>
  .app {
    margin: 0;
    padding-bottom: 10px;
    background-color: lightgray;
    height: 100vh;
  }
  .welcome-text {
    border-radius: 5px;
    border: 1px solid #222;
    margin: auto;
    margin-top: 50px;
    max-width: 650px;
    padding: 26px;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.5);
    background-color: white;
  }

  @media (min-width: 640px) {
    .app {
      max-width: none;
    }
  }
  .loading {
    text-align: center;
    padding-top: 100px;
  }
  .loader {
    border: 8px solid #f3f3f3;
    border-radius: 50%;
    border-top: 8px solid #3498db;
    width: 50px;
    height: 50px;
    -webkit-animation: spin 2s linear infinite; /* Safari */
    animation: spin 2s linear infinite;
    display: inline-block;
  }
  @-webkit-keyframes spin {
    0% { -webkit-transform: rotate(0deg); }
    100% { -webkit-transform: rotate(360deg); }
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .transition-container {
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 1fr;
  }

  .transition-container > * {
    grid-row: 1;
    grid-column: 1;
  }
</style>
