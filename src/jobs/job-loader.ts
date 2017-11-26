import { Job } from "./job";
import { StationaryHarvestJob } from "./stationary-harvest-job";

export function loadJob(creep: Creep): Job {
    switch (creep.memory.job.name) {
        case "stationary-harvest":
            return StationaryHarvestJob.load(creep);
        default:
            throw `Unknown job name ${creep.memory.job.name} for creep ${creep.name}`;
    }
}
