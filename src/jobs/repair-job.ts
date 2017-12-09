import { Job, JobTarget } from "./job";
import { load as loadRemotable, isRemotableSource, RemotableEnergyStore, REMOTABLE_TYPE_SOURCE, RemotableStructure } from "../remotables/remotable";
import { StructureConstantsAll } from "../utils";

enum Phase {
    MOVE_TO_ENERGY,
    LOAD,
    MOVE_TO_TARGET,
    REPAIR
}

export class RepairTarget extends JobTarget<Structure, RemotableStructure> {
    constructor(site: RemotableStructure, public remainingRepairAmount: number) { super(site); }
    save(): any { return { site: this.site.save(), remainingRepairAmount: this.remainingRepairAmount } }
    toString(): string { return `${this.site.toString()} (${this.remainingRepairAmount})` }
}

interface IRepairTargetMemory {
    readonly savedSite: any;
    remainingRepairAmount: number;
}

class RepairTargetMemory implements IRepairTargetMemory {
    constructor(public readonly savedSite: any, public remainingRepairAmount: number) { }
}

// TODO: all energy costs should be updated to take boosts into account
export class RepairJob extends Job {
    private _energyStore: RemotableEnergyStore;
    private _targets: RepairTarget[];
    private _totalRemainingEnergyRequirement: number | undefined;

    static newJob(creep: Creep, energyStore: RemotableEnergyStore, targets: RepairTarget[]): RepairJob {
        try {
            creep.memory.job = {};
            let job = new RepairJob(creep);
            job.energyStore = energyStore;
            job.targets = targets;
            job.phase = Phase.MOVE_TO_ENERGY;
            return job;
        } catch (e) {
            delete creep.memory.job;
            throw e;
        }
    }

    constructor(creep: Creep) {
        super("repair", creep);
    }

    get energyStore(): RemotableEnergyStore {
        if (this._energyStore === undefined) {
            let energyStore = <RemotableEnergyStore | undefined>loadRemotable(this.creep.memory.job.energyStore, [REMOTABLE_TYPE_SOURCE, STRUCTURE_CONTAINER, STRUCTURE_STORAGE]);
            if (energyStore === undefined) throw new Error(`Missing remotable energy store for ${this.name} job ${JSON.stringify(this.creep.memory.job)}`);
            this._energyStore = energyStore;
        }
        return this._energyStore;
    }

    set energyStore(energyStore: RemotableEnergyStore) {
        this._energyStore = energyStore;
        this.creep.memory.job.energyStore = energyStore.save();
    }

    get targets(): RepairTarget[] {
        if (this._targets === undefined) {
            this._targets = [];
            for (let i = 0; i < this.creep.memory.job.targets.length; i++) {
                let target = <IRepairTargetMemory>this.creep.memory.job.targets[i];
                let site = <RemotableStructure | undefined>loadRemotable(target.savedSite, StructureConstantsAll);
                if (site === undefined) throw new Error(`Missing site for ${JSON.stringify(target)}`);
                this._targets.push(new RepairTarget(site, target.remainingRepairAmount));
            }
        }
        return this._targets;
    }

    set targets(targets: RepairTarget[]) {
        this.creep.memory.job.targets = [];
        for (let i = 0; i < targets.length; i++) {
            this.creep.memory.job.targets.push(new RepairTargetMemory(targets[i].actual.site.save(), targets[i].remainingRepairAmount));
        }
        this._targets = targets;
    }

    get phase(): Phase { return this.creep.memory.job.phase; }
    set phase(phase: Phase) { this.creep.memory.job.phase = phase; }

    run(): boolean {
        switch (this.phase) {
            case Phase.MOVE_TO_ENERGY:
                // Check if the source was assigned a stationary harvester since our job was assigned; cancel if so
                if (isRemotableSource(this.energyStore) && this.energyStore.covered) return false;
                if (this.creep.memory.job.needToLoad === undefined) this.creep.memory.job.needToLoad = this.totalRemainingEnergyRequirement > this.creep.carry.energy;
                if (this.creep.memory.job.needToLoad && this.moveInRangeTo(this.energyStore, 1)) return true;
                this.phase = Phase.LOAD;

            case Phase.LOAD:
                if (this.loadEnergy(this.energyStore, this.totalRemainingEnergyRequirement)) return true;
                if (this.targets.length == 0) return false;
                this.phase = Phase.MOVE_TO_TARGET;

            case Phase.MOVE_TO_TARGET:
                if (this.moveInRangeTo(this.targets[0].actual.pos, 3)) return true;
                this.phase = Phase.REPAIR;

            case Phase.REPAIR:
                if (this.targets[0].site.hits < this.targets[0].site.hitsMax && this.creep.repair(<Structure>this.targets[0].actual.site.liveObject) === OK) {
                    this.creep.memory.job.targets[0].remainingRepairAmount -= this.creep.repairPower(this.creep.carry.energy);
                    return true;
                }
                this.phase = Phase.MOVE_TO_TARGET;
                return this.targetFinished();

            default:
                throw new Error(`Unknown phase ${this.phase} for creep ${this.creep.name}`);
        }
    }

    private targetFinished(): boolean {
        this.targets = this.targets.slice(1);
        return this.targets.length !== 0;
    }

    get totalRemainingEnergyRequirement(): number {
        if (this._totalRemainingEnergyRequirement === undefined) {
            this._totalRemainingEnergyRequirement = 0;
            // The game appears to use Math.floor some (perhaps all) of the time, but I will use Math.ceil for safety
            for (let i = 0; i < this.targets.length; i++) this._totalRemainingEnergyRequirement += Math.ceil(this.targets[i].remainingRepairAmount * REPAIR_COST);
        }
        return this._totalRemainingEnergyRequirement;
    }

    update(): void {
        if (this.phase <= Phase.LOAD) this.energyStore.availableEnergyForPickup -= (this.totalRemainingEnergyRequirement - this.creep.carry.energy);
        for (let t of this.targets) {
            if (t.site) {
                t.site.plannedHits += t.remainingRepairAmount;
                if (this.creep.homeRoom && (t.site.structureType === STRUCTURE_WALL || t.site.structureType === STRUCTURE_RAMPART)) this.creep.homeRoom.rampWallUnderRepair = true;
            }
        }
    }

    static load(creep: Creep): RepairJob {
        return new RepairJob(creep);
    }
}
