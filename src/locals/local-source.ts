import { Local } from "./local";
import { RemotableSource, REMOTABLE_TYPE_SOURCE } from "../remotables/remotable";

export class LocalSource extends Local<Source> implements RemotableSource {
    readonly type = REMOTABLE_TYPE_SOURCE;
    covered: boolean = false;
    plannedEnergy: number;

    constructor(liveObject: Source) {
        super(liveObject);
        this.plannedEnergy = this.liveObject.energy;
    }

    get energy(): number { return this.liveObject.energy; }
    get energyCapacity(): number { return this.liveObject.energyCapacity; }
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
