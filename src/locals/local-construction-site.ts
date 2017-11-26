import { Local } from "./local";
import { RemotableConstructionSite } from "../remotables/remotable";

export class LocalConstructionSite extends Local<ConstructionSite> implements RemotableConstructionSite {
    plannedProgress: number;

    constructor(liveObject: ConstructionSite) {
        super(liveObject);
        this.plannedProgress = this.liveObject.progress;
    }

    get progress(): number { return this.liveObject.progress; }
    get progressTotal(): number { return this.liveObject.progressTotal; }
    get structureType(): StructureConstant { return this.liveObject.structureType; }
}

export function init() {
    if (!ConstructionSite.prototype.remotable) {
        Object.defineProperty(ConstructionSite.prototype, "remotable", {
            get: function () {
                if (this._remotable === undefined) this._remotable = new LocalConstructionSite(this);
                return this._remotable;
            },
            set: function(remotable: RemotableConstructionSite) {
                this._remotable = remotable;
            }
        });
    }
}
