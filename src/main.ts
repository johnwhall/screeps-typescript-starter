import * as Config from "./config/config";

import * as Profiler from "screeps-profiler";
import { log, exceptionColor, color } from "./lib/logger/log";

import { Caste } from "./caste";
import { StationaryHarvestJob } from "./jobs/stationary-harvest-job";
import { UpgradeJob } from "./jobs/upgrade-job";

import { init } from "./init";

if (Config.USE_PROFILER) Profiler.enable();

log.debug(`Scripts bootstrapped`);
if (__REVISION__) log.debug(`Revision ID: ${__REVISION__}`);

init();

function mloop() {
    try {
        // TODO: do this for rooms and spawns also?
        for (let name in Memory.creeps) if (!Game.creeps[name]) { console.log('Clearing non-existing creep memory:', name); delete Memory.creeps[name]; }
        for (let name in Memory.flags) if (!Game.flags[name]) { console.log('Clearing non-existing flag memory:', name); delete Memory.flags[name]; }

        _.forEach(Game.flags, (f) => !f.checkRemove() && f.update());

        _.forEach(Game.rooms, (room) => {
            if (!room.controller || !room.controller.my) return;

            room.casteTarget(Caste.STATIONARY_HARVESTER, 2);
            room.casteTarget(Caste.WORKER, 2);

            // Do I need this? Local construction sites can be handled by LocalConstructionSite - why do I need a flag (and therefore a RemoteConstructionSite) for construction sites in my own room?
            // _.forEach(room.find(FIND_MY_CONSTRUCTION_SITES), (cs: ConstructionSite) => { if (!cs.flag) createConstructionSiteFlag(cs.pos, room.name) });

            _.forEach(room.assignedCreeps, (cs) => _.forEach(cs, (c) => { if (c.job) c.job.update(); }));

            let roomUncoveredSources = _.filter(room.assignedSources, (s) => !s.covered);

            // STATIONARY HARVESTERS
            _.forEach(room.assignedCreeps[Caste.STATIONARY_HARVESTER].filter((c) => !c.job), (c) => {
                if (roomUncoveredSources.length == 0) return false;
                let job = new StationaryHarvestJob(c, roomUncoveredSources[0]);
                console.log(`Ordering ${c.name} to harvest from ${job.source}`);
                c.job = job;
                roomUncoveredSources.splice(0, 1);
            });

            let unemployedWorkers = _.filter(room.assignedCreeps[Caste.WORKER], (c: Creep) => !c.job);

            // UPGRADERS
            while (unemployedWorkers.length > 0) {
                let worker = unemployedWorkers[0];
                let energyStore = worker.pos.findClosestByPath(roomUncoveredSources);
                console.log(`Ordering ${worker.name} to pick up ${worker.freeCapacity} from ${energyStore} and upgrade ${room.controller.remotable}`);
                worker.job = new UpgradeJob(worker, energyStore, room.controller.remotable);
                unemployedWorkers.splice(0, 1);
            }

            room.queueFromTargets();
            room.spawnFromQueue();
        });

        // _.forEach(Game.creeps, (c) => console.log(`creep ${c.name} memory: ${JSON.stringify(c.memory)}`));

        _.forEach(Game.creeps, (c) => c.doJob());

        _.forEach(Game.constructionSites, (cs) => {
            new RoomVisual(cs.pos.roomName).text(`${cs.progress} / ${cs.progressTotal}`, cs.pos.x, cs.pos.y + 0.6, { font: 0.35 });
        });
    } catch (e) {
        if (e instanceof Error) log.trace(e);
        else console.log(color(e, exceptionColor));
    }
}

/**
 * Screeps system expects this "loop" method in main.js to run the
 * application. If we have this line, we can be sure that the globals are
 * bootstrapped properly and the game loop is executed.
 * http://support.screeps.com/hc/en-us/articles/204825672-New-main-loop-architecture
 *
 * @export
 */
export const loop = !Config.USE_PROFILER ? mloop : () => { Profiler.wrap(mloop); };
