import { RootStore, type Commit, type SynGrammar, type SynStore, type Workspace, type WorkspaceStore } from "@holochain-syn/core";
import type { AgentPubKeyB64, Dictionary, EntryHashB64 } from "@holochain-open-dev/core-types";
import { Realm, CommitTypeRealm, Topology } from "./realm";
import type { EntryHashMap, EntryRecord } from "@holochain-open-dev/utils";
import { derived, get, writable, type Readable, type Writable } from "svelte/store";
import { realmGrammar, type RealmDelta, type RealmGrammar, type RealmState } from "./realm";
import { type AgentPubKey, type EntryHash, decodeHashFromBase64 } from "@holochain/client";

export const CommitTypeRealmList :string = "realm-list"

export interface RealmRecord {
    hash: EntryHashB64
    name: string
    status: string
}

export interface Avatar {
    name: string
    url: string
}

export interface RealmListState {
    avatars: Dictionary<Avatar>;
    realms: RealmRecord[];
}


export type RealmListDelta =
  | {
    type: "add-realm";
    hash: EntryHashB64;
    name: string;
    status?: string;
  }
  | {
    type: "set-avatar";
    pubKey: AgentPubKeyB64;
    avatar: Avatar;
  }
  | {
    type: "set-name";
    hash: EntryHashB64;
    name: string;
  }
  | {
    type: "set-status";
    hash: EntryHashB64;
    status: string;
  }
  | {
    type: "set-index";
    hash: EntryHashB64;
    index: number;
  };

export type RealmListGrammar = SynGrammar<
RealmListDelta,
RealmListState
>;

export const realmListGrammar: RealmListGrammar = {
    initState(state)  {
        state.avatars = {}
        state.realms = []
    },
    applyDelta( 
        delta: RealmListDelta,
        state: RealmListState,
        _ephemeralState: any,
        _author: AgentPubKey
      ) {
        if (delta.type == "add-realm") {
            const record: RealmRecord = {
                name: delta.name,
                hash: delta.hash,
                status: delta.status,
            }
            state.realms.unshift(record)
        }
        if (delta.type == "set-name") {
            state.realms.forEach((realm, i) => {
                if (realm.hash === delta.hash) {
                  state.realms[i].name = delta.name;
                }
            });
        }
        if (delta.type == "set-avatar") {
            state.avatars[delta.pubKey] = delta.avatar
        }
        if (delta.type == "set-status") {
            state.realms.forEach((realm, i) => {
                if (realm.hash === delta.hash) {
                  state.realms[i].status = delta.status;
                }
            });
        }
        if (delta.type == "set-index") {
            const index = state.realms.findIndex((realm) => realm.hash == delta.hash)
            if (index >= 0) {
              const c = state.realms[index]
              state.realms.splice(index,1)
              state.realms.splice(index, 0, c)
            }
          }
        }
    }


export class RealmList {
    public workspace: WorkspaceStore<RealmListGrammar>
    public realms: Dictionary<Realm>
    activeRealmHash: Writable<EntryHashB64| undefined> = writable(undefined)

    constructor(public rootStore: RootStore<RealmListGrammar>, public realmsRootStore: RootStore<RealmGrammar>) {
        this.realms = {}
    }

