import * as Config from "./config/config";
import * as Profiler from "screeps-profiler";
import { log } from "./lib/logger/log";

import { init } from "./init";
import { Caste } from "./caste";
import { RemotableEnergyStore, RemotableContainer, RemotableStorage } from "remotables/remotable";
import { employUpgraders } from "./planning/upgraders";
import { employStationaryHarvesters } from "./planning/stationary-harvesters";
import { employHaulers } from "./planning/haulers";
import { employBuilders } from "./planning/builders";

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

        // _.forEach(Game.creeps, (c) => console.log(`creep ${c.name} memory: ${JSON.stringify(c.memory)}`));
        // _.forEach(Game.creeps, (c) => delete c.memory.job);

        _.forEach(Game.rooms, (room) => {
            try {
                if (!room.controller || !room.controller.my) return;

                room.casteTarget(Caste.STATIONARY_HARVESTER, 1);
                room.casteTarget(Caste.WORKER, 1);
                room.casteTarget(Caste.HAULER, 1);

                _.forEach(room.assignedCreeps, (casteCreeps) => _.forEach(casteCreeps, (c) => { if (c.job) c.job.update(); }));

                let roomUncoveredSources = _.filter(room.assignedSources, (s) => !s.covered);

                let unemployedStationaryHarvesters = _.filter(room.assignedCreeps[Caste.STATIONARY_HARVESTER], (c: Creep) => !c.job);
                let unemployedHaulers = _.filter(room.assignedCreeps[Caste.HAULER], (c: Creep) => !c.job);
                let unemployedWorkers = _.filter(room.assignedCreeps[Caste.WORKER], (c: Creep) => !c.job);

                // STATIONARY HARVESTERS
                employStationaryHarvesters(unemployedStationaryHarvesters, roomUncoveredSources);

                // HAULERS
                let sourceContainers: RemotableContainer[] = [];
                for (let container of room.assignedContainers) if (container.source !== undefined) sourceContainers.push(container);
                let haulTargets: (RemotableContainer | RemotableStorage)[] = [];
                for (let container of room.assignedContainers) if (container.source === undefined) haulTargets.push(container);
                if (room.storage !== undefined) haulTargets.push(room.storage.remotable);
                haulTargets = haulTargets.filter((ht) => ht.plannedEnergy < ht.energyCapacity);
                employHaulers(unemployedHaulers, sourceContainers, haulTargets);

                let workerEnergyStores: RemotableEnergyStore[] = _.clone(roomUncoveredSources);
                for (let container of room.assignedContainers) if (container.source === undefined) workerEnergyStores.push(container);
                if (room.storage !== undefined) workerEnergyStores.push(room.storage.remotable);

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
