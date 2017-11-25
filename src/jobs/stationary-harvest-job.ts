import { Job } from "./job";
import { RemotableSource } from "../remotes/remotable-source";

enum Phase {
    MOVE,
    HARVEST
}

export class StationaryHarvestJob extends Job {
    private _source: RemotableSource;
    private _phase: Phase;

    constructor(creep: Creep, source: RemotableSource, phase?: Phase) {
        super("stationary-harvest", creep);
        this._source = source;
        this._phase = phase || Phase.MOVE;
    }

    run(): boolean {
        switch (this._phase) {
            case Phase.MOVE:
                if (!this.creep.pos.isNearTo(this._source)) {
                    this.creep.moveTo(this._source);
                    return true;
                }
                this._phase = Phase.HARVEST;
            case Phase.HARVEST:
                this.creep.harvest(<Source>this._source.liveObject);
                return true;
            default:
                throw "Unknown phase " + this._phase + " for creep " + this.creep.name;
        }
    }

    save(): void {
        let whereId: string =
    }

    static recover(creep: Creep): StationaryHarvestJob {
        let whereId: string = creep.memory.job.whereId;
        let where: Flag|Source|null = Game.getObjectById(whereId);
        let remotableSource: RemotableSource;
        if (where == null) throw "Unable to find where (id: " + whereId + ") for staionary harvest job for creep " + creep.name;
        if (where instanceof Flag) remotableSource = <RemotableSource>where.remotable;
        else remotableSource = where;
        return new StationaryHarvestJob(creep, remotableSource, creep.memory.job.phase);
    }
}
