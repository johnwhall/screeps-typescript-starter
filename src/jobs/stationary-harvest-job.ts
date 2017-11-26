import { Job } from "./job";
import { RemotableSource } from "../remotables/remotable";
import { RemoteSource } from "../remotes/remote-source";
import { LocalSource } from "../locals/local-source";

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

    save(): void {
        this.creep.memory.job = {
            name: this.name,
            phase: this._phase,
        };
        if (this.source instanceof RemoteSource) this.creep.memory.job.flag = this.source.flag.name;
        else this.creep.memory.job.source = (<LocalSource>this.source).liveObject.id;
    }

    static load(creep: Creep): StationaryHarvestJob {
        let remotable;
        if (creep.memory.job.flag !== undefined) {
            let flagName = creep.memory.job.flag;
            let flag = Game.flags[flagName];
            if (flag === undefined) throw new Error(`Unable to locate flag ${flagName} for stationary harvest job for creep ${creep.name}`);
            var remote = <RemoteSource>flag.remote;
            remotable = remote;
        } else if (creep.memory.job.source !== undefined) {
            let source = <Source | null>Game.getObjectById(creep.memory.job.source);
            if (!source) throw new Error(`Unable to locate source ${creep.memory.job.source} for stationary harvest job for creep ${creep.name}`);
            var local = source.remotable;
            remotable = local;
        } else {
            throw new Error(`Unable to load stationary harvest job for creep ${creep.name} - source information not found`);
        }

        return new StationaryHarvestJob(creep, remotable, creep.memory.job.phase);
    }
}
