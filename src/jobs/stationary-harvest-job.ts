import { Job } from "./job";
import { load as loadRemotable, RemotableSource } from "../remotables/remotable";

enum Phase {
    MOVE,
    HARVEST
}

export class StationaryHarvestJob extends Job {
    private _source: RemotableSource;

    static newJob(creep: Creep, source: RemotableSource): StationaryHarvestJob {
        try {
            creep.memory.job = {};
            let job = new StationaryHarvestJob(creep);
            job.source = source;
            job.phase = Phase.MOVE;
            return job;
        } catch (e) {
            delete creep.memory.job;
            throw e;
        }
    }

    constructor(creep: Creep) {
        super("stationary-harvest", creep);
    }

    run(): boolean {
        switch (this.creep.memory.job.phase) {
            case Phase.MOVE:
                if (this.moveInRangeTo(this.source)) return true;
                this.creep.memory.job.phase = Phase.HARVEST;

            case Phase.HARVEST:
                this.creep.harvest(<Source>this.source.liveObject);
                return true;

            default:
                throw new Error(`Unknown phase ${this.creep.memory.job.phase} for creep ${this.creep.name}`);
        }
    }

    get source(): RemotableSource {
        if (this._source === undefined) {
            // TODO: "type-check" remotables
            let source = <RemotableSource | undefined>loadRemotable(this.creep.memory.job.source);
            if (source === undefined) throw new Error(`Null remotable source for stationary harvest job ${JSON.stringify(this.creep.memory.job)}`);
            this._source = source;
        }
        return this._source;
    }

    set source(source: RemotableSource) {
        this._source = source;
        this.creep.memory.job.source = source.save();
    }

    get phase(): Phase { return this.creep.memory.job.phase; }
    set phase(phase: Phase) { this.creep.memory.job.phase = phase; }

    update(): void { this.source.covered = true; }

    static load(creep: Creep): StationaryHarvestJob {
        return new StationaryHarvestJob(creep);
    }
}
