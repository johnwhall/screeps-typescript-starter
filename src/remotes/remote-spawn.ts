import { RemotableSpawn } from "../remotables/remotable";
import { LocalSpawn } from "../locals/local-spawn";
import { RemoteStructure } from "./remote-structure";

// Spawns are always visible, so this is just a wrapper for a LocalSpawn
export class RemoteSpawn extends RemoteStructure<StructureSpawn, STRUCTURE_SPAWN> implements RemotableSpawn {
    readonly structureType = STRUCTURE_SPAWN;
    readonly type = STRUCTURE_SPAWN;
    private _local: LocalSpawn;

    constructor(flag: Flag) {
        super(flag);
        let liveObject = _.filter(Game.spawns, (s) => s.pos.isEqualTo(this.pos))[0];
        if (liveObject !== undefined) this._local = new LocalSpawn(liveObject);
    }

    get liveObject(): StructureSpawn { return this._local.liveObject; }

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
