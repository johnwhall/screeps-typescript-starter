import { Job } from "./job";
import { load as loadRemotable, isRemotableSource, RemotableEnergyStore, RemotableConstructionSite } from "../remotables/remotable";

enum Phase {
    MOVE_TO_ENERGY,
    LOAD,
    MOVE_TO_CONSTRUCTION_SITE,
    BUILD,
    REPAIR
}

// TODO: needed?
interface IBuildJobTarget {
    readonly site: RemotableConstructionSite | undefined;
    myRemainingProgress: number;
    readonly pos: RoomPosition;
}

interface IBuildJobTargetMemory {
    readonly site?: any;
    readonly committedProgress: number;
    readonly pos?: RoomPosition;
}

class BuildJobTargetMemory implements IBuildJobTargetMemory {
    readonly site?: any;
    committedProgress: number;
    readonly pos?: RoomPosition;

    constructor(target: IBuildJobTarget) {
        if (target.site === undefined) this.pos = target.pos;
        else this.site = target.site.save(); // TODO: should still save pos in case we finish construction, so we can retrieve it next tick (when we wouldn't be able to derive it from the non-existent ConstructionSite game object)
        this.committedProgress = target.myRemainingProgress;
    }
}

export class BuildJobTarget implements IBuildJobTarget {
    readonly site: RemotableConstructionSite | undefined;
    readonly pos: RoomPosition;

    constructor(site: RemotableConstructionSite | RoomPosition, public readonly myRemainingProgress: number) {
        if (site instanceof RoomPosition) this.pos = site;
        else [ this.site, this.pos ] = [ site, site.pos ];
    }
}

// TODO: all energy costs should be updated to take boosts into account
export class BuildJob extends Job {
    readonly energyStore: RemotableEnergyStore;
    readonly targets: IBuildJobTarget[];
    private _phase: Phase;

    constructor(creep: Creep, energyStore: RemotableEnergyStore, targets: IBuildJobTarget[], phase?: Phase) {
        super("build", creep);
        this.energyStore = energyStore;
        this.targets = targets;
        this._phase = phase || Phase.MOVE_TO_ENERGY;
        if (phase === undefined) this.update(); // only update when job is being assigned, not when loaded from memory (if updated when loaded from memory, update will happen twice)
    }

    run(): boolean {
        switch (this._phase) {
            case Phase.MOVE_TO_ENERGY:
                // Check if the source was assigned a stationary harvester since our job was assigned; cancel if so
                if (isRemotableSource(this.energyStore) && this.energyStore.covered) return false;
                if (this.moveTo(this.energyStore)) return true; // TODO: don't move to energy store if we already have enough energy
                this._phase = Phase.LOAD;

            case Phase.LOAD:
                if (this.loadEnergy(this.energyStore, _.sum(this.targets, (t) => t.myRemainingProgress))) return true;
                this.selectNextTarget(this.targets);
                this._phase = Phase.MOVE_TO_CONSTRUCTION_SITE;

            case Phase.MOVE_TO_CONSTRUCTION_SITE:
                if (this.moveTo(this.targets[0], 3)) return true;
                this._phase = Phase.BUILD;

            case Phase.BUILD:
                let site = this.targets[0].site; // TODO: make sure target is skipped and job eventually ends if site === undefined
                if (site && this.creep.build(<ConstructionSite>site.liveObject) === OK) {
                    this.targets[0].myRemainingProgress -= 5; // TODO: this should be ... -= max(numWorkParts * BUILD_POWER, carry.energy, target.hitsMax - target.hits) (and adjust for boosts)
                    return true; // TODO: should lower site.committedProgress (and possibly rename it to reflect that it goes down over time)
                }
                this._phase = Phase.REPAIR;

            // TODO: if our original target order is [road, rampart] but selectNextTarget picks [rampart, road], we will use all our energy on the rampart and not build the road
            case Phase.REPAIR: // TODO: if we are building something on top of an already-existing rampart, this will spend energy on repairing the rampart instead of moving on to the next build target
                let repairTarget = (<Structure[]>this.targets[0].pos.lookFor(LOOK_STRUCTURES)).filter((s) => s.structureType == STRUCTURE_RAMPART)[0];
                if (repairTarget === undefined) {
                    this.targets.splice(0, 1);
                    if(this.selectNextTarget(this.targets)) {
                        this._phase = Phase.MOVE_TO_CONSTRUCTION_SITE;
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return this.creep.repair(repairTarget) === OK;
                }

            default:
                throw new Error(`Unknown phase ${this._phase} for creep ${this.creep.name}`);
        }
    }

    update(): void {
        _.forEach(this.targets, (t) => { if (t.site) t.site.plannedProgress += t.myRemainingProgress; });
    }

    // TODO: update memory incrementally in run() instead of all at the end (which requires resaving many targets instead of only the one we modified this tick)
    save(): any {
        return {
            name: this.name,
            energyStore: this.energyStore.save(),
            targets: _.map(this.targets, (t) => new BuildJobTargetMemory(t)),
            phase: this._phase,
        };
    }

    static load(creep: Creep): BuildJob {
        // TODO: "type-check" remotables
        let energyStore = <RemotableEnergyStore>loadRemotable(creep.memory.job.energyStore);
        let targetMemories = <IBuildJobTargetMemory[]>creep.memory.job.targets;
        // TODO: only load targets when we need to (the target we are building/repairing this tick and when we need to select a new target) - LazyLoadBuildJobTarget class?
        let targets = _.map(targetMemories, (tm) => new BuildJobTarget(<RemotableConstructionSite>loadRemotable(tm.site) || tm.pos, tm.committedProgress));
        return new BuildJob(creep, energyStore, targets, creep.memory.job.phase);
    }
}
