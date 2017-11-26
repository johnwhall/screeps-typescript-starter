import { RemoteStructure } from "./remote-structure";

export class RemoteContainer extends RemoteStructure<StructureContainer> {
    private _liveObject: StructureContainer;

    get energy() : number {
        return this.flag.memory.lastKnownEnergy;
    }

    get energyCapacity() : number {
        return this.flag.memory.lastKnownEnergyCapacity;
    }

    get liveObject() : StructureContainer|undefined {
        if (this.room == undefined) return undefined;
        else return this._liveObject = <StructureContainer>this.pos.lookFor(LOOK_STRUCTURES).filter((s: RoomObject) => (<Structure>s).structureType == STRUCTURE_CONTAINER)[0];
    }

    update(): void {
        if (this.liveObject == undefined) return;
        this.flag.memory.lastKnownEnergy = this.liveObject.store[RESOURCE_ENERGY];
        this.flag.memory.lastKnownEnergyCapacity = this.liveObject.storeCapacity - _.sum(this.liveObject.store) + this.liveObject.store[RESOURCE_ENERGY];
    }

    shouldRemove(): boolean { return false; }

    toString(): string {
        if (this.liveObject) return this.liveObject.toString();
        else return `[invisible container at ${this.pos}]`;
    }
}
