import { Remotable } from "./remotable";

export interface RemotableContainer extends Remotable<StructureContainer> {
    readonly energy: number;
    readonly energyCapacity: number;
}

declare global {
    interface StructureContainer {
        readonly energy: number;
        readonly energyCapacity: number;
    }
}

export function init() {
    if (!StructureContainer.prototype.energy) {
        Object.defineProperty(StructureContainer.prototype, "energy", {
            get: function () { return this.store.energy; }
        });
    }

    if (!StructureContainer.prototype.energyCapacity) {
        Object.defineProperty(StructureContainer.prototype, "energyCapacity", {
            get: function () {
                if (this._energyCapacity === undefined) { this._energyCapacity = this.storeCapacity - _.sum(this.store) + this.store.energy }
                return this._energyCapacity;
            }
        });
    }
}
