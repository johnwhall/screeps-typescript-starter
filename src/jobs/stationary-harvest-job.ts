import { Job } from "./job";
import { RemoteSource } from "../remotes/remote-source";
import { FlagType } from "../flags/flag";

enum Phase {
    MOVE,
    HARVEST
}

export class StationaryHarvestJob extends Job {
    private _source: RemoteSource;
    private _phase: Phase;

    constructor(creep: Creep, source: RemoteSource, phase?: Phase) {
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
        this.creep.memory.job = {
            name: this.name,
            flag: this._source.flag.name,
            phase: this._phase,
        };
    }

    static load(creep: Creep): StationaryHarvestJob {
        let flagName: string = creep.memory.job.flag;
        let flag: Flag|undefined = Game.flags[flagName];
        if (flag === undefined) throw `Unable to locate flag ${flagName} for stationary harvest job for creep ${creep.name}`;
        if (flag.type != FlagType.FLAG_SOURCE) throw `Incorrect flag type ${flag.type} for flag ${flagName} for stationary harvest job for creep ${creep.name}`;
        return new StationaryHarvestJob(creep, <RemoteSource>flag.remote, creep.memory.job.phase);
    }
}
