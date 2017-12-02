import { Remote } from "./remote";
import { RemotableSource, REMOTABLE_TYPE_SOURCE } from "../remotables/remotable";

export class RemoteSource extends Remote<Source> implements RemotableSource {
    readonly type = REMOTABLE_TYPE_SOURCE;
    covered: boolean = false;
    plannedEnergy: number;
    private _liveObject: Source;
    private _energy: number;
    private _energyCapacity: number;

    get liveObject() : Source|undefined {
        if (this.room == undefined) return undefined;
        else return this._liveObject = <Source>this.pos.lookFor(LOOK_SOURCES)[0];
    }

    get energy(): number {
        if (this._energy === undefined) this._energy = this.flag.memory.lastKnownEnergy;
        return this._energy;
    }

    get energyCapacity(): number {
        if (this._energyCapacity === undefined) this._energyCapacity = this.flag.memory.lastKnownEnergyCapacity;
        return this._energyCapacity;
    }

    update(): void {
        super.update();
        if (this.liveObject !== undefined) {
            this.flag.memory.lastKnownEnergy = this.liveObject.energy;
            this.flag.memory.lastKnownEnergyCapacity = this.liveObject.energyCapacity;
        }
        this.plannedEnergy = this.energy;
    }

    shouldRemove(): boolean { return false; }

    toString(): string {
        if (this.liveObject) return `[remote ${this.liveObject.toString().slice(1)}`;
        else return `[invisible source at ${this.pos}]`;
    }
}
