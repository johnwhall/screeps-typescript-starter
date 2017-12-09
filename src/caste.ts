export enum Caste {
    WORKER = "WORKER",
    STATIONARY_HARVESTER = "STATIONARY_HARVESTER",
    HAULER = "HAULER",
    SCOUT = "SCOUT",
    CLAIMER = "CLAIMER"
}

export let PartOrders: { [C in Caste]:BodyPartConstant[] } = {
    WORKER: [ MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE,
              CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, WORK ],
    STATIONARY_HARVESTER: [ MOVE, WORK, WORK, WORK, WORK, WORK, WORK, CARRY ],
    HAULER: [ MOVE, CARRY, CARRY, MOVE, CARRY, CARRY, MOVE, CARRY, CARRY, MOVE, CARRY, CARRY, MOVE, CARRY, CARRY ],
    SCOUT: [ MOVE ],
    CLAIMER: [ MOVE, CLAIM, CLAIM ],
}

export function selectParts(caste: Caste, energyAvailable: number): BodyPartConstant[] {
    let parts: BodyPartConstant[] = [];
    _.forEach(PartOrders[caste], (p) => {
        if (BODYPART_COST[p] > energyAvailable) return false;
        parts.push(p);
        energyAvailable -= BODYPART_COST[p];
    });
    return parts;
}
