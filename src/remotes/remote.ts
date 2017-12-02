import { Remotable, RemotableType } from "../remotables/remotable";

export abstract class Remote<T extends RoomObject> implements Remotable<T> {
    abstract type: RemotableType;
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

    get assignedRoom(): Room | undefined { return this.flag.assignedRoom; }

    update(): void { this.associate(); } // TODO: these objects are being recreated every tick anyway; why not just update in the constructor?

    associate(): void {
        if (this.liveObject !== undefined) (<any>this.liveObject).remotable = this;
    }

    save(): any { return `flag:${this.flag.name}`; }

    static load(obj: any): Remote<RoomObject> | undefined {
        if (typeof obj != "string") throw new Error(`Cannot load remote from ${obj}`);
        if (obj.slice(0, 5) != "flag:") throw new Error(`Cannot load remote from ${obj}`);
        let flag: Flag | undefined = Game.flags[obj.slice(5)];
        if (flag == undefined) return undefined;
        return flag.remote;
    }
}
