import { Remote } from "./remote";
import { RemotableSource, REMOTABLE_TYPE_SOURCE, RemotableContainer } from "../remotables/remotable";

export class RemoteSource extends Remote<Source> implements RemotableSource {
    readonly type = REMOTABLE_TYPE_SOURCE;
    covered: boolean = false;
    availableEnergyForPickup: number;
    plannedEnergyWithIncoming: number = this.energyCapacity;
    private _liveObject: Source;
    private _energy: number;
    private _energyCapacity: number;
    private _container: RemotableContainer | undefined;

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

    get container(): RemotableContainer | undefined { // TODO: consider storing in memory
        if (this._container === undefined && this.assignedRoom !== undefined) {
            for (let container of this.assignedRoom.assignedContainers) {
                if (this.pos.inRangeTo(container, 1)) {
                    this._container = container;
                    break;
                }
            }
        }
        return this._container;
    }

    set container(container: RemotableContainer | undefined) { this._container = container; }

    update(): void {
        super.update();
        if (this.liveObject !== undefined) {
            this.flag.memory.lastKnownEnergy = this.liveObject.energy;
            this.flag.memory.lastKnownEnergyCapacity = this.liveObject.energyCapacity;
        }
        this.availableEnergyForPickup = this.energy;
    }

    shouldRemove(): boolean { return false; }

    toString(): string {
        if (this.liveObject) return `[remote ${this.liveObject.toString().slice(1)}`;
        else return `[invisible source at ${this.pos}]`;
    }
}
