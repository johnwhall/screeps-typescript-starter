import { LocalStructure } from "./local-structure";
import { RemotableTower } from "../remotables/remotable";

export class LocalTower extends LocalStructure<StructureTower, STRUCTURE_TOWER> implements RemotableTower {
    readonly type = STRUCTURE_TOWER;
    availableEnergyForPickup: number;
    plannedEnergyWithIncoming: number;

    constructor(liveObject: StructureTower) {
        super(liveObject);
        this.availableEnergyForPickup = this.energy;
        this.plannedEnergyWithIncoming = this.energy;
    }

    get energy(): number { return this.liveObject.energy; }
    get energyCapacity(): number { return this.liveObject.energyCapacity; }
}

export function init() {
    if (!StructureTower.prototype.remotable) {
        Object.defineProperty(StructureTower.prototype, "remotable", {
            get: function () {
                if (this._remotable === undefined) this._remotable = new LocalTower(this);
                return this._remotable;
            },
            set: function(remotable: RemotableTower) {
                this._remotable = remotable;
            }
        });
    }
}
