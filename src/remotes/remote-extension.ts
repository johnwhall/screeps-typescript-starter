import { RemotableExtension } from "../remotables/remotable";
import { LocalExtension } from "../locals/local-extension";
import { RemoteStructure } from "./remote-structure";

// Extensions are always visible, so this is just a wrapper for a LocalExtension
export class RemoteExtension extends RemoteStructure<StructureExtension, STRUCTURE_EXTENSION> implements RemotableExtension {
    readonly structureType = STRUCTURE_EXTENSION;
    readonly type = STRUCTURE_EXTENSION;
    private _local: LocalExtension;

    constructor(flag: Flag) {
        super(flag);
        if (this.room !== undefined) {
            let liveObject = <StructureExtension | undefined>_.filter(this.room.find(FIND_STRUCTURES, { filter: (s: Structure) => s.structureType === STRUCTURE_EXTENSION }))[0];
            if (liveObject !== undefined) this._local = new LocalExtension(liveObject);
        }
    }

    get liveObject(): StructureExtension { return this._local.liveObject; }

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
