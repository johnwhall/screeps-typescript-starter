import { Remote } from "./remote";

export class RemoteConstructionSite extends Remote<ConstructionSite> {
    private _liveObject: ConstructionSite;

    get progress(): number {
        return this.flag.memory._lastKnownProgress;
    }

    get progressTotal(): number {
        return CONSTRUCTION_COST[this.flag.structureType];
    }

    get structureType(): StructureConstant {
        return this.flag.structureType;
    }

    get liveObject(): ConstructionSite|undefined {
        if (this.room == undefined) return undefined;
        else return this._liveObject = <ConstructionSite>this.pos.lookFor(LOOK_CONSTRUCTION_SITES)[0];
    }

    update(): void {
        if (this.liveObject == undefined) return;
        this.flag.memory._lastKnownProgress = this.liveObject.progress;
    }

    shouldRemove(): boolean {
        // TODO: possibly move this implementation to a base class?
        // This seems valid for all static remotes (e.g. structures), but not for moveable ones (e.g. creeps).
        return this.room !== undefined && this.liveObject === undefined;
    }

    toString(): string {
        if (this.liveObject) return this.liveObject.toString();
        else return `[invisible ${this.structureType} construction site at ${this.pos}]`;
    }
}
