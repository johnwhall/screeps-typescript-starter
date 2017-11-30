import { Job } from "./job";
import { load as loadRemotable, isRemotableSource, RemotableEnergyStore, RemotableConstructionSite } from "../remotables/remotable";

enum Phase {
    MOVE_TO_ENERGY,
    LOAD,
    MOVE_TO_CONSTRUCTION_SITE,
    BUILD
}

export class BuildTarget {
    constructor(public readonly site: RemotableConstructionSite, public myRemainingProgress: number) { }
    get pos(): RoomPosition { return this.site.pos; }
    get actual(): BuildTarget { return this; }
    get alreadyFinished(): boolean { return false; }
    save(): any { return { site: this.site.save(), myRemainingProgress: this.myRemainingProgress } }
    toString(): string { return `${this.site.toString()} (${this.myRemainingProgress})` }
}

class PossibleBuildTarget {
    private _target?: BuildTarget;
    constructor(public readonly site: RemotableConstructionSite | undefined, public myRemainingProgress: number) { }
    get pos(): RoomPosition | undefined { return this.site === undefined ? undefined : this.site.pos; }
    get alreadyFinished(): boolean { return this.pos === undefined; }

    get actual(): BuildTarget {
        if (this._target === undefined) {
            if (this.site === undefined) throw new Error('Attempting to dereference missing PossibleTarget');
            this._target = new BuildTarget(this.site, this.myRemainingProgress);
        }
        return this._target;
    }
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
    private _targets: PossibleBuildTarget[]; // TODO: but I need to load them every time for update()

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
            // TODO: "type-check" remotables
            let energyStore = <RemotableEnergyStore | undefined>loadRemotable(this.creep.memory.job.energyStore);
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
            // TODO: "type-check" remotables
            this._targets = [];
            for (let i = 0; i < this.creep.memory.job.targets.length; i++) {
                let target = <IBuildTargetMemory>this.creep.memory.job.targets[i];
                let site = <RemotableConstructionSite | undefined>loadRemotable(target.savedSite);
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
                if (this.moveInRangeTo(this.energyStore)) return true; // TODO: don't move to energy store if we already have enough energy
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
                    this.creep.memory.job.targets[0].myRemainingProgress -= 5; // TODO: this should be ... -= max(numWorkParts * BUILD_POWER, carry.energy, target.hitsMax - target.hits) (and adjust for boosts)
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
        let trp = 0;
        for (let i = 0; i < this.targets.length; i++) trp += this.targets[i].myRemainingProgress;
        return trp;
    }

    update(): void {
        if (this.phase <= Phase.LOAD) this.energyStore.plannedEnergy -= this.totalRemainingProgress;
        _.forEach(this.targets, (t) => { if (t.site) t.site.plannedProgress += t.myRemainingProgress; });
    }

    private removeFinishedTargets(targets: PossibleBuildTarget[]): BuildTarget[] {
        let realTargets: BuildTarget[] = [];
        for (let i = 0; i < targets.length; i++) {
            if (targets[i].site !== undefined) realTargets.push(<BuildTarget>targets[i]);
        }
        return realTargets;
    }

    static load(creep: Creep): BuildJob {
        return new BuildJob(creep);
    }
}
