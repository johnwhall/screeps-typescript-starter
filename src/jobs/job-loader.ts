import { Job } from "./job";
import { StationaryHarvestJob } from "./stationary-harvest-job";
import { UpgradeJob } from "./upgrade-job";
import { BuildJob } from "./build-job";

export function loadJob(creep: Creep): Job {
    switch (creep.memory.job.name) {
        case "stationary-harvest":
            return StationaryHarvestJob.load(creep);
        case "build":
            return BuildJob.load(creep);
        case "upgrade":
            return UpgradeJob.load(creep);
        default:
            throw `Unknown job name ${creep.memory.job.name} for creep ${creep.name}`;
    }
}
