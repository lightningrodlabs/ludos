<script type="ts">
  import { BoardType } from "./board";
  import TSLogoIcon from "./icons/TSLogoIcon.svelte";
  export let boardType : BoardType = BoardType.Ludos

</script>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    height: 70px;
  }
  .logo {
    width: 40px;
    margin-right: 10px;
    display: contents;
  }
  .logo-text {
    padding-bottom: 5px;
    margin-left: 15px;
  }
</style>

<div class='toolbar'>
  {#if boardType === BoardType.Ludos}
    <div class="logo"><TSLogoIcon /></div><h1 class="logo-text">Realms of Ludos</h1>
  {/if}
</div>
