import { Job } from "./job";
import { load as loadRemotable, RemotableController } from "../remotables/remotable";

enum Phase {
    MOVE_TO_CONTROLLER,
    RESERVE
}

export class ReserveJob extends Job {
    private _controller: RemotableController;

    static newJob(creep: Creep, controller: RemotableController): ReserveJob {
        try {
            creep.memory.job = {};
            let job = new ReserveJob(creep);
            job.controller = controller;
            job.phase = Phase.MOVE_TO_CONTROLLER;
            return job;
        } catch (e) {
            delete creep.memory.job;
            throw e;
        }
    }

    constructor(creep: Creep) {
        super("reserve", creep);
    }

    get controller(): RemotableController {
        if (this._controller === undefined) {
            let controller = <RemotableController | undefined>loadRemotable(this.creep.memory.job.controller, [STRUCTURE_CONTROLLER]);
            if (controller === undefined) throw new Error(`Null remotable controller for ${this.name} job ${JSON.stringify(this.creep.memory.job)}`);
            this._controller = controller;
        }
        return this._controller;
    }

    set controller(controller: RemotableController) {
        this._controller = controller;
        this.creep.memory.job.controller = controller.save();
    }

    get phase(): Phase { return this.creep.memory.job.phase; }
    set phase(phase: Phase) { this.creep.memory.job.phase = phase; }

    run(): boolean {
        switch (this.phase) {
            case Phase.MOVE_TO_CONTROLLER:
                if (this.moveInRangeTo(this.controller, 1)) return true;
                this.creep.memory.job.phase = Phase.RESERVE;

            case Phase.RESERVE:
                this.creep.reserveController(<StructureController>this.controller.liveObject);
                return true;

            default:
                throw new Error(`Unknown phase ${this.phase} for creep ${this.creep.name}`);
        }
    }

    update(): void { this.controller.claimPlanned = true; }
    static load(creep: Creep): ReserveJob { return new ReserveJob(creep); }
}
