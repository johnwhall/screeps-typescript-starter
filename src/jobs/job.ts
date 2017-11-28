import { RemotableEnergyStore } from "../remotables/remotable";
import { swapIndices } from "../utils";

export abstract class Job {
    readonly name: string;
    readonly creep: Creep;
    abstract run(): boolean; // true if job should continue on next tick
    abstract save(): any;
    abstract update(): void;

    constructor(name: string, creep: Creep) {
        this.name = name;
        this.creep = creep;
    }

    protected moveTo(pos: RoomPosition | { pos: RoomPosition }, range: number = 1) {
        if (this.creep.pos.inRangeTo(pos, range)) return false;
        this.creep.moveTo(pos);
        return true;
    }

    protected loadEnergy(energyStore: RemotableEnergyStore, targetAmount: number = this.creep.freeCapacity + this.creep.carry.energy) {
        if (this.creep.carry.energy >= targetAmount) return false;
        let droppedEnergy = <Resource<RESOURCE_ENERGY> | undefined>energyStore.pos.lookFor(LOOK_ENERGY)[0];
        if (droppedEnergy !== undefined) this.creep.pickup(droppedEnergy);
        else if (energyStore.liveObject instanceof Source) this.creep.harvest(energyStore.liveObject);
        else this.creep.withdraw(<Structure>energyStore.liveObject, RESOURCE_ENERGY);
        return true;
    }

    // protected selectNextTarget<T extends RoomObject>(targets: T[]) {
    //     if (targets.length == 0) return;
    //     let nextTarget = this.creep.pos.findClosestByPath(targets);
    //     targets.swapProperties(targets.indexOf(nextTarget), 0);
    // }

    protected selectNextTarget(targets: (RoomPosition | { pos: RoomPosition })[]): boolean {
        if (targets.length == 0) return false;
        let nextTarget = this.creep.pos.findClosestByPath(targets);
        swapIndices(targets, targets.indexOf(nextTarget), 0);
        return true;
    }
};
