import { RemotableEnergyStore, RemotableContainer, RemotableStorage, RemotableSpawn, RemotableExtension } from "../remotables/remotable";
import { HaulTarget, HaulJob } from "../jobs/haul-job";

export function employHaulers(unemployedHaulers: Creep[], energyStores: RemotableEnergyStore[], haulTargets: (RemotableContainer | RemotableStorage | RemotableSpawn | RemotableExtension)[]) {
    for (let i = 0; i < unemployedHaulers.length; i++) {
        let hauler = unemployedHaulers[i];
        let targets = [];
        let maxAvailableEnergyStore = _.max(energyStores, (es) => es.availableEnergyForPickup);
        let capacity = Math.min(maxAvailableEnergyStore.availableEnergyForPickup, hauler.freeCapacity) + hauler.carry.energy;
        if (capacity === 0) continue;
        let searchOrigin = hauler.pos;
        let totalEnergyRequired = 0;

        while (capacity > 0 && haulTargets.length > 0) {
            let target = searchOrigin.findClosestByPath([haulTargets[0]]);
            if (!target) break;
            let energyRequired = Math.min(target.energyCapacity - target.plannedEnergyWithIncoming, capacity);
            targets.push(new HaulTarget(target, energyRequired));
            capacity -= energyRequired;
            totalEnergyRequired += energyRequired;
            if (target.plannedEnergyWithIncoming + energyRequired >= target.energyCapacity) {
                haulTargets.splice(0, 1);
            }
            searchOrigin = target.pos;
        }

        if (targets.length > 0) {
            let energyStore = hauler.pos.findClosestByPath(energyStores, { filter: (es: RemotableEnergyStore) => es.availableEnergyForPickup >= totalEnergyRequired - hauler.carry.energy });
            if (!energyStore) continue;
            console.log(`Ordering ${hauler.name} to pick up ${totalEnergyRequired} from ${energyStore} and deliver to ${targets}`);
            hauler.job = HaulJob.newJob(hauler, energyStore, targets);
            hauler.job.update();
            unemployedHaulers.splice(i--, 1);
        }
    }
}
