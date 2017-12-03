import { RemoteStructure } from "./remote-structure";
import { RemotableRampart } from "../remotable";

export class RemoteRampart extends RemoteStructure<StructureRampart, STRUCTURE_RAMPART> implements RemotableRampart {
    readonly type = STRUCTURE_RAMPART;
    readonly structureType: STRUCTURE_RAMPART = STRUCTURE_RAMPART;
    private _liveObject: StructureRampart;

    get liveObject(): StructureRampart | undefined {
        if (this._liveObject === undefined && this.room !== undefined) {
            this._liveObject = <StructureRampart>this.pos.lookFor(LOOK_STRUCTURES).filter((s: RoomObject) => (<Structure>s).structureType == STRUCTURE_RAMPART)[0];
        }
        return this._liveObject;
    }
}
