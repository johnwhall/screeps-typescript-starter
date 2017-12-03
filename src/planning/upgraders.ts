import { RemotableEnergyStore } from "../remotables/remotable";
import { UpgradeJob } from "../jobs/upgrade-job";
import { findEnergyStore } from "../utils";

export function employUpgraders(room: Room, unemployedWorkers: Creep[], energyStores: RemotableEnergyStore[]) {
    if (!room.controller || !room.controller.my) throw new Error(`Unowned room: ${room}`);
    for (let i = 0; i < unemployedWorkers.length; i++) {
        let worker = unemployedWorkers[i];
        let maxAvailableEnergyStore = _.max(energyStores, (es) => es.availableEnergyForPickup);
        let capacity = Math.min(maxAvailableEnergyStore.availableEnergyForPickup, worker.freeCapacity) + worker.carry.energy;
        if (capacity === 0) continue;
        let energyStore = findEnergyStore(worker, room, capacity);
        if (!energyStore) continue;
        console.log(`Ordering ${worker.name} to pick up ${capacity} from ${energyStore} and upgrade ${room.controller.remotable}`);
        worker.job = UpgradeJob.newJob(worker, energyStore, room.controller.remotable, capacity);
        worker.job.update();
        unemployedWorkers.splice(i--, 1);
    }
}
