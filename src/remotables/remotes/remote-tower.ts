import { RemotableTower } from "../remotable";
import { LocalTower } from "../locals/local-tower";
import { RemoteStructure } from "./remote-structure";

// Towers are always visible, so this is just a wrapper for a LocalTower
export class RemoteTower extends RemoteStructure<StructureTower, STRUCTURE_TOWER> implements RemotableTower {
    readonly structureType = STRUCTURE_TOWER;
    readonly type = STRUCTURE_TOWER;
    private _local: LocalTower;

    constructor(flag: Flag) {
        super(flag);
        if (this.room !== undefined) {
            let liveObject = <StructureTower | undefined>_.filter(this.room.find(FIND_STRUCTURES, { filter: (s: Structure) => s.structureType === STRUCTURE_TOWER }))[0];
            if (liveObject !== undefined) this._local = new LocalTower(liveObject);
        }
    }

    get liveObject(): StructureTower { return this._local.liveObject; }

    get energy(): number { return this._local.energy; }
    get energyCapacity(): number { return this._local.energyCapacity; }
    get availableEnergyForPickup(): number { return this._local.availableEnergyForPickup; }
    set availableEnergyForPickup(availableEnergyForPickup: number) { this._local.availableEnergyForPickup = availableEnergyForPickup; }
    get plannedEnergyWithIncoming(): number { return this._local.plannedEnergyWithIncoming; }
    set plannedEnergyWithIncoming(plannedEnergyWithIncoming: number) { this._local.plannedEnergyWithIncoming = plannedEnergyWithIncoming; }
    get hits(): number { return this._local.hits; }
    get hitsMax(): number { return this._local.hitsMax; }
    get plannedHits(): number { return this._local.availableEnergyForPickup; }
    set plannedHits(plannedHits: number) { this._local.plannedHits = plannedHits; }

    shouldRemove(): boolean { return this._local === undefined; }
    update(): void { super.update(); }
    toString(): string { return `[remote ${this._local.toString().slice(1)}`; }
}
