import * as Config from "./config/config";

import * as Profiler from "screeps-profiler";
import { log } from "./lib/logger/log";

import { Caste } from "./caste";
import { StationaryHarvestJob } from "./jobs/stationary-harvest-job";
import { UpgradeJob } from "./jobs/upgrade-job";

import { init } from "./init";
import { BuildJob, BuildTarget } from "./jobs/build-job";
import { RemotableEnergyStore } from "remotables/remotable";

if (Config.USE_PROFILER) Profiler.enable();

log.debug(`Scripts bootstrapped`);
if (__REVISION__) log.debug(`Revision ID: ${__REVISION__}`);

init();

function findEnergyStore(creep: Creep, room: Room, totalEnergyRequired: number): RemotableEnergyStore {
    let containersAndStorage: RemotableEnergyStore[] = [];
    for (let i = 0; i < room.assignedContainers.length; i++) {
        if (room.assignedContainers[i].plannedEnergy >= totalEnergyRequired - creep.carry.energy) containersAndStorage.push(room.assignedContainers[i]);
    }
    let bestStore = creep.pos.findClosestByPath(containersAndStorage);
    return bestStore || creep.pos.findClosestByPath(room.assignedSources, { filter: { covered: false } });
}

function mloop() {
    try {
        // TODO: do this for rooms and spawns also?
        for (let name in Memory.creeps) if (!Game.creeps[name]) { console.log('Clearing non-existing creep memory:', name); delete Memory.creeps[name]; }
        for (let name in Memory.flags) if (!Game.flags[name]) { console.log('Clearing non-existing flag memory:', name); delete Memory.flags[name]; }

        _.forEach(Game.flags, (f) => !f.checkRemove() && f.update());

        // _.forEach(Game.creeps, (c) => console.log(`creep ${c.name} memory: ${JSON.stringify(c.memory)}`));
        // _.forEach(Game.creeps, (c) => delete c.memory.job);

        _.forEach(Game.rooms, (room) => {
            try {
                if (!room.controller || !room.controller.my) return;

                room.casteTarget(Caste.STATIONARY_HARVESTER, 1);
                room.casteTarget(Caste.WORKER, 1);

                _.forEach(room.assignedCreeps, (cs) => _.forEach(cs, (c) => { if (c.job) c.job.update(); }));

                let roomUncoveredSources = _.filter(room.assignedSources, (s) => !s.covered);

                // STATIONARY HARVESTERS

                _.forEach(room.assignedCreeps[Caste.STATIONARY_HARVESTER].filter((c) => !c.job), (c) => {
                    if (roomUncoveredSources.length == 0) return false;
                    let source = roomUncoveredSources.splice(0, 1)[0];
                    console.log(`Ordering ${c.name} to harvest from ${source}`);
                    c.job = StationaryHarvestJob.newJob(c, source);
                    c.job.update();
                });

                let unemployedWorkers = _.filter(room.assignedCreeps[Caste.WORKER], (c: Creep) => !c.job);

                // BUILDERS

                let energyStores = (<RemotableEnergyStore[]>room.assignedContainers).concat(roomUncoveredSources); // TODO: add storage
                let buildTargets = _.filter(room.assignedConstructionSites, (cs) => cs.plannedProgress < cs.progressTotal);
                for (let i = 0; i < unemployedWorkers.length; i++) {
                    let worker = unemployedWorkers[i];
                    let targets = [];
                    let maxAvailableEnergyStore = _.max(energyStores, (es) => es.plannedEnergy);
                    let capacity = Math.min(maxAvailableEnergyStore.plannedEnergy, worker.freeCapacity) + worker.carry.energy;
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
                        if (target.plannedProgress  + energyRequired >= target.progressTotal) {
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

                // UPGRADERS

                for (let i = 0; i < unemployedWorkers.length; i++) {
                    let worker = unemployedWorkers[i];
                    let maxAvailableEnergyStore = _.max(energyStores, (es) => es.plannedEnergy);
                    let capacity = Math.min(maxAvailableEnergyStore.plannedEnergy, worker.freeCapacity) + worker.carry.energy;
                    if (capacity === 0) continue;
                    let energyStore = findEnergyStore(worker, room, capacity);
                    if (!energyStore) continue;
                    console.log(`Ordering ${worker.name} to pick up ${capacity} from ${energyStore} and upgrade ${room.controller.remotable}`);
                    worker.job = UpgradeJob.newJob(worker, energyStore, room.controller.remotable, capacity);
                    worker.job.update();
                    unemployedWorkers.splice(i--, 1);
                }

                if (unemployedWorkers.length > 0) console.log("unemployedWorkers at end of tick: " + unemployedWorkers);

                room.queueFromTargets();
                room.spawnFromQueue();
            } catch (e) {
                log.logException(e);
            }
        });

        // _.forEach(Game.creeps, (c) => { if (c.caste !== Caste.STATIONARY_HARVESTER) c.doJob() });
        _.forEach(Game.creeps, (c) => c.doJob() );

        _.forEach(Game.constructionSites, (cs) => {
            let plannedProgressStr = cs.remotable.plannedProgress === cs.progress ? "" : ` (${cs.remotable.plannedProgress})`;
            new RoomVisual(cs.pos.roomName).text(`${cs.progress}${plannedProgressStr} / ${cs.progressTotal}`, cs.pos.x, cs.pos.y + 0.6, { font: 0.35 });
        });

        _.forEach(Game.rooms, (room) => {
            if (!room.controller || !room.controller.my) return;

            for (let cont of room.assignedContainers) {
                let plannedEnergyStr = cont.plannedEnergy === cont.energy ? "" : ` (${cont.plannedEnergy})`;
                room.visual.text(`${cont.energy}${plannedEnergyStr} / ${cont.energyCapacity}`, cont.pos.x, cont.pos.y + 0.6, { font: 0.35 });
            }
        });
    } catch (e) {
        log.logException(e);
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
