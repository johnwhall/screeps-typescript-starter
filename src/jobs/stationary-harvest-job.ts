import { Job } from "./job";
import { load as loadRemotable, RemotableSource } from "../remotables/remotable";

enum Phase {
    MOVE,
    HARVEST
}

export class StationaryHarvestJob extends Job {
    readonly source: RemotableSource;
    private _phase: Phase;

    constructor(creep: Creep, source: RemotableSource, phase?: Phase) {
        super("stationary-harvest", creep);
        this.source = source;
        this._phase = phase || Phase.MOVE;
    }

    run(): boolean {
        switch (this._phase) {
            case Phase.MOVE:
                if (!this.creep.pos.isNearTo(this.source)) {
                    this.creep.moveTo(this.source);
                    return true;
                }
                this._phase = Phase.HARVEST;
            case Phase.HARVEST:
                this.creep.harvest(<Source>this.source.liveObject);
                return true;
            default:
                throw new Error(`Unknown phase ${this._phase} for creep ${this.creep.name}`);
        }
    }

    save(): any {
        return {
            name: this.name,
            source: this.source.save(),
            phase: this._phase,
        };
    }

    static load(creep: Creep): StationaryHarvestJob {
        // TODO: "type-check" remotable
        let remotable = <RemotableSource>loadRemotable(creep.memory.job.source);
        return new StationaryHarvestJob(creep, remotable, creep.memory.job.phase);
    }
}
