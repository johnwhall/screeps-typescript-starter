import { LocalStructure } from "./local-structure";
import { RemotableContainer, RemotableSource } from "../remotables/remotable";

export class LocalContainer extends LocalStructure<StructureContainer, STRUCTURE_CONTAINER> implements RemotableContainer {
    readonly type = STRUCTURE_CONTAINER;
    plannedEnergy: number;
    private _source: RemotableSource | undefined;

    constructor(liveObject: StructureContainer) {
        super(liveObject);
        this.plannedEnergy = this.liveObject.store[RESOURCE_ENERGY];
    }

    get store(): StoreDefinition { return this.liveObject.store; }
    get storeCapacity(): number { return this.liveObject.storeCapacity; }
    get energy(): number { return this.liveObject.store[RESOURCE_ENERGY]; }
    get energyCapacity(): number { return this.liveObject.storeCapacity - _.sum(this.liveObject.store) + this.liveObject.store[RESOURCE_ENERGY]; } // TODO: consider caching this

    get source(): RemotableSource | undefined { // TODO: consider storing in memory
        if (this._source === undefined) {
            for (let source of this.liveObject.room.assignedSources) {
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
