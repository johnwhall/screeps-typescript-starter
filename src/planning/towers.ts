import { log } from "../lib/logger/log";
import { RemotableRampart, RemotableRoad } from "../remotables/remotable";

export function assignTowers(room: Room) {
    let hostileTarget = _.sortBy(<Creep[]>room.find(FIND_HOSTILE_CREEPS), "hits")[0];
    if (hostileTarget) {
        for (let tower of room.towers) {
            try {
                if (tower.liveObject === undefined) throw new Error(`No live object for tower ${tower}`);
                else tower.liveObject.attack(hostileTarget);
            } catch (e) {
                log.logException(e);
            }
        }
    } else {
        // TODO: This should be fairly easy to optimize using dynamic programming (optimize benefit per energy spent)
        let creepsNeedingHealing = _(<Creep[]>room.find(FIND_MY_CREEPS)).filter((c) => c.hits < c.hitsMax).sortBy("hits").value();
        let rampartsNeedingRepairing = _(<RemotableRampart[]>room.assignedRamparts).filter((r) => r.hits <= RAMPART_DECAY_AMOUNT && r.room == room).value();
        let roadsNeedingRepairing = _(<RemotableRoad[]>room.assignedRoads).filter((r) => r.hits <= 4200 && r.room == room).value();
        for (let tower of room.towers) {
            try {
                if (tower.liveObject === undefined) throw new Error(`No live object for tower ${tower}`);
                else if (tower.energy >= 0.75 * tower.energyCapacity) {
                    if (creepsNeedingHealing.length > 0) tower.liveObject.heal(creepsNeedingHealing[0]);
                    else if (rampartsNeedingRepairing.length > 0) tower.liveObject.repair(<StructureRampart>rampartsNeedingRepairing[0].liveObject);
                    else if (roadsNeedingRepairing.length > 0) tower.liveObject.repair(<StructureRoad>roadsNeedingRepairing.splice(0, 1)[0].liveObject);
                }
            } catch (e) {
                log.logException(e);
            }
        }
    }
}
