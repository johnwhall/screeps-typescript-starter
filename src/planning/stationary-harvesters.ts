import { StationaryHarvestJob } from "../jobs/stationary-harvest-job";
import { RemotableSource } from "../remotables/remotable";

export function employStationaryHarvesters(unemployedStationaryHarvesters: Creep[], roomUncoveredSources: RemotableSource[]) {
    _.forEach(unemployedStationaryHarvesters, (c) => {
        if (roomUncoveredSources.length == 0) return false;
        let source = roomUncoveredSources.splice(0, 1)[0];
        console.log(`Ordering ${c.name} to harvest from ${source}`);
        c.job = StationaryHarvestJob.newJob(c, source);
        c.job.update();
    });
}
