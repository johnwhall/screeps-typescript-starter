import { RemoteStructure } from "./remote-structure";
import { RemotableRoad } from "../remotable";

export class RemoteRoad extends RemoteStructure<StructureRoad, STRUCTURE_ROAD> implements RemotableRoad {
    readonly type = STRUCTURE_ROAD;
    readonly structureType: STRUCTURE_ROAD = STRUCTURE_ROAD;
    private _liveObject: StructureRoad;

    get liveObject(): StructureRoad | undefined {
        if (this._liveObject === undefined && this.room !== undefined) {
            this._liveObject = <StructureRoad>this.pos.lookFor(LOOK_STRUCTURES).filter((s: RoomObject) => (<Structure>s).structureType == STRUCTURE_ROAD)[0];
        }
        return this._liveObject;
    }
}
