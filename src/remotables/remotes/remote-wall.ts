import { RemoteStructure } from "./remote-structure";
import { RemotableWall } from "../remotable";

export class RemoteWall extends RemoteStructure<StructureWall, STRUCTURE_WALL> implements RemotableWall {
    readonly type = STRUCTURE_WALL;
    readonly structureType: STRUCTURE_WALL = STRUCTURE_WALL;
    private _liveObject: StructureWall;

    get liveObject(): StructureWall | undefined {
        if (this._liveObject === undefined && this.room !== undefined) {
            this._liveObject = <StructureWall>this.pos.lookFor(LOOK_STRUCTURES).filter((s: RoomObject) => (<Structure>s).structureType == STRUCTURE_WALL)[0];
        }
        return this._liveObject;
    }
}
