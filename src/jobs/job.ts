import { RemotableEnergyStore } from "../remotables/remotable";
import { swapIndices } from "../utils";

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
        let droppedEnergy = <Resource<RESOURCE_ENERGY> | undefined>this.creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1, { filter: (r: Resource) => r.resourceType == RESOURCE_ENERGY })[0];
        if (droppedEnergy !== undefined) this.creep.pickup(droppedEnergy);
        else if (energyStore.liveObject instanceof Source) this.creep.harvest(energyStore.liveObject);
        else this.creep.withdraw(<Structure>energyStore.liveObject, RESOURCE_ENERGY);
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
