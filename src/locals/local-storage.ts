import { LocalStructure } from "./local-structure";
import { RemotableStorage } from "../remotables/remotable";

export class LocalStorage extends LocalStructure<StructureStorage, STRUCTURE_STORAGE> implements RemotableStorage {
    readonly type = STRUCTURE_STORAGE;
    availableEnergyForPickup: number;
    plannedEnergyWithIncoming: number;

    constructor(liveObject: StructureStorage) {
        super(liveObject);
        this.availableEnergyForPickup = this.liveObject.store[RESOURCE_ENERGY];
        this.plannedEnergyWithIncoming = this.availableEnergyForPickup;
    }

    get store(): StoreDefinition { return this.liveObject.store; }
    get storeCapacity(): number { return this.liveObject.storeCapacity; }
    get energy(): number { return this.liveObject.store[RESOURCE_ENERGY]; }
    get energyCapacity(): number { return this.liveObject.storeCapacity - _.sum(this.liveObject.store) + this.liveObject.store[RESOURCE_ENERGY]; } // TODO: consider caching this
}

export function init() {
    if (!StructureStorage.prototype.remotable) {
        Object.defineProperty(StructureStorage.prototype, "remotable", {
            get: function () {
                if (this._remotable === undefined) this._remotable = new LocalStorage(this);
                return this._remotable;
            },
            set: function(remotable: RemotableStorage) {
                this._remotable = remotable;
            }
        });
    }
}
