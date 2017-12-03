import * as Config from "./config/config";
import * as Profiler from "screeps-profiler";
import { log } from "./lib/logger/log";

import { init } from "./init";
import { Caste } from "./caste";
import { RemotableEnergyStore, RemotableContainer, RemotableStorage, RemotableSpawn, RemotableExtension, REMOTABLE_TYPE_SOURCE, RemotableWall, RemotableRampart } from "./remotables/remotable";
import { employUpgraders } from "./planning/upgraders";
import { employStationaryHarvesters } from "./planning/stationary-harvesters";
import { employHaulers } from "./planning/haulers";
import { employBuilders } from "./planning/builders";
import { updateVisuals } from "./visuals";
import { updateTickRate } from "./utils";
import { employRepairers } from "./planning/repairers";

if (Config.USE_PROFILER) Profiler.enable();

log.debug(`Scripts bootstrapped`);
if (__REVISION__) log.debug(`Revision ID: ${__REVISION__}`);

init();

function mloop() {
    try {
        updateTickRate();

        // TODO: do this for rooms and spawns also?
        for (let name in Memory.creeps) if (!Game.creeps[name]) { console.log('Clearing non-existing creep memory:', name); delete Memory.creeps[name]; }
        for (let name in Memory.flags) if (!Game.flags[name]) { console.log('Clearing non-existing flag memory:', name); delete Memory.flags[name]; }

        _.forEach(Game.flags, (f) => !f.checkRemove() && f.update());

        // _.forEach(Game.creeps, (c) => console.log(`creep ${c.name} memory: ${JSON.stringify(c.memory)}`));
        // _.forEach(Game.creeps, (c) => delete c.memory.job);

        _.forEach(Game.rooms, (room) => {
            try {
                if (!room.controller || !room.controller.my) return;

                room.casteTarget(Caste.STATIONARY_HARVESTER, 0);
                room.casteTarget(Caste.WORKER, 2);
                room.casteTarget(Caste.HAULER, 0);

                _.forEach(room.assignedCreeps, (casteCreeps) => _.forEach(casteCreeps, (c) => { if (c.job) c.job.update(); }));

                let roomUncoveredSources = _.sortBy(_.filter(room.assignedSources, (s) => !s.covered), "container");

                let unemployedStationaryHarvesters = _.filter(room.assignedCreeps[Caste.STATIONARY_HARVESTER], (c: Creep) => !c.job);
                let unemployedHaulers = _.filter(room.assignedCreeps[Caste.HAULER], (c: Creep) => !c.job);
                let unemployedWorkers = _.filter(room.assignedCreeps[Caste.WORKER], (c: Creep) => !c.job);

                // STATIONARY HARVESTERS
                employStationaryHarvesters(unemployedStationaryHarvesters, roomUncoveredSources);

                let sourceContainers: RemotableContainer[] = [];
                for (let container of room.assignedContainers) if (container.source !== undefined) sourceContainers.push(container);
                let workerEnergyStores = (<RemotableEnergyStore[]>roomUncoveredSources).concat(room.assignedContainers);
                if (room.storage !== undefined) workerEnergyStores.push(room.storage.remotable);

                // FILLERS
                let fillerCreeps = room.assignedCreeps[Caste.HAULER].length === 0 ? unemployedWorkers : unemployedHaulers;
                let fillTargets = _.filter((<(RemotableSpawn | RemotableExtension)[]>room.spawns).concat(room.extensions), (t) => t.plannedEnergyWithIncoming < t.energyCapacity);
                let fillEnergyStores = workerEnergyStores;
                if (fillerCreeps === unemployedHaulers) fillEnergyStores = fillEnergyStores.filter((es) => es.type !== REMOTABLE_TYPE_SOURCE);
                employHaulers(fillerCreeps, fillEnergyStores, fillTargets);

                // HAULERS
                let haulTargets: (RemotableContainer | RemotableStorage)[] = [];
                for (let container of room.assignedContainers) if (container.source === undefined) haulTargets.push(container);
                if (room.storage !== undefined) haulTargets.push(room.storage.remotable);
                haulTargets = haulTargets.filter((ht) => ht.plannedEnergyWithIncoming < ht.energyCapacity);
                employHaulers(unemployedHaulers, sourceContainers, haulTargets);

                // REPAIRERS
                let repairTargets = _.filter(room.assignedStructures, (cs) => cs.structureType !== STRUCTURE_WALL && cs.structureType !== STRUCTURE_RAMPART && cs.plannedHits < 0.9 * cs.hitsMax);
                if (repairTargets.length > 0) repairTargets = _.filter(room.assignedStructures, (cs) => cs.structureType !== STRUCTURE_WALL && cs.structureType !== STRUCTURE_RAMPART && cs.plannedHits < 0.98 * cs.hitsMax); // repair in bulk
                if (!room.rampWallUnderRepair) {
                    let weakestRampWall: RemotableWall | RemotableRampart | undefined = undefined;
                    for (let wall of room.assignedWalls) if (wall.plannedHits < wall.hitsMax && (weakestRampWall === undefined || wall.plannedHits < weakestRampWall.plannedHits)) weakestRampWall = wall;
                    for (let ramp of room.assignedRamparts) if (ramp.plannedHits < ramp.hitsMax && (weakestRampWall === undefined || ramp.plannedHits < weakestRampWall.plannedHits)) weakestRampWall = ramp;
                    if (weakestRampWall) repairTargets.push(weakestRampWall);
                }
                employRepairers(room, unemployedWorkers, workerEnergyStores, repairTargets);

                // BUILDERS
                let buildTargets = _.filter(room.assignedConstructionSites, (cs) => cs.plannedProgress < cs.progressTotal);
                employBuilders(room, unemployedWorkers, workerEnergyStores, buildTargets);

                // UPGRADERS
                employUpgraders(room, unemployedWorkers, workerEnergyStores);

                room.queueFromTargets();
                room.spawnFromQueue();
            } catch (e) {
                log.logException(e);
            }
        });

        // _.forEach(Game.creeps, (c) => { if (c.caste !== Caste.STATIONARY_HARVESTER) c.doJob() });
        _.forEach(Game.creeps, (c) => c.doJob() );

        updateVisuals();
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
