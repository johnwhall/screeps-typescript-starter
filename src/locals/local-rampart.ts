import { LocalStructure } from "./local-structure";
import { RemotableRampart } from "../remotables/remotable";

export class LocalRampart extends LocalStructure<StructureRampart, STRUCTURE_RAMPART> implements RemotableRampart {
    readonly type = STRUCTURE_RAMPART;

    constructor(liveObject: StructureRampart) {
        super(liveObject);
    }
}

export function init() {
    if (!StructureRampart.prototype.remotable) {
        Object.defineProperty(StructureRampart.prototype, "remotable", {
            get: function () {
                if (this._remotable === undefined) this._remotable = new LocalRampart(this);
                return this._remotable;
            },
            set: function(remotable: RemotableRampart) {
                this._remotable = remotable;
            }
        });
    }
}
