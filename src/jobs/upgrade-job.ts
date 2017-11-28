import { Job } from "./job";
import { load as loadRemotable, isRemotableSource, RemotableEnergyStore, RemotableController } from "../remotables/remotable";

enum Phase {
    MOVE_TO_ENERGY,
    LOAD,
    MOVE_TO_CONTROLLER,
    UPGRADE
}

export class UpgradeJob extends Job {
    readonly energyStore: RemotableEnergyStore;
    readonly controller: RemotableController;
    private _phase: Phase;

    constructor(creep: Creep, energyStore: RemotableEnergyStore, controller: RemotableController, phase?: Phase) {
        super("upgrade", creep);
        this.energyStore = energyStore;
        this.controller = controller;
        this._phase = phase || Phase.MOVE_TO_ENERGY;
        if (phase === undefined) this.update(); // only update when job is being assigned, not when loaded from memory (if updated when loaded from memory, update will happen twice)
    }

    run(): boolean {
        switch (this._phase) {
            case Phase.MOVE_TO_ENERGY:
                // Check if the source was assigned a stationary harvester since our job was assigned; cancel if so
                if (isRemotableSource(this.energyStore) && this.energyStore.covered) return false;
                if (this.creep.freeCapacity > 0 && this.moveTo(this.energyStore)) return true;
                this._phase = Phase.LOAD;

            case Phase.LOAD:
                if (this.loadEnergy(this.energyStore)) return true;
                this._phase = Phase.MOVE_TO_CONTROLLER;

            case Phase.MOVE_TO_CONTROLLER:
                if (this.moveTo(this.controller, 3)) return true;
                this._phase = Phase.UPGRADE;

            case Phase.UPGRADE:
                this.creep.upgradeController(<StructureController>this.controller.liveObject);
                return this.creep.carry.energy !== 0;

            default:
                throw new Error(`Unknown phase ${this._phase} for creep ${this.creep.name}`);
        }
    }

    update(): void { this.energyStore.plannedEnergy -= this.creep.freeCapacity; }

    save(): any {
        return {
            name: this.name,
            energyStore: this.energyStore.save(),
            controller: this.controller.save(),
            phase: this._phase,
        };
    }

    static load(creep: Creep): UpgradeJob {
        // TODO: "type-check" remotables
        let energyStore = <RemotableEnergyStore>loadRemotable(creep.memory.job.energyStore);
        let controller = <RemotableController>loadRemotable(creep.memory.job.controller);
        return new UpgradeJob(creep, energyStore, controller, creep.memory.job.phase);
    }
}
