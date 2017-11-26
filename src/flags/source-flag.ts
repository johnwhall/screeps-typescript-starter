import { nextFlagUid } from "./flag";

export interface SourceFlag {}

export function createSourceFlag(pos: RoomPosition, assignedRoomName: string): void {
    pos.createFlag(`source ${assignedRoomName} ${nextFlagUid}`, COLOR_WHITE, COLOR_WHITE);
}
