import { Remotable } from "./remotable";

export abstract class Remote<T extends RoomObject> implements RoomObject, Remotable<T> {
    abstract liveObject: T | undefined;
    abstract update(): void;

    prototype: RoomObject;
    readonly flag: Flag;

    constructor (flag: Flag) {
        this.flag = flag;
    }

    get pos(): RoomPosition { return this.flag.pos; }

    get room(): Room | undefined {
        return Game.rooms[this.pos.roomName];
    }
}
