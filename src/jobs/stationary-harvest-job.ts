import { Job } from "./job";
import { load as loadRemotable, RemotableSource, REMOTABLE_TYPE_SOURCE, RemotableContainer } from "../remotables/remotable";

enum Phase {
    MOVE,
    HARVEST,
    REPAIR_CONTAINER
}

export class StationaryHarvestJob extends Job {
    private _source: RemotableSource;
    private _container: RemotableContainer | null | undefined = null;

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
        switch (this.phase) {
            case Phase.MOVE:
                if (this.container && this.moveInRangeTo(this.container, 0)) return true;
                else if (!this.container && this.moveInRangeTo(this.source, 1)) return true;
                this.phase = Phase.HARVEST;

            case Phase.HARVEST:
                if (this.container && this.container.plannedHits < this.container.hitsMax && this.creep.carry.energy > 0) {
                    this.phase = Phase.REPAIR_CONTAINER;
                } else {
                    this.creep.harvest(<Source>this.source.liveObject);
                    return true;
                }

            case Phase.REPAIR_CONTAINER:
                if (this.container === undefined || this.container.plannedHits >= this.container.hitsMax || this.creep.carry.energy === 0) {
                    this.phase = Phase.HARVEST;
                    return this.run();
                }
                this.creep.repair(<StructureContainer>this.container.liveObject);
                return true;

            default:
                throw new Error(`Unknown phase ${this.phase} for creep ${this.creep.name}`);
        }
    }

    get source(): RemotableSource {
        if (this._source === undefined) {
            let source = <RemotableSource | undefined>loadRemotable(this.creep.memory.job.source, [REMOTABLE_TYPE_SOURCE]);
            if (source === undefined) throw new Error(`Null remotable source for stationary harvest job ${JSON.stringify(this.creep.memory.job)}`);
            this._source = source;
        }
        return this._source;
    }

    set source(source: RemotableSource) {
        this._source = source;
        this.creep.memory.job.source = source.save();
    }

    get container(): RemotableContainer | undefined {
        if (this._container === null) this._container = this.source.container;
        return this._container;
    }

    get phase(): Phase { return this.creep.memory.job.phase; }
    set phase(phase: Phase) { this.creep.memory.job.phase = phase; }

    update(): void { this.source.covered = true; }

    static load(creep: Creep): StationaryHarvestJob {
        return new StationaryHarvestJob(creep);
    }
}
