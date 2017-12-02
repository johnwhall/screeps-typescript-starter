import { Remote } from "./remote";
import { RemotableStructure, RemotableType } from "../remotables/remotable";

export abstract class RemoteStructure<S extends Structure, T extends StructureConstant> extends Remote<S> implements RemotableStructure<S, T> {
    abstract readonly type: RemotableType;
    abstract readonly structureType: T;
    plannedHits: number;

    private _hits: number;
    private _hitsMax: number;

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
