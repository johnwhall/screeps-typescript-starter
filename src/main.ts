import * as Config from "./config/config";

import * as Profiler from "screeps-profiler";
import { log } from "./lib/logger/log";

import * as RemotableModule from "./remotes/remotable";
import * as RemotableContainerModule from "./remotes/remotable-container";
import * as FlagModule from "./flags/flag";
import * as StructureFlagModule from "./flags/structure-flag";

import { RemotableSource } from "./remotes/remotable-source";

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

RemotableModule.init();
// RemoteSource.init();
RemotableContainerModule.init();
FlagModule.init();
StructureFlagModule.init();

function mloop() {
    for (let name in Memory.creeps) if (!Game.creeps[name]) { console.log('Clearing non-existing creep memory:', name); delete Memory.creeps[name]; }
    for (let name in Memory.flags) if (!Game.flags[name]) { console.log('Clearing non-existing flag memory:', name); delete Memory.flags[name]; }
    _.forEach(Game.flags, (f) => f.update());

    _.forEach(Game.rooms, (r) => {
        let flag: Flag|undefined = <Flag|undefined>r.find(FIND_FLAGS)[0];
        if (flag === undefined) {
            console.log("no flags");
        } else {
            console.log("flag " + flag.type + " remote: " + flag.remotable);
            let remote: RemotableSource = <RemotableSource>flag.remotable;
            console.log("remote.pos: " + remote.pos);
            console.log("remote.room: " + remote.room);
            console.log("remote.liveObject: " + remote.liveObject);
        }
    });
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
