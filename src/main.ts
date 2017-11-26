import * as Config from "./config/config";

import * as Profiler from "screeps-profiler";
import { log, exceptionColor, color } from "./lib/logger/log";

import * as FlagModule from "./flags/flag";
import { FlagType } from "./flags/flag";
import * as StructureFlagModule from "./flags/structure-flag";

import { RemoteSource } from "./remotes/remote-source";
import * as CreepModule from "./creep";
import * as ConstructionSiteModule from "./construction-site";
import * as RoomModule from "./room";
import { Caste } from "./caste";
import { StationaryHarvestJob } from "./jobs/stationary-harvest-job";
import { createConstructionSiteFlag } from "./flags/construction-site-flag";

// Any code written outside the `loop()` method is executed only when the
// Screeps system reloads your script.
// Use this bootstrap wisely. You can cache some of your stuff to save CPU.
// You should extend prototypes before the game loop executes here.

// This is an example for using a config variable from `config.ts`.
// NOTE: this is used as an example, you may have better performance
// by setting USE_PROFILER through webpack, if you want to permanently
// remove it on deploy
// Start the profiler
if (Config.USE_PROFILER) {
    Profiler.enable();
}

log.debug(`Scripts bootstrapped`);
if (__REVISION__) {
    log.debug(`Revision ID: ${__REVISION__}`);
}

FlagModule.init();
StructureFlagModule.init();
CreepModule.init();
ConstructionSiteModule.init();
RoomModule.init();

function mloop() {
    try {
        // TODO: do this for rooms and spawns also?
        for (let name in Memory.creeps) if (!Game.creeps[name]) { console.log('Clearing non-existing creep memory:', name); delete Memory.creeps[name]; }
        for (let name in Memory.flags) if (!Game.flags[name]) { console.log('Clearing non-existing flag memory:', name); delete Memory.flags[name]; }

        _.forEach(Game.flags, (f) => !f.checkRemove() && f.update());

        _.forEach(Game.rooms, (room) => {
            if (!room.controller || !room.controller.my) return;

            _.forEach(room.find(FIND_MY_CONSTRUCTION_SITES), (cs: ConstructionSite) => { if (!cs.flag) createConstructionSiteFlag(cs.pos, room.name) });

            _.forEach(room.assignedCreepsForCaste(Caste.STATIONARY_HARVESTER), (c) => { if (c.job && c.job.name == "stationary-harvest") (<StationaryHarvestJob>c.job).source.covered = true; });

            let roomRemoteSources: RemoteSource[] = _.map(room.assignedFlags.filter((f) => f.type == FlagType.FLAG_SOURCE), "remote");
            let roomCoveredRemoteSources = _.filter(roomRemoteSources, (s) => s.covered);
            let roomUncoveredRemoteSources = _.filter(roomRemoteSources, (s) => !s.covered);

            _.forEach(room.assignedCreepsForCaste(Caste.STATIONARY_HARVESTER).filter((c) => !c.job), (c) => {
                if (roomUncoveredRemoteSources.length == 0) return false;
                let job = new StationaryHarvestJob(c, roomUncoveredRemoteSources[0]);
                console.log(`Ordering ${c.name} to harvest from ${job.source}`);
                c.job = job;
                roomCoveredRemoteSources.push(roomUncoveredRemoteSources.splice(0, 1)[0]);
            });

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
