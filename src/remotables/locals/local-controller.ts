import { LocalStructure } from "./local-structure";
import { RemotableController } from "../remotable";

export class LocalController extends LocalStructure<StructureController, STRUCTURE_CONTROLLER> implements RemotableController {
    readonly type = STRUCTURE_CONTROLLER;
    claimPlanned: boolean = true; // assumes local means we own it

    constructor(liveObject: StructureController) { super(liveObject); }
    get my(): boolean { return this.liveObject.my; }
    get reservation(): ReservationDefinition { return this.liveObject.reservation; }
}

export function init() {
    if (!StructureController.prototype.remotable) {
        Object.defineProperty(StructureController.prototype, "remotable", {
            get: function () {
                if (this._remotable === undefined) this._remotable = new LocalController(this);
                return this._remotable;
            },
            set: function(remotable: RemotableController) {
                this._remotable = remotable;
            }
        });
    }
}
