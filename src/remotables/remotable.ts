import { Remote } from "../remotes/remote";
import { Local } from "../locals/local";

export interface Remotable<T extends RoomObject> {
    readonly liveObject: T | undefined;
    readonly pos: RoomPosition;
    readonly room: Room | undefined;
    save(): any;
}

export interface RemotableEnergySource {
    readonly energy: number;
    readonly energyCapacity: number;
    plannedEnergy: number;
}

export interface RemotableSource extends Remotable<Source>, RemotableEnergySource {
    covered: boolean;
}

export interface RemotableConstructionSite extends Remotable<ConstructionSite> {
    readonly progress: number;
    readonly progressTotal: number;
    plannedProgress: number;
    readonly structureType: StructureConstant;
}

export interface RemotableStructure<S extends Structure, T extends StructureConstant = StructureConstant> extends Remotable<S> {
    readonly hits: number;
    readonly hitsMax: number;
    plannedHits: number;
    readonly structureType: T;
}

export interface RemotableContainer extends RemotableStructure<StructureContainer, STRUCTURE_CONTAINER>, RemotableEnergySource {
    store: StoreDefinition;
    storeCapacity: number;
}

declare global {
    interface RoomObject { remotable: Remotable<RoomObject>; }
    interface Source { remotable: RemotableSource; }
    interface ConstructionSite { remotable: RemotableConstructionSite; }
    interface StructureContainer { remotable: RemotableContainer; }
}

export function load(obj: any): Remotable<RoomObject> {
    if (typeof obj != "string") throw new Error(`Cannot load remotable from ${obj}`);
    if (obj.slice(0, 5) == "flag:") return Remote.load(obj);
    else if (obj.slice(0, 3) == "id:") return Local.load(obj);
    else throw new Error(`Cannot load remotable from ${obj}`);
}
