import { Remotable, RemotableEnergyStore } from "../remotables/remotable";
import { swapIndices } from "../utils";

export class JobTarget<K extends RoomObject, T extends Remotable<K>> {
    constructor(public readonly site: T) { }
    get pos(): RoomPosition { return this.site.pos; }
    get actual(): JobTarget<K, T> { return this; }
    public actualFactory(_site: T): JobTarget<K, T> { return this; }
}

export class PossibleJobTarget<K extends RoomObject, T extends Remotable<K>> {
    private _target?: JobTarget<K, T>;
    constructor(public readonly site: T | undefined, public readonly actualFactory: (site: T) => JobTarget<K, T>) { }
    get pos(): RoomPosition | undefined { return this.site === undefined ? undefined : this.site.pos; }

    get actual(): JobTarget<K, T> {
        if (this._target === undefined) {
            if (this.site === undefined) throw new Error('Attempting to dereference missing PossibleJobTarget');
            this._target = this.actualFactory(this.site);
        }
        return this._target;
    }
}

export abstract class Job {
    readonly creep: Creep;
    abstract run(): boolean; // true if job should continue on next tick
    abstract update(): void;

    constructor(name: string, creep: Creep) {
        this.creep = creep;
        creep.memory.job.name = name;
    }

    get name(): string { return this.creep.memory.job.name; }

    protected moveInRangeTo(pos: RoomPosition | { pos: RoomPosition }, range: number = 1) {
        if (this.creep.pos.inRangeTo(pos, range)) return false;
        this.creep.moveTo(pos);
        return true;
    }

    protected loadEnergy(energyStore: RemotableEnergyStore, targetAmount: number = this.creep.freeCapacity + this.creep.carry.energy) {
        if (this.creep.carry.energy >= targetAmount) return false;
        // TODO: consider lookFor or similar instead of findInRange (for performance reasons)
        let droppedEnergy = <Resource<RESOURCE_ENERGY> | undefined>this.creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1, { filter: (r: Resource) => r.resourceType == RESOURCE_ENERGY })[0];
        if (droppedEnergy !== undefined) this.creep.pickup(droppedEnergy);

        // If someone beat us to droppedEnergy, loadEnergy will be called again next tick, and we'll harvest again or withdraw an adjusted amount
        let remainingAmount = targetAmount - this.creep.carry.energy - (droppedEnergy === undefined ? 0 :droppedEnergy.amount);
        if (energyStore.liveObject instanceof Source) this.creep.harvest(energyStore.liveObject);
        else this.creep.withdraw(<Structure>energyStore.liveObject, RESOURCE_ENERGY, remainingAmount);

        return true;
    }

    protected selectNextTarget<T extends (RoomPosition | { pos: RoomPosition })>(targets: T[]): T[] {
        let realTargets = targets.filter((t) => t !== undefined && (<any>t).pos !== undefined);
        let nextTarget = this.creep.pos.findClosestByPath(realTargets);
        if (nextTarget === null) return [];
        swapIndices(realTargets, realTargets.indexOf(nextTarget), 0);
        return realTargets;
    }
};
