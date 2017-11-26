import { Remote } from "./remote";

export abstract class RemoteStructure<T extends Structure> extends Remote<T> {
    projectedHits: number;

    private _hits: number;
    private _hitsMax: number;

    get structureType(): StructureConstant {
        return this.flag.structureType;
    }

    get hits(): number {
        if (this._hits === undefined) this._hits = this.flag.memory.lastKnownHits;
        return this._hits;
    }

    update(): void {
        if (this.liveObject != undefined) {
            this.flag.memory.lastKnownHits = this.liveObject.hits;
            this.flag.memory.lastKnownHitsMax = this.liveObject.hitsMax;
        }
        this.projectedHits = this.hits;
    }

    get hitsMax(): number {
        if (this._hitsMax === undefined) this._hitsMax = this.flag.memory.lastKnownHitsMax;
        return this._hitsMax;
    }

    shouldRemove(): boolean {
        return this.room !== undefined && this.liveObject === undefined;
    }
}
