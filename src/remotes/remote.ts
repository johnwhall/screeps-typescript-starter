export abstract class Remote<T extends RoomObject> {
    abstract liveObject: T | undefined;
    abstract update(): void;
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
}
