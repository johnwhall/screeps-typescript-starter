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

    // save(): any { return `id:${(<any>this.liveObject).id}`; }
}
