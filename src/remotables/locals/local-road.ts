import { LocalStructure } from "./local-structure";
import { RemotableRoad } from "../remotable";

export class LocalRoad extends LocalStructure<StructureRoad, STRUCTURE_ROAD> implements RemotableRoad {
    readonly type = STRUCTURE_ROAD;

    constructor(liveObject: StructureRoad) {
        super(liveObject);
    }
}

export function init() {
    if (!StructureRoad.prototype.remotable) {
        Object.defineProperty(StructureRoad.prototype, "remotable", {
            get: function () {
                if (this._remotable === undefined) this._remotable = new LocalRoad(this);
                return this._remotable;
            },
            set: function(remotable: RemotableRoad) {
                this._remotable = remotable;
            }
        });
    }
}
