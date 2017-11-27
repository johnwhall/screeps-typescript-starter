import { Remotable } from "../remotables/remotable";

export abstract class Local<T extends RoomObject> implements Remotable<T> {
    readonly liveObject: T;

    constructor(liveObject: T) {
        this.liveObject = liveObject;
    }

    get pos(): RoomPosition { return this.liveObject.pos; }
    get room(): Room | undefined { return this.liveObject.room; }

    toString(): string {
        let lits = this.liveObject.toString();
        return `[local ${lits.slice(1)}`;
    }

    save(): any { return `id:${(<any>this.liveObject).id}`; }

    static load(obj: any): Local<RoomObject> {
        if (typeof obj != "string") throw new Error(`Cannot load local from ${obj}`);
        if (obj.slice(0, 3) != "id:") throw new Error(`Cannot load local from ${obj}`);
        let gameObj: RoomObject | null = Game.getObjectById(obj.slice(3));
        if (gameObj == null) throw new Error(`Could not find game object ${obj.slice(3)}`);
        return <Local<RoomObject>>gameObj.remotable;
    }
}
