import { ReserveJob } from "../jobs/reserve-job";
import { RemotableController } from "../remotables/remotable";

export function employReservers(unemployedClaimers: Creep[], controllers: RemotableController[]) {
    while (unemployedClaimers.length > 0 && controllers.length > 0) {
        let claimer = unemployedClaimers.splice(0, 1)[0];
        let controller = controllers.splice(0, 1)[0];
        console.log(`Ordering ${claimer.name} to reserve ${controller}`);
        claimer.job = ReserveJob.newJob(claimer, controller);
        claimer.job.update();
    }
}
