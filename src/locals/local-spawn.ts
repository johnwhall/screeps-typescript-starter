import { LocalStructure } from "./local-structure";
import { RemotableSpawn } from "../remotables/remotable";

export class LocalSpawn extends LocalStructure<StructureSpawn, STRUCTURE_SPAWN> implements RemotableSpawn {
    readonly type = STRUCTURE_SPAWN;
    availableEnergyForPickup: number;
    plannedEnergyWithIncoming: number;

    constructor(liveObject: StructureSpawn) {
        super(liveObject);
        this.availableEnergyForPickup = this.energy;
        this.plannedEnergyWithIncoming = this.energy;
    }

    get energy(): number { return this.liveObject.energy; }
    get energyCapacity(): number { return this.liveObject.energyCapacity; }
}

export function init() {
    if (!StructureSpawn.prototype.remotable) {
        Object.defineProperty(StructureSpawn.prototype, "remotable", {
            get: function () {
                if (this._remotable === undefined) this._remotable = new LocalSpawn(this);
                return this._remotable;
            },
            set: function(remotable: RemotableSpawn) {
                this._remotable = remotable;
            }
        });
    }
}
