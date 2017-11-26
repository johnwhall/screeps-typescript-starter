import * as Config from "./config/config";

import * as Profiler from "screeps-profiler";
import { log } from "./lib/logger/log";

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
        for (let name in Memory.creeps) if (!Game.creeps[name]) { console.log('Clearing non-existing creep memory:', name); delete Memory.creeps[name]; }
        for (let name in Memory.flags) if (!Game.flags[name]) { console.log('Clearing non-existing flag memory:', name); delete Memory.flags[name]; }

        // Flags remain in Game.flags after removal. Always use myFlags, or else I have to add an isRemoved field to Flag!
        let myFlags = _.filter(Game.flags, (f) => !f.checkRemove());
        _.forEach(myFlags, (f) => f.update());

        _.forEach(Game.rooms, (room) => {
            if (!room.controller || !room.controller.my) return;

            _.forEach(room.find(FIND_MY_CONSTRUCTION_SITES), (cs: ConstructionSite) => { if (!cs.flag) createConstructionSiteFlag(cs.pos, room.name) });

            let roomFlags = _.filter(myFlags, (f) => f.assignedRoomName == room.name);
            let roomRemoteSources: RemoteSource[] = _.map(roomFlags.filter((f) => f.type == FlagType.FLAG_SOURCE), "remote");

            let roomCreeps = _.filter(Game.creeps, (c) => c.homeRoom == room);
            let roomBornCreeps = roomCreeps.filter((c) => !c.spawning);
            let roomBornStationaryHarvesters = roomBornCreeps.filter((c) => c.caste == Caste.STATIONARY_HARVESTER);
            let roomBornUnemployedStationaryHarvesters = roomBornStationaryHarvesters.filter((c) => !c.job);

            if (roomRemoteSources.length > 0) {
                _.forEach(roomBornUnemployedStationaryHarvesters, (c) => {
                    c.job = new StationaryHarvestJob(c, roomRemoteSources[0]);
                });
            }

            room.queueFromTargets();
            room.spawnFromQueue();
        });

        _.forEach(Game.creeps, (c) => console.log(`creep ${c.name} memory: ${JSON.stringify(c.memory)}`));

        _.forEach(Game.creeps, (c) => c.doJob());

        _.forEach(Game.constructionSites, (cs) => {
            new RoomVisual(cs.pos.roomName).text(`${cs.progress} / ${cs.progressTotal}`, cs.pos.x, cs.pos.y + 0.6, { font: 0.35 });
        });
    } catch (e) {
        if (e instanceof Error) console.log(e.stack);
        else console.log(e);
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