    public static async Create(synStore: SynStore) {
        const rootStore = await synStore.createDeterministicRoot(realmListGrammar, {type: CommitTypeRealmList})
        const realmsRootStore = await synStore.createDeterministicRoot(realmGrammar, {type: CommitTypeRealm})
        const me = new RealmList(rootStore, realmsRootStore);
        const workspaceHash = await rootStore.createWorkspace(
            'main',
            rootStore.root.entryHash
           );
        me.workspace = await rootStore.joinWorkspace(workspaceHash)
        return me
    }
    public static async Join(synStore: SynStore, rootCommit: EntryRecord<Commit>, realmsRootCommit: EntryRecord<Commit>) {
        const rootStore = new RootStore(
            synStore.client,
            realmListGrammar,
            rootCommit
          );
          const realmsRootStore = new RootStore(
            synStore.client,
            realmGrammar,
            realmsRootCommit
          );
        const me = new RealmList(rootStore, realmsRootStore);
        const workspaces: EntryHashMap<Workspace> = get(await rootStore.fetchWorkspaces());
        // if there is no workspace then we have a problem!!
        me.workspace = await rootStore.joinWorkspace(workspaces.keys()[0]);
        return me
    }
    hash() : EntryHash {
        return this.rootStore.root.entryHash
    }
    close() {
        this.workspace.leaveWorkspace()
    }
    stateStore() {
        return this.workspace.state
    }
    state() {
        return get(this.workspace.state)
    }
    requestChanges(deltas: Array<RealmListDelta>) {
        console.log("REQUESTING REALMLIST CHANGES: ", deltas)
        this.workspace.requestChanges(deltas)
    }
    participants()  {
        return this.workspace.participants
    }
    avatars() {
        console.log("AVATARS: ",get(this.workspace.state))
        return derived(this.workspace.state, state => state.avatars)
    }
    async commitChanges() {
        this.workspace.commitChanges()
    }

    async requestRealmChanges(hash: EntryHashB64, deltas: RealmDelta[]) {
        const realm = await this.getRealm(hash)
        if (realm) {
            realm.requestChanges(deltas)
        }
    }

    async requestAtiveRealmChanges(deltas: RealmDelta[]) {
        this.requestRealmChanges(get(this.activeRealmHash), deltas)
    }

    getReadableRealmState(hash: EntryHashB64 | undefined) : Readable<RealmState> | undefined {
        if (hash == undefined) return undefined
        return this.realms[hash].workspace.state
    }
    
    async getRealm(hash: EntryHashB64) : Promise<Realm | undefined> {
        let realm = this.realms[hash]
        if (!realm) {
            const workspaceHash = decodeHashFromBase64(hash)
            realm = this.realms[hash] = new Realm(await this.realmsRootStore.joinWorkspace(workspaceHash));
        }
        return realm
    }

    async setActiveRealm(hash: EntryHashB64 | undefined) {
        let realm
        if (hash) {
            realm = await this.getRealm(hash)
            if (realm) {
                this.activeRealmHash.update((n) => {return hash} )
            }
        }
        if (!realm) {
            this.activeRealmHash.update((n) => {return undefined} )
        }
    }

    async archiveRealm(hash: EntryHashB64) {
        this.requestChanges([{type:"set-status", hash ,status:"archived"}])
        // leave realm and delete
        const realm: Realm = this.realms[hash]
        if (realm) {
            realm.workspace.leaveWorkspace()
            delete this.realms[hash]
        }
        if (get(this.activeRealmHash) == hash) {
            this.setActiveRealm(undefined)
        }
    }

    async unarchiveRealm(hash: EntryHashB64) {
        let changes : RealmListDelta[] = 
        [
            {type:"set-status", hash ,status:""}
        ]

        this.requestChanges(changes)
    }

    closeActiveRealm() {
        this.setActiveRealm(undefined)
    }

    async makeRealm(options: any, fromHash?: EntryHashB64) : Promise<Realm> {
        const realm = await Realm.Create(this.realmsRootStore)
        const workspaceStore = realm.workspace
        const realmHash = realm.hashB64()
        this.realms[realmHash] = realm 
        if (options.topology === undefined) {
            options.topology = Topology.Plane
        }
        if (options !== undefined) {
            let changes = []
            if (options.topology) {
                changes.push({
                    type: "set-topology",
                    topology: options.topology
                })
            }
            if (options.name) {
                changes.push({
                    type: "set-name",
                    name: options.name
                })
            }
            if (options.story) {
                changes.push({
                    type: "set-story",
                    story: options.story
                })
            }
            if (options.spaces) {
                options.spaces.forEach((space)=>{
                    changes.push({
                        type: "add-space",
                        value: space
                    })
                        
                })
            }
            if (changes.length > 0) {
                workspaceStore.requestChanges(changes)
                await workspaceStore.commitChanges()
            }

            this.requestChanges([{
                type: 'add-realm',
                name: realm.state().name,
                hash: realmHash,
                status: ""
            }])
        
        }
        return realm
    }
}
