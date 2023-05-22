<script lang="ts">
  import { onMount } from "svelte";
  import AvatarIcon from './AvatarIcon.svelte';
  export let fontSize = '20px';
  export let maxHeight = '100%';
  export let maxWidth = '100%';
	$: cssVarStyles = `--font-size:${fontSize};--max-h:${maxHeight};--max-w:${maxWidth};`;

  export let welcome = "Welcome to the Realms of Ludos"
  export let doCommand = (command:string):string => {
    return `"${command}"" not implmented`
  }
  export const setFullscreen = (state) => {
    fullscreen = state
  }
  export let fullscreen = false

  onMount(async () => {
		await addToScreen(welcome)
    focus()
	});
  export const addToScreen = async (text:string) => {
    const x = text.split('')
    for (const char of x) {
      screen.innerHTML+= char
      await new Promise(r => setTimeout(r, 1));
      }
    screen.innerHTML+= "\n"
    screen.scrollTo(0, screen.scrollHeight)
  }
  export const focus = () => {
    input.focus()
  }
  const doChange = async (e) => {
    await addToScreen(PROMPT+" "+input.value)
    await addToScreen(doCommand(input.value))
    input.value = ""
  }
  let input
  let screen
  let PROMPT = ">"
</script>

<div class="term {fullscreen?"fullscreen crt":''}" style="{cssVarStyles}">
  <pre bind:this={screen} class="text screen"
   on:mousedown={e=>e.preventDefault()}
   on:click={(e)=>{e.preventDefault();e.stopImmediatePropagation()}}></pre>
  <div class="cmd">
    <span class="text">{PROMPT}</span>&nbsp;
    <input bind:this={input} class="text cmd-input" on:change={doChange}>
  </div>
</div>

<style>

.fullscreen {
    position: fixed;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    background: rgba(51,51,51,0.7);
    z-index: 10;
}
.term {
  background-color:black;
  display: flex;
  flex-direction: column;
  max-width: var(--max-w, 100%);
  max-height: var(--max-h, 100%);
}
.screen {
  overflow-y: auto;
  white-space: pre-wrap;
  flex-grow: 1;
}
.cmd {
  display: flex;
}
.cmd-input {
  outline: none;
  flex-grow: 1;
}
.text {
  color: #f90;
  font-family: Courier New;
  font-size: var(--font-size, 20px);
  text-shadow: 0px 0px 10px #f90, 0px 0px 5px #f90;
  -webkit-font-smoothing: none;
}
input {
  background-color: black;
  border:none;
}


  .crt::after {
  content: " ";
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: rgba(18, 16, 16, 0.1);
  opacity: 0;
  pointer-events: none;
}
.crt::before {
  content: " ";
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
  background-size: 100% 2px, 3px 100%;
  pointer-events: none;
}

.crt {
  animation: textShadow 4.6s infinite;
}
@keyframes textShadow {
  0% {
    text-shadow: 0.4389924193300864px 0 1px rgba(0,30,255,0.5), -0.4389924193300864px 2px 1px rgba(255,0,80,0.53), 0 0 3px;
  }
  5% {
    text-shadow: 2.7928974010788217px 0 1px rgba(0,30,255,0.75), -2.7928974010788217px 2px 1px rgba(255,0,80,0.53), 0 0 3px;
  }
  10% {
    text-shadow: 0.02956275843481219px 0 1px rgba(0,30,255,0.5), -0.02956275843481219px 2px 1px rgba(255,0,80,0.53), 0 0 3px;
  }
  15% {
    text-shadow: 0.40218538552878136px 0 1px rgba(0,30,255,0.75), -0.40218538552878136px 0 1px rgba(255,0,80,0.53), 0 0 3px;
  }
  20% {
    text-shadow: 3.4794037899852017px 0 1px rgba(0,30,255,0.5), -3.4794037899852017px 0 1px rgba(255,0,80,0.53), 0 0 3px;
  }
  25% {
    text-shadow: 1.6125630401149584px 0 1px rgba(0,30,255,0.75), -1.6125630401149584px 0 1px rgba(255,0,80,0.53), 0 0 3px;
  }
  30% {
    text-shadow: 0.7015590085143956px 0 1px rgba(0,30,255,0.5), -0.7015590085143956px 0 1px rgba(255,0,80,0.53), 0 0 3px;
  }
  35% {
    text-shadow: 3.896914047650351px 0 1px rgba(0,30,255,0.75), -3.896914047650351px 0 1px rgba(255,0,80,0.53), 0 0 3px;
  }
  40% {
    text-shadow: 3.870905614848819px 0 1px rgba(0,30,255,0.5), -3.870905614848819px 0 1px rgba(255,0,80,0.53), 0 0 3px;
  }
  45% {
    text-shadow: 2.231056963361899px 0 1px rgba(0,30,255,0.75), -2.231056963361899px -2px 1px rgba(255,0,80,0.53), 0 0 3px;
  }
  50% {
    text-shadow: 0.08084290417898504px 0 1px rgba(0,30,255,0.5), -0.08084290417898504px -2px 1px rgba(255,0,80,0.53), 0 0 3px;
  }
  55% {
    text-shadow: 2.3758461067427543px 0 1px rgba(0,30,255,0.75), -2.3758461067427543px -2px 1px rgba(255,0,80,0.53), 0 0 3px;
  }
  60% {
    text-shadow: 2.202193051050636px 0 1px rgba(0,30,255,0.5), -2.202193051050636px -2px 1px rgba(255,0,80,0.53), 0 0 3px;
  }
  65% {
    text-shadow: 2.8638780614874975px 0 1px rgba(0,30,255,0.75), -2.8638780614874975px -2px 1px rgba(255,0,80,0.53), 0 0 3px;
  }
  70% {
    text-shadow: 0.48874025155497314px 0 1px rgba(0,30,255,0.5), -0.48874025155497314px 0 1px rgba(255,0,80,0.53), 0 0 3px;
  }
  75% {
    text-shadow: 1.8948491305757957px 0 1px rgba(0,30,255,0.75), -1.8948491305757957px 0 1px rgba(255,0,80,0.53), 0 0 3px;
  }
  80% {
    text-shadow: 0.0833037308038857px 0 1px rgba(0,30,255,0.5), -0.0833037308038857px 0 1px rgba(255,0,80,0.53), 0 0 3px;
  }
  85% {
    text-shadow: 0.09769827255241735px 0 1px rgba(0,30,255,0.75), -0.09769827255241735px 0 1px rgba(255,0,80,0.53), 0 0 3px;
  }
  90% {
    text-shadow: 3.443339761481782px 0 1px rgba(0,30,255,0.5), -3.443339761481782px 0 1px rgba(255,0,80,0.53), 0 0 3px;
  }
  95% {
    text-shadow: 2.1841838852799786px 0 1px rgba(0,30,255,0.75), -2.1841838852799786px 0 1px rgba(255,0,80,0.53), 0 0 3px;
  }
  100% {
    text-shadow: 2.6208764473832513px 0 1px rgba(0,30,255,0.5), -2.6208764473832513px 0 1px rgba(255,0,80,0.53), 0 0 3px;
  }
}


</style>
