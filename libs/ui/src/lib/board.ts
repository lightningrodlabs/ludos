import type { RootStore, SynGrammar, WorkspaceStore } from "@holochain-syn/core";
import { get } from "svelte/store";
import { v1 as uuidv1 } from "uuid";
import { type AgentPubKey, type EntryHash, type AgentPubKeyB64, type EntryHashB64, type decodeHashFromBase64, encodeHashToBase64 } from "@holochain/client";

export const DEFAULT_STICKIE_VOTE_TYPES = [
    {type: "1", emoji: "🗨", toolTip: "I want to talk about this one.", maxVotes: 3},
    {type: "2", emoji: "⭐", toolTip: "Interesting!", maxVotes: 1},
    {type: "3", emoji: "❓", toolTip: "I have questions about this topic.", maxVotes: 1},
]

export const enum BoardType {
  Ludos = 'Ludos',
}

export class VoteType {
    type: uuidv1
    constructor(public emoji: string, public toolTip: string, public maxVotes: number){
        this.type = uuidv1()
    }
}

export type Space = {
    id: uuidv1;
    x: number
    y: number
    z: number
    text: string;
    props: Object;
  };
  
  export interface BoardState {
    type: BoardType;
    status: string;
    name: string;
    story: string;
    spaces: Space[];
  }
  
  export type BoardDelta =
    | {
      type: "set-type";
      boardType: BoardType;
      }
    | {
      type: "set-status";
      status: string;
      }
    | {
        type: "add-space";
        value: Space;
      }
    | {
        type: "set-name";
        name: string;
      }
      | {
        type: "set-story";
        story: string;
      }
      | {
        type: "update-space-props";
        id: uuidv1;
        props: Object;
      }
   | {
        type: "update-space-text";
        id: uuidv1;
        text: string;
      }
    | {
        type: "delete-space";
        id: string;
      };
  
  export type BoardGrammar = SynGrammar<
  BoardDelta,
  BoardState
  >;
  
  export const boardGrammar: BoardGrammar = {
    initState(state)  {
      state.status = ""
      state.name = "untitled"
      state.story = "backstory yet to be written"
      state.spaces = []
    },
    applyDelta( 
      delta: BoardDelta,
      state: BoardState,
      _ephemeralState: any,
      _author: AgentPubKey
    ) {

      if (delta.type == "set-type") {
        state.type = delta.boardType
      }      
      if (delta.type == "set-status") {
        state.status = delta.status
      }
      if (delta.type == "set-name") {
        state.name = delta.name
      }
      if (delta.type == "set-story") {
        state.story = delta.story
      }
      else if (delta.type == "add-space") {
        state.spaces.push(delta.value)
      }
      else if (delta.type == "update-space-text") {
        state.spaces.forEach((space, i) => {
          if (space.id === delta.id) {
            state.spaces[i].text = delta.text;
          }
        });
      }
      else if (delta.type == "update-space-props") {
        state.spaces.forEach((space, i) => {
          if (space.id === delta.id) {
            state.spaces[i].props = delta.props;
          }
        });
      }
      else if (delta.type == "delete-space") {
        const index = state.spaces.findIndex((space) => space.id === delta.id)
        state.spaces.splice(index,1)
      }
    },
  };
  

export const CommitTypeBoard :string = "board"

export class Board {    
    constructor(public workspace: WorkspaceStore<BoardGrammar>) {
    }

    public static async Create(rootStore: RootStore<BoardGrammar>) {
        const workspaceHash = await rootStore.createWorkspace(
            `${new Date}`,
            rootStore.root.entryHash
           );
        const me = new Board(await rootStore.joinWorkspace(workspaceHash));
        return me
    }

    hash() : EntryHash {
        return this.workspace.workspaceHash
    }
    hashB64() : EntryHashB64 {
        return encodeHashToBase64(this.workspace.workspaceHash)
    }
    close() {
        this.workspace.leaveWorkspace()
    }
    state(): BoardState {
        return get(this.workspace.state)
    }
    requestChanges(deltas: Array<BoardDelta>) {
        console.log("REQUESTING BOARD CHANGES: ", deltas)
        this.workspace.requestChanges(deltas)
    }
    participants()  {
        return this.workspace.participants
    }
    async commitChanges() {
        this.workspace.commitChanges()
    }
}
