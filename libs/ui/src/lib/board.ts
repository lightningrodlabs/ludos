import type { RootStore, SynGrammar, WorkspaceStore } from "@holochain-syn/core";
import { get } from "svelte/store";
import { v1 as uuidv1 } from "uuid";
import type { AgentPubKey, EntryHash, AgentPubKeyB64, EntryHashB64 } from "@holochain/client";
import { serializeHash } from "@holochain-open-dev/utils";

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
    group: uuidv1;
    votes: Object;
    props: Object;
  };
  
  export interface BoardState {
    type: BoardType;
    status: string;
    name: string;
    story: string;
    groups: Group[];
    stickies: Space[];
    voteTypes: VoteType[];
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
        type: "add-sticky";
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
        type: "set-groups";
        groups: Group[];
      }
    | {
        type: "set-vote-types";
        voteTypes: VoteType[];
      }
    | {
        type: "add-group";
        group: Group;
      }
    | {
        type: "delete-group";
        id: number;
      }
    | {
        type: "set-group-index";
        id: uuidv1;
        index: number;
      }
    | {
        type: "update-sticky-group";
        id: uuidv1;
        group: uuidv1;
      }
      | {
        type: "update-sticky-props";
        id: uuidv1;
        props: Object;
      }
   | {
        type: "update-sticky-text";
        id: uuidv1;
        text: string;
      }
    | {
        type: "update-sticky-votes";
        id: uuidv1;
        voteType: string;
        voter: AgentPubKeyB64;
        count: number
      }
    | {
        type: "delete-sticky";
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
      state.groups = [{id:UngroupedId, name:"group1"}]
      state.stickies = []
      state.voteTypes = []
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
      if (delta.type == "set-groups") {
        state.groups = delta.groups
      }
      if (delta.type == "add-group") {  
        state.groups.push(delta.group)
      }
      if (delta.type == "delete-group") {
        const index = state.groups.findIndex((group) => group.id === delta.id)
        if (index >= 0) {
          state.groups.splice(index,1)
        }
      }
      if (delta.type == "set-group-index") {
        const index = state.groups.findIndex((group) => group.id === delta.id)
        if (index >= 0) {
          const c = state.groups[index]
          state.groups.splice(index,1)
          state.groups.splice(index, 0, c)
        }
      }
      if (delta.type == "set-vote-types") {
        state.voteTypes = delta.voteTypes
      }
      else if (delta.type == "add-sticky") {
        state.stickies.push(delta.value)
      }
      else if (delta.type == "update-sticky-text") {
        state.stickies.forEach((sticky, i) => {
          if (sticky.id === delta.id) {
            state.stickies[i].text = delta.text;
          }
        });
      }
      else if (delta.type == "update-sticky-group") {
        state.stickies.forEach((sticky, i) => {
          if (sticky.id === delta.id) {
            state.stickies[i].group = delta.group;
          }
        });
      }
      else if (delta.type == "update-sticky-props") {
        state.stickies.forEach((sticky, i) => {
          if (sticky.id === delta.id) {
            state.stickies[i].props = delta.props;
          }
        });
      }
      else if (delta.type == "update-sticky-votes") {
        state.stickies.forEach((sticky, i) => {
          if (sticky.id === delta.id) {
            if (!state.stickies[i].votes[delta.voteType]) {
              state.stickies[i].votes[delta.voteType] = {}
            }
            state.stickies[i].votes[delta.voteType][delta.voter] = delta.count;
          }
        });
      }
      else if (delta.type == "delete-sticky") {
        const index = state.stickies.findIndex((sticky) => sticky.id === delta.id)
        state.stickies.splice(index,1)
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
        return serializeHash(this.workspace.workspaceHash)
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

export const UngroupedId = ""
export class Group {
    id: uuidv1
    constructor(public name: string) {
        this.id =  uuidv1()
    }
}