import { Remotable } from "../remotables/remotable";

export abstract class Remote<T extends RoomObject> implements Remotable<T> {
    abstract liveObject: T | undefined;
    abstract shouldRemove(): boolean;
    abstract toString(): string;

    readonly flag: Flag;

    constructor (flag: Flag) {
        this.flag = flag;
    }

    get pos(): RoomPosition { return this.flag.pos; }

    get room(): Room | undefined {
        return Game.rooms[this.pos.roomName];
    }

    update(): void { this.associate(); } // TODO: these objects are being recreated every tick anyway; why not just update in the constructor?

    associate(): void {
        if (this.liveObject !== undefined) (<any>this.liveObject).remotable = this;
    }
}
