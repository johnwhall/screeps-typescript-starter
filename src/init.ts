import * as FlagModule from "./flags/flag";
import * as StructureFlagModule from "./flags/structure-flag";
import * as CreepModule from "./creep";
import * as ConstructionSiteModule from "./construction-site";
import * as RoomModule from "./room";
import * as LocalSourceModule from "./locals/local-source";
import * as LocalContainerModule from "./locals/local-container";
import * as LocalConstructionSiteModule from "./locals/local-construction-site";

export function init() {
    FlagModule.init();
    StructureFlagModule.init();
    CreepModule.init();
    ConstructionSiteModule.init();
    RoomModule.init();
    LocalSourceModule.init();
    LocalContainerModule.init();
    LocalConstructionSiteModule.init();
}
