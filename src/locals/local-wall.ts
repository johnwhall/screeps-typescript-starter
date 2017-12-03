import { LocalStructure } from "./local-structure";
import { RemotableWall } from "../remotables/remotable";

export class LocalWall extends LocalStructure<StructureWall, STRUCTURE_WALL> implements RemotableWall {
    readonly type = STRUCTURE_WALL;

    constructor(liveObject: StructureWall) {
        super(liveObject);
    }
}

export function init() {
    if (!StructureWall.prototype.remotable) {
        Object.defineProperty(StructureWall.prototype, "remotable", {
            get: function () {
                if (this._remotable === undefined) this._remotable = new LocalWall(this);
                return this._remotable;
            },
            set: function(remotable: RemotableWall) {
                this._remotable = remotable;
            }
        });
    }
}
