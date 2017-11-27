export enum Caste {
    WORKER = "WORKER",
    STATIONARY_HARVESTER = "STATIONARY_HARVESTER",
    RUNNER = "RUNNER",
    SCOUT = "SCOUT"
}

export let PartOrders: { [C in Caste]:BodyPartConstant[] } = {
    WORKER: [ MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE,
              CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, WORK ],
    STATIONARY_HARVESTER: [ MOVE, WORK, WORK, WORK, WORK, WORK ],
    RUNNER: [ MOVE, CARRY, CARRY, MOVE, CARRY, CARRY, MOVE, CARRY, CARRY, MOVE, CARRY, CARRY, MOVE, CARRY, CARRY ],
    SCOUT: [ MOVE ],
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
