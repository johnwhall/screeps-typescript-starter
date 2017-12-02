import { RemotableStorage } from "../remotables/remotable";
import { LocalStorage } from "../locals/local-storage";
import { RemoteStructure } from "./remote-structure";

// Storages are always visible, so this is just a wrapper for a LocalStorage
export class RemoteStorage extends RemoteStructure<StructureStorage, STRUCTURE_STORAGE> implements RemotableStorage {
    readonly structureType = STRUCTURE_STORAGE;
    readonly type = STRUCTURE_STORAGE;
    private _local: LocalStorage;

    constructor(flag: Flag) {
        super(flag);
        if (this.room !== undefined) {
            let liveObject = this.room.storage;
            if (liveObject !== undefined) this._local = new LocalStorage(liveObject);
        }
    }

    get liveObject(): StructureStorage { return this._local.liveObject; }

    get store(): StoreDefinition { return this._local.store; }
    get storeCapacity(): number { return this._local.storeCapacity; }
    get energy(): number { return this._local.energy; }
    get energyCapacity(): number { return this._local.energyCapacity; }
    get plannedEnergy(): number { return this._local.plannedEnergy; }
    set plannedEnergy(plannedEnergy: number) { this._local.plannedEnergy = plannedEnergy; }
    get hits(): number { return this._local.hits; }
    get hitsMax(): number { return this._local.hitsMax; }
    get plannedHits(): number { return this._local.plannedEnergy; }
    set plannedHits(plannedHits: number) { this._local.plannedHits = plannedHits; }

    shouldRemove(): boolean { return this._local === undefined; }
    update(): void { super.update(); }
    toString(): string { return `[remote ${this._local.toString().slice(1)}`; }
}
