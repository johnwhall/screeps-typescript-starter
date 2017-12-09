import { RemoteStructure } from "./remote-structure";
import { RemotableController } from "../remotable";

interface ReservationInfo {
    reservation: ReservationDefinition;
    lastUpdateTime: number;
}

export class RemoteController extends RemoteStructure<StructureController, STRUCTURE_CONTROLLER> implements RemotableController {
    readonly type = STRUCTURE_CONTROLLER;
    readonly structureType: STRUCTURE_CONTROLLER = STRUCTURE_CONTROLLER;
    claimPlanned: boolean = false;

    get liveObject(): StructureController | undefined {
        if (this.room === undefined) return undefined;
        else return this.room.controller;
    }

    get my(): boolean { return this.liveObject ? this.liveObject.my : false; } // TODO: test - this is undefined if controller is neither owned nor reserved

    get reservation(): ReservationDefinition | undefined {
        let info: ReservationInfo | undefined = this.flag.memory.reservationInfo;
        if (info === undefined) return undefined;
        let ticksSinceUpdate = Game.time - info.lastUpdateTime;
        if (ticksSinceUpdate >= info.reservation.ticksToEnd) return undefined;
        return { username: info.reservation.username, ticksToEnd: info.reservation.ticksToEnd - ticksSinceUpdate };
    }

    update(): void {
        super.update();
        if (this.liveObject && this.liveObject.reservation) this.flag.memory.reservationInfo = { lastUpdateTime: Game.time, reservation: this.liveObject.reservation }
    }
}
