import { RemotableEnergyStore, RemotableStructure } from "../remotables/remotable";
import { RepairTarget, RepairJob } from "../jobs/repair-job";
import { findEnergyStore } from "../utils";

export function employRepairers(room: Room, unemployedWorkers: Creep[], energyStores: RemotableEnergyStore[], repairTargets: RemotableStructure[]) {
    for (let i = 0; i < unemployedWorkers.length; i++) {
        let worker = unemployedWorkers[i];
        let targets = [];
        let maxAvailableEnergyStore = _.max(energyStores, (es) => es.availableEnergyForPickup);
        let capacity = Math.min(maxAvailableEnergyStore.availableEnergyForPickup, worker.freeCapacity) + worker.carry.energy;
        if (capacity === 0) continue;
        let searchOrigin = worker.pos;
        let totalEnergyRequired = 0;

        while (capacity > 0 && repairTargets.length > 0) {
            let target = searchOrigin.findClosestByPath([repairTargets[0]]);
            if (!target) break;
            let energyRequired = Math.min((target.hitsMax - target.plannedHits) * REPAIR_COST, capacity); // TODO: account for boosts
            targets.push(new RepairTarget(target, energyRequired / REPAIR_COST)); // TODO: account for boosts
            capacity -= energyRequired;
            totalEnergyRequired += energyRequired;
            if (target.plannedHits + energyRequired / REPAIR_COST >= target.hitsMax || target.structureType === STRUCTURE_WALL || target.structureType === STRUCTURE_RAMPART) {
                repairTargets.splice(0, 1);
            }
            searchOrigin = target.pos;
        }

        if (targets.length > 0) {
            let energyStore = findEnergyStore(worker, room, totalEnergyRequired);
            if (!energyStore) continue;
            console.log(`Ordering ${worker.name} to pick up ${totalEnergyRequired} from ${energyStore} and repair ${targets}`);
            worker.job = RepairJob.newJob(worker, energyStore, targets);
            worker.job.update();
            unemployedWorkers.splice(i--, 1);
        }
    }
}
