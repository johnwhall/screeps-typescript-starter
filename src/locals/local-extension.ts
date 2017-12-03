import { LocalStructure } from "./local-structure";
import { RemotableExtension } from "../remotables/remotable";

export class LocalExtension extends LocalStructure<StructureExtension, STRUCTURE_EXTENSION> implements RemotableExtension {
    readonly type = STRUCTURE_EXTENSION;
    availableEnergyForPickup: number;
    plannedEnergyWithIncoming: number;

    constructor(liveObject: StructureExtension) {
        super(liveObject);
        this.availableEnergyForPickup = this.energy;
        this.plannedEnergyWithIncoming = this.energy;
    }

    get energy(): number { return this.liveObject.energy; }
    get energyCapacity(): number { return this.liveObject.energyCapacity; }
}

export function init() {
    if (!StructureExtension.prototype.remotable) {
        Object.defineProperty(StructureExtension.prototype, "remotable", {
            get: function () {
                if (this._remotable === undefined) this._remotable = new LocalExtension(this);
                return this._remotable;
            },
            set: function(remotable: RemotableExtension) {
                this._remotable = remotable;
            }
        });
    }
}
