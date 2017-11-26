import { Remote } from "./remote";
import { RemotableStructure } from "../remotables/remotable";

export abstract class RemoteStructure<T extends Structure> extends Remote<T> implements RemotableStructure<T> {
    plannedHits: number;

    private _hits: number;
    private _hitsMax: number;

    get structureType(): StructureConstant {
        return this.flag.structureType;
    }

    get hits(): number {
        if (this._hits === undefined) this._hits = this.flag.memory.lastKnownHits;
        return this._hits;
    }

    get hitsMax(): number {
        if (this._hitsMax === undefined) this._hitsMax = this.flag.memory.lastKnownHitsMax;
        return this._hitsMax;
    }

    update(): void {
        this.update();
        if (this.liveObject !== undefined) {
            this.flag.memory.lastKnownHits = this.liveObject.hits;
            this.flag.memory.lastKnownHitsMax = this.liveObject.hitsMax;
        }
        this.plannedHits = this.hits;
    }

    shouldRemove(): boolean {
        return this.room !== undefined && this.liveObject === undefined;
    }

    toString(): string {
        if (this.liveObject) return `[remote ${this.liveObject.toString().slice(1)}`;
        else return `[invisible ${this.structureType} at ${this.pos}]`;
    }
}
