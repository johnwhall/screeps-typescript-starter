import * as FlagModule from "./flags/flag";
import * as StructureFlagModule from "./flags/structure-flag";
import * as CreepModule from "./creep";
import * as ConstructionSiteModule from "./construction-site";
import * as RoomModule from "./room";
import * as LocalSourceModule from "./locals/local-source";
import * as LocalContainerModule from "./locals/local-container";
import * as LocalControllerModule from "./locals/local-controller";
import * as LocalConstructionSiteModule from "./locals/local-construction-site";
import * as LocalStorageModule from "./locals/local-storage";
import * as LocalSpawnModule from "./locals/local-spawn";

export function init() {
    FlagModule.init();
    StructureFlagModule.init();
    CreepModule.init();
    ConstructionSiteModule.init();
    RoomModule.init();
    LocalSourceModule.init();
    LocalContainerModule.init();
    LocalControllerModule.init();
    LocalConstructionSiteModule.init();
    LocalStorageModule.init();
    LocalSpawnModule.init();
}
