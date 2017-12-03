import { RemotableEnergyStore, RemotableConstructionSite } from "../remotables/remotable";
import { BuildTarget, BuildJob } from "../jobs/build-job";
import { findEnergyStore } from "../utils";

export function employBuilders(room: Room, unemployedWorkers: Creep[], energyStores: RemotableEnergyStore[], buildTargets: RemotableConstructionSite[]) {
    for (let i = 0; i < unemployedWorkers.length; i++) {
        let worker = unemployedWorkers[i];
        let targets = [];
        let maxAvailableEnergyStore = _.max(energyStores, (es) => es.availableEnergyForPickup);
        let capacity = Math.min(maxAvailableEnergyStore.availableEnergyForPickup, worker.freeCapacity) + worker.carry.energy;
        if (capacity === 0) continue;
        let searchOrigin = worker.pos;
        let totalEnergyRequired = 0;

        while (capacity > 0 && buildTargets.length > 0) {
            let target = searchOrigin.findClosestByPath([buildTargets[0]]);
            if (!target) break;
            let energyRequired = Math.min(target.progressTotal - target.plannedProgress, capacity);
            targets.push(new BuildTarget(target, energyRequired));
            capacity -= energyRequired;
            totalEnergyRequired += energyRequired;
            if (target.plannedProgress + energyRequired >= target.progressTotal) {
                buildTargets.splice(0, 1);
            }
            searchOrigin = target.pos;
        }

        if (targets.length > 0) {
            let energyStore = findEnergyStore(worker, room, totalEnergyRequired);
            if (!energyStore) continue;
            console.log(`Ordering ${worker.name} to pick up ${totalEnergyRequired} from ${energyStore} and build ${targets}`);
            worker.job = BuildJob.newJob(worker, energyStore, targets);
            worker.job.update();
            unemployedWorkers.splice(i--, 1);
        }
    }
}
