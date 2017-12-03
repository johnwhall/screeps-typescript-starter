import { RemotableEnergyStore } from "remotables/remotable";

export function nextUuid(): string {
    let prevTime = Number(Memory.previousUuidTime) || Game.time;
    let num = (Number(Memory.previousUuidNum) || 0) + 1;
    if (prevTime != Game.time) num = 1;
    let uid = Game.time + "-" + num;
    Memory.previousUuidTime = Game.time;
    Memory.previousUuidNum = num;
    return uid;
}

export function swapProperties<T>(obj: T, key1: keyof T, key2: keyof T) {
    let tmp = obj[key1];
    obj[key1] = obj[key2];
    obj[key2] = tmp;
}

export function swapIndices<T>(arr: T[], idx1: number, idx2: number) {
    let tmp = arr[idx1];
    arr[idx1] = arr[idx2];
    arr[idx2] = tmp;
}

export function findEnergyStore(creep: Creep, room: Room, totalEnergyRequired: number): RemotableEnergyStore { // TODO: optimize
    let containersAndStorage: RemotableEnergyStore[] = [];
    for (let i = 0; i < room.assignedContainers.length; i++) {
        if (room.assignedContainers[i].availableEnergyForPickup >= totalEnergyRequired - creep.carry.energy) containersAndStorage.push(room.assignedContainers[i]);
    }
    if (room.storage && room.storage.remotable.availableEnergyForPickup >= totalEnergyRequired - creep.carry.energy) containersAndStorage.push(room.storage.remotable);
    let bestStore = creep.pos.findClosestByPath(containersAndStorage);
    return bestStore || creep.pos.findClosestByPath(room.assignedSources, { filter: { covered: false } });
}

export function updateTickRate() {
    var curTickTime = new Date().getTime();
    if (!Memory.lastTickTime) { Memory.lastTickTime = curTickTime; Memory.avgTickRate = 0; }
    var thisTickRate = (curTickTime - Memory.lastTickTime) / 1000;
    Memory.avgTickRate = Memory.avgTickRate - Memory.avgTickRate / 100 + thisTickRate / 100;
    Memory.lastTickTime = curTickTime;
}
