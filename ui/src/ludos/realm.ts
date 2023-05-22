import type { RootStore, SynGrammar, WorkspaceStore } from "@holochain-syn/core";
import { get } from "svelte/store";
import { v1 as uuidv1 } from "uuid";
import { type AgentPubKey, type EntryHash, type AgentPubKeyB64, type EntryHashB64, type decodeHashFromBase64, encodeHashToBase64 } from "@holochain/client";
import type { Dictionary } from "@holochain-open-dev/core-types";

export type Location = {
  x: number
  y: number
  z: number
}

export const enum Topology {
  Plane = 'Plane',
  Rhyzome = 'Rhyzome',
  Line = 'Line',
}

export class Connection {
    public id: uuidv1
    constructor(public from: uuidv1, public to: uuidv1, public text: string){
        this.id = uuidv1()
    }
}

export type Space = {
    id: uuidv1;
    name: string;
    location: Location
    text: string;
    props: Object;
};
  
export interface RealmState {
  topology: Topology
  status: string;
  name: string;
  story: string;
  spaces: Dictionary<Space>;
  connections: Dictionary<Connection>
}

export type RealmDelta =
  | {
    type: "set-topology";
    topology: Topology;
    }
  | {
    type: "set-status";
    status: string;
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
      type: "update-space-name";
      id: uuidv1;
      name: string;
    }
  | {
      type: "update-space-location";
      id: uuidv1;
      location: Location;
    }
  | {
      type: "add-space";
      value: Space;
    }
  | {
      type: "delete-space";
      id: string;
    }
    | {
      type: "add-connection";
      connection: Connection;
    }
    | {
      type: "set-connections";
      connections: Connection[];
    }
  | {
      type: "delete-connection";
      id: string;
    };
  
export type RealmGrammar = SynGrammar<
  RealmDelta,
  RealmState
  >;
  
export const realmGrammar: RealmGrammar = {
  initState(state)  {
    state.status = ""
    state.name = "untitled"
    state.story = "backstory yet to be written"
    state.spaces = {}
    state.connections = {}
  },
  applyDelta( 
    delta: RealmDelta,
    state: RealmState,
    _ephemeralState: any,
    _author: AgentPubKey
  ) {

    if (delta.type == "set-topology") {
      state.topology = delta.topology
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
      state.spaces[delta.value.id] = delta.value
    }
    else if (delta.type == "update-space-name") {
      if (state.spaces[delta.id] !== undefined) {
        state.spaces[delta.id].name = delta.name
      }
    }
    else if (delta.type == "update-space-text") {
      if (state.spaces[delta.id] !== undefined) {
        state.spaces[delta.id].text = delta.text
      }
    }
    else if (delta.type == "update-space-location") {
      if (state.spaces[delta.id] !== undefined) {
        state.spaces[delta.id].location = delta.location;
      }
    }
    else if (delta.type == "update-space-props") {
      if (state.spaces[delta.id] !== undefined) {
        state.spaces[delta.id].props = delta.props;
      }
    }
    else if (delta.type == "delete-space") {
      delete state.spaces[delta.id]
    }
    else if (delta.type == "add-connection") {
      state.connections[delta.connection.id] = delta.connection
    }
    else if (delta.type == "delete-connection") {
      delete state.connections[delta.id]
    }
    else if (delta.type == "set-connections") {
      for (const c of delta.connections) {
        state.connections[c.id] = c
      }
    }
  },
};


export const CommitTypeRealm :string = "realm"

export class Realm {    
    constructor(public workspace: WorkspaceStore<RealmGrammar>) {
    }

    public static async Create(rootStore: RootStore<RealmGrammar>) {
        const workspaceHash = await rootStore.createWorkspace(
            `${new Date}`,
            rootStore.root.entryHash
           );
        const me = new Realm(await rootStore.joinWorkspace(workspaceHash));
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
    state(): RealmState {
        return get(this.workspace.state)
    }
    requestChanges(deltas: Array<RealmDelta>) {
        console.log("REQUESTING REALM CHANGES: ", deltas)
        this.workspace.requestChanges(deltas)
    }
    participants()  {
        return this.workspace.participants
    }
    async commitChanges() {
        this.workspace.commitChanges()
    }
}


export interface UIProps {
  dreaming: boolean
}
