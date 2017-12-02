import { Local } from "./local";
import { RemotableConstructionSite, REMOTABLE_TYPE_CONSTRUCTION_SITE } from "../remotables/remotable";

export class LocalConstructionSite extends Local<ConstructionSite> implements RemotableConstructionSite {
    readonly type = REMOTABLE_TYPE_CONSTRUCTION_SITE;
    private _plannedProgress: number;

    constructor(liveObject: ConstructionSite) {
        super(liveObject);
        this._plannedProgress = this.liveObject.progress;
    }

    get progress(): number { return this.liveObject.progress; }
    get progressTotal(): number { return this.liveObject.progressTotal; }
    get structureType(): StructureConstant { return this.liveObject.structureType; }
    get plannedProgress(): number { return this._plannedProgress; }
    set plannedProgress(plannedProgress: number) { this._plannedProgress = Math.min(plannedProgress, this.progressTotal) };
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
