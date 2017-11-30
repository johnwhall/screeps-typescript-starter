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

        _.forEach(Game.rooms, (room) => {
            try {
                if (!room.controller || !room.controller.my) return;

                room.casteTarget(Caste.STATIONARY_HARVESTER, 0);
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
                console.log(`unemployedWorkers: ${unemployedWorkers}`);

                // BUILDERS

                let buildTargets = room.assignedConstructionSites;
                for (var i = 0; i < unemployedWorkers.length; i++) {
                    var worker = unemployedWorkers[i];
                    var targets = [];
                    var capacity = worker.freeCapacity + worker.carry.energy;
                    var searchOrigin = worker.pos;
                    var totalEnergyRequired = 0;

                    while (capacity > 0 && buildTargets.length > 0) {
                        var target = searchOrigin.findClosestByPath([buildTargets[0]]);
                        if (!target) break;
                        var energyRequired = Math.min(target.progressTotal - target.plannedProgress, capacity);
                        targets.push(new BuildTarget(target, energyRequired));
                        capacity -= energyRequired; // TODO: check max available energy in assigned energy stores
                        totalEnergyRequired += energyRequired;
                        if (target.plannedProgress  + energyRequired >= target.progressTotal) {
                            console.log('Removing ' + target + ' from buildTargets. Length before: ' + buildTargets.length);
                            buildTargets.splice(0, 1);
                            console.log('Removed ' + target + ' from buildTargets. Length after: ' + buildTargets.length);
                        }
                        searchOrigin = target.pos;
                    }

                    if (targets.length > 0) {
                        var supply = findEnergyStore(worker, room, totalEnergyRequired);
                        if (!supply) continue;
                        // console.log(`Ordering ${worker.name} to pick up ${totalEnergyRequired} from ${supply} and build ${targets.map((t) => t.toString()).join(', ')}`);
                        console.log(`Ordering ${worker.name} to pick up ${totalEnergyRequired} from ${supply} and build ${targets}`);
                        // console.log('Ordering ' + worker.name + ' to pick up ' + totalEnergyRequired + ' from ' + supply + ' and build ' + targets);
                        worker.job = BuildJob.newJob(worker, supply, targets);
                        worker.job.update();
                        unemployedWorkers.splice(i--, 1);
                    }
                }

                // UPGRADERS
                while (unemployedWorkers.length > 0) {
                    let worker = unemployedWorkers[0];
                    let energyStore = worker.pos.findClosestByPath(roomUncoveredSources); // TODO: make sure selected store has enough energy
                    console.log(`Ordering ${worker.name} to pick up ${worker.freeCapacity} from ${energyStore} and upgrade ${room.controller.remotable}`);
                    worker.job = UpgradeJob.newJob(worker, energyStore, room.controller.remotable);
                    worker.job.update();
                    unemployedWorkers.splice(0, 1);
                }

                room.queueFromTargets();
                room.spawnFromQueue();
            } catch (e) {
                log.logException(e);
            }
        });

        _.forEach(Game.creeps, (c) => c.doJob());

        _.forEach(Game.constructionSites, (cs) => {
            // TODO: min(plannedProgress, progressTotal) in case multiple creeps are building a structure that is just about to finish, pushing plannedProgress over the top
            let plannedProgressStr = cs.remotable.plannedProgress === cs.progress ? "" : ` (${cs.remotable.plannedProgress})`;
            new RoomVisual(cs.pos.roomName).text(`${cs.progress}${plannedProgressStr} / ${cs.progressTotal}`, cs.pos.x, cs.pos.y + 0.6, { font: 0.35 });
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
