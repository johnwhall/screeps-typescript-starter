import { RemoteStructure } from "./remote-structure";
import { RemotableController } from "../remotables/remotable";
import { LocalController } from "../locals/local-controller";

// Controllers are either visible or not mine (in which case, the remote should be deleted), so this is just a wrapper for a LocalController
export class RemoteController extends RemoteStructure<StructureController, STRUCTURE_CONTROLLER> implements RemotableController {
    readonly structureType: STRUCTURE_CONTROLLER = STRUCTURE_CONTROLLER;
    private _local: LocalController;

    constructor(flag: Flag) {
        super(flag);
        let liveObject = flag.room ? flag.room.controller : undefined;
        if (liveObject !== undefined) this._local = new LocalController(liveObject);
    }

    get liveObject(): StructureController { return this._local.liveObject; }
    get my(): boolean { return this._local.liveObject.my; }
    shouldRemove(): boolean { return this._local === undefined || !this._local.my; }
    update(): void { super.update(); }
    toString(): string { return `[remote ${this._local.toString().slice(1)}`; }
}
