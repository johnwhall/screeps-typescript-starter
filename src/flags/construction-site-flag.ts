import { nextFlagUid } from "./flag";

export interface ConstructionSiteFlag {}

export function createConstructionSiteFlag(pos: RoomPosition, assignedRoomName: string): void {
    let cs = <ConstructionSite>pos.lookFor(LOOK_CONSTRUCTION_SITES)[0];
    pos.createFlag(`construction ${cs.structureType} ${assignedRoomName} ${nextFlagUid()}`, COLOR_WHITE, COLOR_WHITE);
}
