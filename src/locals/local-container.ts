import { LocalStructure } from "./local-structure";
import { RemotableContainer } from "../remotables/remotable";

export class LocalContainer extends LocalStructure<StructureContainer, STRUCTURE_CONTAINER> implements RemotableContainer {
    plannedEnergy: number;

    constructor(liveObject: StructureContainer) {
        super(liveObject);
        this.plannedEnergy = this.liveObject.store[RESOURCE_ENERGY];
    }

    get store(): StoreDefinition { return this.liveObject.store; }
    get storeCapacity(): number { return this.liveObject.storeCapacity; }
    get energy(): number { return this.liveObject.store[RESOURCE_ENERGY]; }
    get energyCapacity(): number { return this.liveObject.storeCapacity - _.sum(this.liveObject.store) + this.liveObject.store[RESOURCE_ENERGY]; } // TODO: consider caching this
}

export function init() {
    if (!StructureContainer.prototype.remotable) {
        Object.defineProperty(StructureContainer.prototype, "remotable", {
            get: function () {
                if (this._remotable === undefined) this._remotable = new LocalContainer(this);
                return this._remotable;
            },
            set: function(remotable: RemotableContainer) {
                this._remotable = remotable;
            }
        });
    }
}
