import { Local } from "./local";
import { RemotableSource, REMOTABLE_TYPE_SOURCE, RemotableContainer } from "../remotable";

export class LocalSource extends Local<Source> implements RemotableSource {
    readonly type = REMOTABLE_TYPE_SOURCE;
    covered: boolean = false;
    availableEnergyForPickup: number;
    plannedEnergyWithIncoming: number;
    private _container: RemotableContainer | undefined;

    constructor(liveObject: Source) {
        super(liveObject);
        this.availableEnergyForPickup = this.liveObject.energy;
        this.plannedEnergyWithIncoming = this.availableEnergyForPickup;
    }

    get energy(): number { return this.liveObject.energy; }
    get energyCapacity(): number { return this.liveObject.energyCapacity; }

    get container(): RemotableContainer | undefined { // TODO: consider storing in memory
        if (this._container === undefined) {
            for (let container of this.liveObject.room.assignedContainers) {
                if (this.pos.inRangeTo(container, 1)) {
                    this._container = container;
                    break;
                }
            }
        }
        return this._container;
    }

    set container(container: RemotableContainer | undefined) { this._container = container; }
}

export function init() {
    if (!Source.prototype.remotable) {
        Object.defineProperty(Source.prototype, "remotable", {
            get: function () {
                if (this._remotable === undefined) this._remotable = new LocalSource(this);
                return this._remotable;
            },
            set: function(remotable: RemotableSource) {
                this._remotable = remotable;
            }
        });
    }
}
