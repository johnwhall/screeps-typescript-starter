import { Remote } from "./remote";
import { RemotableConstructionSite, REMOTABLE_TYPE_CONSTRUCTION_SITE } from "../remotables/remotable";
import { LocalConstructionSite } from "../locals/local-construction-site";

// Construction sites are always visible, so this is just a wrapper for a LocalConstructionSite
export class RemoteConstructionSite extends Remote<ConstructionSite> implements RemotableConstructionSite {
    readonly type = REMOTABLE_TYPE_CONSTRUCTION_SITE;
    private _local: LocalConstructionSite;

    constructor(flag: Flag) {
        super(flag);
        let liveObject = _.filter(Game.constructionSites, (cs) => cs.pos.isEqualTo(this.pos))[0];
        if (liveObject !== undefined) this._local = new LocalConstructionSite(liveObject);
    }

    get liveObject(): ConstructionSite { return this._local.liveObject; }
    get progress(): number { return this._local.progress; }
    get progressTotal(): number { return this._local.progressTotal; }
    get plannedProgress(): number { return this._local.plannedProgress; }
    set plannedProgress(plannedProgress: number) { this._local.plannedProgress = plannedProgress; }
    get structureType(): StructureConstant { return this._local.structureType; }
    shouldRemove(): boolean { return this._local === undefined; }
    update(): void { super.update(); }
    toString(): string { return `[remote ${this._local.toString().slice(1)}`; }
}
