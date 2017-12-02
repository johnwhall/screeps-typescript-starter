import { Job } from "./job";
import { load as loadRemotable, isRemotableSource, RemotableEnergyStore, RemotableController, REMOTABLE_TYPE_SOURCE } from "../remotables/remotable";

enum Phase {
    MOVE_TO_ENERGY,
    LOAD,
    MOVE_TO_CONTROLLER,
    UPGRADE
}

export class UpgradeJob extends Job {
    private _energyStore: RemotableEnergyStore;
    private _controller: RemotableController;

    static newJob(creep: Creep, energyStore: RemotableEnergyStore, controller: RemotableController): UpgradeJob {
        try {
            creep.memory.job = {};
            let job = new UpgradeJob(creep);
            job.energyStore = energyStore;
            job.controller = controller;
            job.phase = Phase.MOVE_TO_ENERGY;
            return job;
        } catch (e) {
            delete creep.memory.job;
            throw e;
        }
    }

    constructor(creep: Creep) {
        super("upgrade", creep);
    }

    get energyStore(): RemotableEnergyStore {
        if (this._energyStore === undefined) {
            let energyStore = <RemotableEnergyStore | undefined>loadRemotable(this.creep.memory.job.energyStore, [REMOTABLE_TYPE_SOURCE, STRUCTURE_CONTAINER, STRUCTURE_STORAGE]);
            if (energyStore === undefined) throw new Error(`Null remotable energy store for upgrade job ${JSON.stringify(this.creep.memory.job)}`);
            this._energyStore = energyStore;
        }
        return this._energyStore;
    }

    set energyStore(energyStore: RemotableEnergyStore) {
        this._energyStore = energyStore;
        this.creep.memory.job.energyStore = energyStore.save();
    }

    get controller(): RemotableController {
        if (this._controller === undefined) {
            let controller = <RemotableController | undefined>loadRemotable(this.creep.memory.job.controller, [STRUCTURE_CONTROLLER]);
            if (controller === undefined) throw new Error(`Null remotable controller for upgrade job ${JSON.stringify(this.creep.memory.job)}`);
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
        switch (this.creep.memory.job.phase) {
            case Phase.MOVE_TO_ENERGY:
                // Check if the source was assigned a stationary harvester since our job was assigned; cancel if so
                if (isRemotableSource(this.energyStore) && this.energyStore.covered) return false;
                if (this.creep.freeCapacity > 0 && this.moveInRangeTo(this.energyStore)) return true;
                this.creep.memory.job.phase = Phase.LOAD;

            case Phase.LOAD:
                if (this.loadEnergy(this.energyStore)) return true;
                this.creep.memory.job.phase = Phase.MOVE_TO_CONTROLLER;

            case Phase.MOVE_TO_CONTROLLER:
                if (this.moveInRangeTo(this.controller, 3)) return true;
                this.creep.memory.job.phase = Phase.UPGRADE;

            case Phase.UPGRADE:
                this.creep.upgradeController(<StructureController>this.controller.liveObject);
                return this.creep.carry.energy !== 0;

            default:
                throw new Error(`Unknown phase ${this.creep.memory.job.phase} for creep ${this.creep.name}`);
        }
    }

    update(): void {
        if (this.phase <= Phase.LOAD) this.energyStore.plannedEnergy -= this.creep.freeCapacity;
    }

    static load(creep: Creep): UpgradeJob { return new UpgradeJob(creep); }
}
