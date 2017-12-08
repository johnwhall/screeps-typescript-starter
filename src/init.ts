import * as FlagModule from "./flags/flag";
import * as CreepModule from "./builtin/creep";
import * as RoomPositionModule from "./builtin/room-position";
import * as RoomModule from "./builtin/room";
import * as LocalSourceModule from "./remotables/locals/local-source";
import * as LocalContainerModule from "./remotables/locals/local-container";
import * as LocalControllerModule from "./remotables/locals/local-controller";
import * as LocalConstructionSiteModule from "./remotables/locals/local-construction-site";
import * as LocalStorageModule from "./remotables/locals/local-storage";
import * as LocalSpawnModule from "./remotables/locals/local-spawn";
import * as LocalExtensionModule from "./remotables/locals/local-extension";
import * as LocalRoadModule from "./remotables/locals/local-road";
import * as LocalWallModule from "./remotables/locals/local-wall";
import * as LocalRampartModule from "./remotables/locals/local-rampart";
import * as LocalTowerModule from "./remotables/locals/local-tower";

export function init() {
    FlagModule.init();
    CreepModule.init();
    RoomPositionModule.init();
    RoomModule.init();
    LocalSourceModule.init();
    LocalContainerModule.init();
    LocalControllerModule.init();
    LocalConstructionSiteModule.init();
    LocalStorageModule.init();
    LocalSpawnModule.init();
    LocalExtensionModule.init();
    LocalRoadModule.init();
    LocalWallModule.init();
    LocalRampartModule.init();
    LocalTowerModule.init();
}
