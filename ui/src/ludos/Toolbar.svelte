<script type="ts">
  import LogoIcon from "./icons/LogoIcon.svelte";
  import Folk from "./Folk.svelte";
  import { Icon, Button } from 'svelte-materialify';
  import { mdiBug } from '@mdi/js';
  import RealmMenu from "./RealmMenu.svelte";

</script>

<div class='toolbar'>
  <div class="left-items">
    <div class="logo"><LogoIcon /></div><h4 class="logo-text">Realms of Ludos</h4>
    <RealmMenu ></RealmMenu>
  </div>
  <div class="right-items">
    <Folk></Folk>
    <Button icon title="Report a problem in our GitHub repo" on:click={()=>window.open("https://github.com/lightningrodlabs/ludos/issues", '_blank')}>
      <Icon path={mdiBug} style={"color: #3672b9"} />
    </Button>
  </div>
</div>


<style>
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: white;
    padding-left: 19px;
    padding-right: 10px;
    padding-top: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #222;
  }
  .logo {
    width: 40px;
    margin-right: 10px;
    display: contents;
    cursor: pointer;
  }
  .logo-text {
    padding-bottom: 5px;
    margin-left: 15px;
  }
  .right-items {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
  }
  .left-items {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
  }
</style>