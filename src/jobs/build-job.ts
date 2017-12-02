import { Job, JobTarget, PossibleJobTarget } from "./job";
import { load as loadRemotable, isRemotableSource, RemotableEnergyStore, RemotableConstructionSite, REMOTABLE_TYPE_SOURCE, REMOTABLE_TYPE_CONSTRUCTION_SITE } from "../remotables/remotable";

enum Phase {
    MOVE_TO_ENERGY,
    LOAD,
    MOVE_TO_CONSTRUCTION_SITE,
    BUILD
}

export class BuildTarget extends JobTarget<ConstructionSite, RemotableConstructionSite> {
    constructor(site: RemotableConstructionSite, public myRemainingProgress: number) { super(site); }
    save(): any { return { site: this.site.save(), myRemainingProgress: this.myRemainingProgress } }
    toString(): string { return `${this.site.toString()} (${this.myRemainingProgress})` }
}

class PossibleBuildTarget extends PossibleJobTarget<ConstructionSite, RemotableConstructionSite> {
    constructor(site: RemotableConstructionSite | undefined, public myRemainingProgress: number) {
        super(site, (site: RemotableConstructionSite) => new BuildTarget(site, myRemainingProgress));
    }
    get pos(): RoomPosition | undefined { return this.site === undefined ? undefined : this.site.pos; }
}

interface IBuildTargetMemory {
    readonly savedSite: any;
    readonly myRemainingProgress: number;
}

class BuildTargetMemory implements IBuildTargetMemory {
    constructor(public readonly savedSite: any, public readonly myRemainingProgress: number) { }
}

// TODO: all energy costs should be updated to take boosts into account
export class BuildJob extends Job {
    private _energyStore: RemotableEnergyStore;
    private _targets: PossibleBuildTarget[];
    private _totalRemainingProgress: number;

    static newJob(creep: Creep, energyStore: RemotableEnergyStore, targets: BuildTarget[]): BuildJob {
        try {
            creep.memory.job = {};
            let job = new BuildJob(creep);
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
        super("build", creep);
    }

    get energyStore(): RemotableEnergyStore {
        if (this._energyStore === undefined) {
            let energyStore = <RemotableEnergyStore | undefined>loadRemotable(this.creep.memory.job.energyStore, [REMOTABLE_TYPE_SOURCE, STRUCTURE_CONTAINER, STRUCTURE_STORAGE]);
            if (energyStore === undefined) throw new Error(`Missing remotable energy store for upgrade job ${JSON.stringify(this.creep.memory.job)}`);
            this._energyStore = energyStore;
        }
        return this._energyStore;
    }

    set energyStore(energyStore: RemotableEnergyStore) {
        this._energyStore = energyStore;
        this.creep.memory.job.energyStore = energyStore.save();
    }

    get targets(): PossibleBuildTarget[] {
        if (this._targets === undefined) {
            this._targets = [];
            for (let i = 0; i < this.creep.memory.job.targets.length; i++) {
                let target = <IBuildTargetMemory>this.creep.memory.job.targets[i];
                let site = <RemotableConstructionSite | undefined>loadRemotable(target.savedSite, [REMOTABLE_TYPE_CONSTRUCTION_SITE]);
                this._targets.push(new PossibleBuildTarget(site, target.myRemainingProgress));
            }
        }
        return this._targets;
    }

    set targets(targets: PossibleBuildTarget[]) {
        this.creep.memory.job.targets = [];
        for (let i = 0; i < targets.length; i++) {
            this.creep.memory.job.targets.push(new BuildTargetMemory(targets[i].actual.site.save(), targets[i].myRemainingProgress));
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
                if (this.totalRemainingEnergyRequirement > this.creep.carry.energy && this.moveInRangeTo(this.energyStore)) return true; // TODO: cache whether or not we need to move to the energy store since this will not change in transit
                this.creep.memory.job.phase = Phase.LOAD;

            case Phase.LOAD:
                if (this.loadEnergy(this.energyStore, _.sum(this.targets, (t) => t.myRemainingProgress))) return true;
                this.targets = this.selectNextTarget(this.removeFinishedTargets(this.targets));
                if (this.targets.length == 0) return false;
                this.creep.memory.job.phase = Phase.MOVE_TO_CONSTRUCTION_SITE;

            case Phase.MOVE_TO_CONSTRUCTION_SITE:
                if (this.targets[0].pos === undefined && !this.targetFinished()) return false; // construction site was built already and a new target was not found
                if (this.moveInRangeTo(this.targets[0].actual.pos, 3)) return true;
                this.creep.memory.job.phase = Phase.BUILD;

            case Phase.BUILD:
                if (this.targets[0].pos === undefined) {
                    // construction site was built already
                    this.creep.memory.job.phase = Phase.MOVE_TO_CONSTRUCTION_SITE;
                    return this.targetFinished();
                }

                if (this.creep.build(<ConstructionSite>this.targets[0].actual.site.liveObject) === OK) {
                    this.creep.memory.job.targets[0].myRemainingProgress -= this.creep.buildPower(this.creep.carry.energy); // TODO: what if we aren't supposed to use all our energy on this target?
                    return true;
                }
                return false;

            default:
                throw new Error(`Unknown phase ${this.creep.memory.job.phase} for creep ${this.creep.name}`);
        }
    }

    private targetFinished(): boolean {
        this.targets = this.selectNextTarget(this.removeFinishedTargets(this.targets.slice(1)));
        return this.targets.length !== 0;
    }

    get totalRemainingProgress(): number {
        if (this._totalRemainingProgress === undefined) {
            let trp = 0;
            for (let i = 0; i < this.targets.length; i++) trp += this.targets[i].myRemainingProgress;
            return trp;
        }
        return this._totalRemainingProgress;
    }

    get totalRemainingEnergyRequirement(): number {
        if (this.phase > Phase.LOAD) return 0;
        return this.totalRemainingProgress / BUILD_POWER;
    }

    private removeFinishedTargets(targets: PossibleBuildTarget[]): BuildTarget[] {
        let realTargets: BuildTarget[] = [];
        for (let i = 0; i < targets.length; i++) {
            if (targets[i].site !== undefined) realTargets.push(<BuildTarget>targets[i].actual);
        }
        return realTargets;
    }

    update(): void {
        if (this.phase <= Phase.LOAD) this.energyStore.plannedEnergy -= this.totalRemainingProgress;
        _.forEach(this.targets, (t) => { if (t.site) t.site.plannedProgress += t.myRemainingProgress; });
    }

    static load(creep: Creep): BuildJob {
        return new BuildJob(creep);
    }
}
