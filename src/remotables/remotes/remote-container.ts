import { RemoteStructure } from "./remote-structure";
import { RemotableContainer, RemotableSource } from "../remotable";

export class RemoteContainer extends RemoteStructure<StructureContainer, STRUCTURE_CONTAINER> implements RemotableContainer {
    readonly type = STRUCTURE_CONTAINER;
    readonly structureType: STRUCTURE_CONTAINER = STRUCTURE_CONTAINER;
    availableEnergyForPickup: number;
    plannedEnergyWithIncoming: number;
    private _liveObject: StructureContainer;
    private _store: StoreDefinition;
    private _storeCapacity: number;
    private _source: RemotableSource | undefined;

    get liveObject(): StructureContainer | undefined {
        if (this._liveObject === undefined && this.room !== undefined) this._liveObject = <StructureContainer>this.pos.lookFor(LOOK_STRUCTURES).filter((s: RoomObject) => (<Structure>s).structureType == STRUCTURE_CONTAINER)[0];
        return this._liveObject;
    }

    get store(): StoreDefinition {
        if (this._store === undefined) this._store = this.flag.memory.lastKnownStore;
        if (this._store === undefined) this._store = <StoreDefinition>{};
        return this._store;
    }

    get storeCapacity(): number {
        if (this._storeCapacity === undefined) this._storeCapacity = this.flag.memory.lastKnownStoreCapacity;
        return this._storeCapacity;
    }

    get energy(): number { return this.store[RESOURCE_ENERGY]; }
    get energyCapacity(): number { return this.storeCapacity - _.sum(this.store) + this.store[RESOURCE_ENERGY]; } // TODO: consider caching this

    get source(): RemotableSource | undefined { // TODO: consider storing in memory
        if (this._source === undefined && this.assignedRoom !== undefined) {
            for (let source of this.assignedRoom.assignedSources) {
                if (this.pos.inRangeTo(source, 1)) {
                    this._source = source;
                    source.container = this;
                    break;
                }
            }
        }
        return this._source;
    }

    set source(source: RemotableSource | undefined) { this._source = source; }

    update(): void {
        super.update();
        if (this.liveObject !== undefined) {
            this.flag.memory.lastKnownStore = this.liveObject.store;
            this.flag.memory.lastKnownStoreCapacity = this.liveObject.storeCapacity;
        }
        this.availableEnergyForPickup = this.energy;
        this.plannedEnergyWithIncoming = this.energy;
    }

}
