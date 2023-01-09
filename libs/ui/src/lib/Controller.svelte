<script lang="ts">
    import BoardList from './BoardList.svelte'
    import Toolbar from './Toolbar.svelte'
    import BoardPane from './BoardPane.svelte'
    import Collapsable from './Collapsable.svelte'
    import { LudosStore } from './ludosStore'
    import { setContext } from 'svelte';
    import type { AppAgentClient } from '@holochain/client';
    import type { SynStore } from '@holochain-syn/store';
    import { BoardType } from './board';

    export let boardType: BoardType = BoardType.Ludos
    export let roleName = ""

    // The debug drawer's ability to resized and hidden
    let resizeable
    let resizeHandle
    const minDrawerSize = 0
    const maxDrawerSize = document.documentElement.clientHeight - 30 - 10
    const initResizeable = (resizeableEl) => {
      resizeableEl.style.setProperty('--max-height', `${maxDrawerSize}px`)
      resizeableEl.style.setProperty('--min-height', `${minDrawerSize}px`)
    }
  
    const setDrawerHeight = (height) => {
      document.documentElement.style.setProperty('--resizeable-height', `${height}px`)
    }
    const getDrawerHeight = () => {
      const pxHeight = getComputedStyle(resizeable)
        .getPropertyValue('--resizeable-height')
      return parseInt(pxHeight, 10)
    }
  
    const startDragging = (event) => {
      event.preventDefault()
      const host = resizeable
      const startingDrawerHeight = getDrawerHeight()
      const yOffset = event.pageY
  
      const mouseDragHandler = (moveEvent) => {
        moveEvent.preventDefault()
        const primaryButtonPressed = moveEvent.buttons === 1
        if (!primaryButtonPressed) {
          setDrawerHeight(Math.min(Math.max(getDrawerHeight(), minDrawerSize), maxDrawerSize))
          window.removeEventListener('pointermove', mouseDragHandler)
          return
        }
        setDrawerHeight(Math.min(Math.max((yOffset - moveEvent.pageY ) + startingDrawerHeight, minDrawerSize), maxDrawerSize))
      }
      const remove = window.addEventListener('pointermove', mouseDragHandler)
    }
  
    let drawerHidden = true
    const hideDrawer = () => {
      drawerHidden = true
    }
    const showDrawer = () => {
      drawerHidden = false
    }
  
    let tabShown = false;
    const showTab = () => {
      tabShown = true
    }
    const hideTab = () => {
      tabShown = false
    }
  
    let synStore: SynStore;
    let tsStore: LudosStore;
    
    export let client : AppAgentClient

    $: activeBoardIndex = tsStore ? tsStore.boardList.activeBoardHash : undefined
    $: activeBoardType = tsStore ? tsStore.boardList.activeBoardType : undefined
    $: boardList = tsStore ? tsStore.boardList : undefined

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
    const background=`
The [Players of Ludos](https://docs.google.com/document/d/1HBNgIooElD5widCuX9XmiOzbVIpEF5XXH67mZbnUFjo) had a game they played that involved creating fictional realms.
These realms were crafted by the players who took turns writing new spaces one-by-one and adding them to the previous ones creating a kind of map, that other players
could then wander through and read, almost as novel.

The players considered their play, like our living, a kind of dreaming.  And so when they were crafting new games they felt themselves to be awake.

So, here, dear players, we offer you the chance to join into this long lost game-form. To shift between the dreaming and the waking. Add a new realm below, and observe how an empty space is created.  Click on the yellow
square to edit the description of the space.  You can type in the terminal to begin your dreaming, or if you are clicky type person who remains awake and crafting, then click on a green squares to add an adjacent space.  
Soon you will have crafte an entire realm to share!

May your collective imaginations flourish and your dreams be of delight to you...
`
  </script>
  
  <style>
    .app {
      grid-column: 1/3;
      grid-row: 1/2;
      /* width: 100%; */
      margin: 20px;
    }
    :global(:root) {
      --resizeable-height: 200px;
      --tab-width: 60px;
    }
  
    @media (min-width: 640px) {
      .app {
        max-width: none;
      }
    }
    .issue {
      position:absolute;
      top: 20px;
      right: 20px;
      padding: 10px;
      background-color: rgb(43, 198, 226);
      color: white;
      font-weight: bold;
      border: solid 3px black;
      border-radius: 10px;
    }
  </style>
  
  <svelte:head>
    <script src='https://kit.fontawesome.com/80d72fa568.js' crossorigin='anonymous'></script>
  </svelte:head>
  
  <div class='app'>
    {#if tsStore}
      <Toolbar boardType={boardType}/>
      <Collapsable content={background} title={"Background"} />
      {#if boardList}
      <BoardList boardType={boardType}/>
      {:else}
        Loading for board list...
      {/if}
      {#if $activeBoardIndex !== undefined}
        {#if $activeBoardType === BoardType.Ludos}
          <BoardPane on:requestChange={(event) => {tsStore.boardList.requestBoardChanges($activeBoardIndex,event.detail)}}/>
        {/if}
      {/if}
      <a class="issue" target="github" href="https://github.com/Holo-Host/ludos/issues" title="Report a problem in our GitHub repo">Report Issue</a>
      {:else}
      Loading
    {/if}
  </div>