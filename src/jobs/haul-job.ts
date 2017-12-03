import { Job, JobTarget } from "./job";
import { load as loadRemotable, isRemotableSource, RemotableEnergyStore, REMOTABLE_TYPE_SOURCE, RemotableContainer, RemotableStorage, RemotableSpawn, RemotableExtension } from "../remotables/remotable";

enum Phase {
    MOVE_TO_ENERGY,
    LOAD,
    MOVE_TO_TARGET,
    UNLOAD
}

export class HaulTarget extends JobTarget<StructureContainer | StructureStorage | StructureSpawn | StructureExtension, RemotableContainer | RemotableStorage | RemotableSpawn | RemotableExtension> {
    constructor(site: RemotableContainer | RemotableStorage | RemotableSpawn | RemotableExtension, public remainingTransferAmount: number) { super(site); }
    save(): any { return { site: this.site.save(), remainingTransferAmount: this.remainingTransferAmount } }
    toString(): string { return `${this.site.toString()} (${this.remainingTransferAmount})` }
}

interface IHaulTargetMemory {
    readonly savedSite: any;
    readonly remainingTransferAmount: number;
}

class HaulTargetMemory implements IHaulTargetMemory {
    constructor(public readonly savedSite: any, public readonly remainingTransferAmount: number) { }
}

export class HaulJob extends Job {
    private _energyStore: RemotableEnergyStore;
    private _targets: HaulTarget[];
    private _totalRemainingTransferAmount: number;

    static newJob(creep: Creep, energyStore: RemotableEnergyStore, targets: HaulTarget[]): HaulJob {
        try {
            creep.memory.job = {};
            let job = new HaulJob(creep);
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
        super("haul", creep);
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

    get targets(): HaulTarget[] {
        if (this._targets === undefined) {
            this._targets = [];
            for (let i = 0; i < this.creep.memory.job.targets.length; i++) {
                let target = <IHaulTargetMemory>this.creep.memory.job.targets[i];
                let site = <RemotableContainer | RemotableStorage | RemotableSpawn | RemotableExtension | undefined>loadRemotable(target.savedSite, [STRUCTURE_CONTAINER, STRUCTURE_STORAGE, STRUCTURE_SPAWN, STRUCTURE_EXTENSION]);
                if (site === undefined) throw new Error(`Missing site for ${JSON.stringify(target)}`);
                this._targets.push(new HaulTarget(site, target.remainingTransferAmount));
            }
        }
        return this._targets;
    }

    set targets(targets: HaulTarget[]) {
        this.creep.memory.job.targets = [];
        for (let i = 0; i < targets.length; i++) {
            this.creep.memory.job.targets.push(new HaulTargetMemory(targets[i].actual.site.save(), targets[i].remainingTransferAmount));
        }
        this._targets = targets;
    }

    get phase(): Phase { return this.creep.memory.job.phase; }
    set phase(phase: Phase) { this.creep.memory.job.phase = phase; }

    run(): boolean {
        switch (this.creep.memory.job.phase) {
            case Phase.MOVE_TO_ENERGY:
                // Check if the source was assigned a stationary harvester since our job was assigned; cancel if so
                if (isRemotableSource(this.energyStore) && this.energyStore.covered) return false;
                if (this.creep.memory.job.needToLoad === undefined) this.creep.memory.job.needToLoad = this.totalRemainingEnergyRequirement > this.creep.carry.energy;
                if (this.creep.memory.job.needToLoad && this.moveInRangeTo(this.energyStore, 1)) return true;
                this.creep.memory.job.phase = Phase.LOAD;

            case Phase.LOAD:
                if (this.loadEnergy(this.energyStore, this.totalRemainingEnergyRequirement)) return true;
                this.targets = this.selectNextTarget(this.targets);
                if (this.targets.length == 0) return false;
                this.creep.memory.job.phase = Phase.MOVE_TO_TARGET;

            case Phase.MOVE_TO_TARGET:
                if (this.creep.carry.energy === 0) return false;
                if (this.moveInRangeTo(this.targets[0].actual.pos, 1)) return true;
                this.creep.memory.job.phase = Phase.UNLOAD;

            case Phase.UNLOAD:
                let target = this.targets[0];
                if (target.site.liveObject === undefined) throw new Error(`Missing site liveObject for target ${target}`);
                this.creep.transfer(target.site.liveObject, RESOURCE_ENERGY, Math.min(target.site.energyCapacity - target.site.energy, this.creep.carry.energy, target.remainingTransferAmount));
                this.phase = Phase.MOVE_TO_TARGET;
                if(this.targetFinished()) return this.run();
                else return false;

            default:
                throw new Error(`Unknown phase ${this.creep.memory.job.phase} for creep ${this.creep.name}`);
        }
    }

    private targetFinished(): boolean {
        this.targets = this.selectNextTarget(this.targets.slice(1));
        return this.targets.length !== 0;
    }

    get totalRemainingTransferAmount(): number {
        if (this._totalRemainingTransferAmount === undefined) {
            let trta = 0;
            for (let i = 0; i < this.targets.length; i++) trta += this.targets[i].remainingTransferAmount;
            return trta;
        }
        return this._totalRemainingTransferAmount;
    }

    get totalRemainingEnergyRequirement(): number {
        if (this.phase > Phase.LOAD) return 0;
        return this.totalRemainingTransferAmount;
    }

    update(): void {
        if (this.phase <= Phase.LOAD) this.energyStore.plannedEnergy -= (this.totalRemainingEnergyRequirement - this.creep.carry.energy);
        // TODO: update plannedEnergy (and maybe separate plannedEnergy into incoming and outgoing)
    }

    static load(creep: Creep): HaulJob {
        return new HaulJob(creep);
    }
}
