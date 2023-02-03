import { createEventDispatcher } from "svelte";
import type { BoardState } from "./board";
import { v1 as uuidv1 } from "uuid";
import { cloneDeep, isEqual } from "lodash";
import type { AgentPubKeyB64 } from "@holochain-open-dev/core-types";

const download = (filename: string, text: string) => {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

export class Pane {    
    public dispatch
  
    constructor() {
        this.dispatch = createEventDispatcher()
    }
    exportBoard = (state: BoardState) => {
        const fileName = `ts_${state.name}.json`
        download(fileName, JSON.stringify(state))
        alert(`Your board was exported to your Downloads folder as: '${fileName}'`)
    }

    addSpace = (text: string, props: any, x:number, y:number) => {
        const space = {
          id: uuidv1(),
          x,
          y,
          text,
          props,
        };
        this.dispatch("requestChange", [{ type: "add-space", value: space }]);
    };

    updateSpace = (spaces, id: uuidv1, closeFn) => (text:string, groupId: uuidv1, props:any) => {
        const space = spaces.find((space) => space.id === id);
        if (!space) {
          console.error("Failed to find item with id", id);
        } else {
          let changes = []
          if (space.text != text) {
            changes.push({ type: "update-space-text", id: space.id, text: text })
          }
          console.log("space.props", space.props, "props", props)
          if (!isEqual(space.props, props)) {
            changes.push({ type: "update-space-props", id: space.id, props: cloneDeep(props)})
          }
          if (changes.length > 0) {
          this.dispatch("requestChange", changes);
          }
        }
        closeFn()
    };
    
    deleteSpace = (id: uuidv1, closeFn) => () => {
        this.dispatch("requestChange", [{ type: "delete-space", id }]);
        closeFn()
    };
 
}