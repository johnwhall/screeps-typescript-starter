import { Remote } from "../remotes/remote";
import { Local } from "../locals/local";

export declare const REMOTABLE_TYPE_SOURCE = "source";
export declare const REMOTABLE_TYPE_CONSTRUCTION_SITE = "source";
export declare type RemotableType = "source" | StructureConstant | "constructionSite";

export interface Remotable<T extends RoomObject> {
    readonly type: RemotableType;
    readonly liveObject: T | undefined;
    readonly pos: RoomPosition;
    readonly room: Room | undefined;
    save(): any;
}

declare type RemotableEnergyStoreTypes = Source | StructureContainer | StructureStorage | StructureSpawn | StructureExtension;

export interface RemotableEnergyStore<T extends RemotableEnergyStoreTypes = RemotableEnergyStoreTypes> extends Remotable<T>{
    readonly energy: number;
    readonly energyCapacity: number;
    availableEnergyForPickup: number;
    plannedEnergyWithIncoming: number;
}

export interface RemotableSource extends Remotable<Source>, RemotableEnergyStore<Source> {
    covered: boolean;
    container: RemotableContainer | undefined;
}

export interface RemotableConstructionSite extends Remotable<ConstructionSite> {
    readonly progress: number;
    readonly progressTotal: number;
    plannedProgress: number;
    readonly structureType: StructureConstant;
}

export interface RemotableStructure<S extends Structure = Structure, T extends StructureConstant = StructureConstant> extends Remotable<S> {
    readonly hits: number;
    readonly hitsMax: number;
    plannedHits: number;
    readonly structureType: T;
}

export interface RemotableContainer extends RemotableStructure<StructureContainer, STRUCTURE_CONTAINER>, RemotableEnergyStore<StructureContainer> {
    store: StoreDefinition;
    storeCapacity: number;
    source: RemotableSource | undefined;
}

export interface RemotableSpawn extends RemotableStructure<StructureSpawn, STRUCTURE_SPAWN>, RemotableEnergyStore<StructureSpawn> {}
export interface RemotableExtension extends RemotableStructure<StructureExtension, STRUCTURE_EXTENSION>, RemotableEnergyStore<StructureExtension> {}
export interface RemotableRoad extends RemotableStructure<StructureRoad, STRUCTURE_ROAD> {}
export interface RemotableWall extends RemotableStructure<StructureWall, STRUCTURE_WALL> {}
export interface RemotableRampart extends RemotableStructure<StructureRampart, STRUCTURE_RAMPART> {}

export interface RemotableStorage extends RemotableStructure<StructureStorage, STRUCTURE_STORAGE>, RemotableEnergyStore<StructureStorage> {
    store: StoreDefinition;
    storeCapacity: number;
}

export interface RemotableController extends RemotableStructure<StructureController, STRUCTURE_CONTROLLER> {
    readonly my: boolean;
}

declare global {
    interface RoomObject { remotable: Remotable<RoomObject>; }
    interface Source { remotable: RemotableSource; }
    interface ConstructionSite { remotable: RemotableConstructionSite; }
    interface StructureContainer { remotable: RemotableContainer; }
    interface StructureController { remotable: RemotableController; }
    interface StructureStorage { remotable: RemotableStorage; }
    interface StructureSpawn { remotable: RemotableSpawn; }
}

export function isRemotableSource(remotable: RemotableEnergyStore): remotable is RemotableSource {
    return (<RemotableSource>remotable).covered !== undefined; // TODO: use type member
}

export function load(obj: any, expectedTypes: RemotableType[]): Remotable<RoomObject> | undefined {
    if (typeof obj != "string") throw new Error(`Cannot load remotable from ${obj}`);
    if (obj.slice(0, 5) == "flag:") var remotable: Remotable<RoomObject> | undefined = Remote.load(obj);
    else if (obj.slice(0, 3) == "id:") var remotable: Remotable<RoomObject> | undefined = Local.load(obj);
    else throw new Error(`Cannot load remotable from ${obj}`);
    if (remotable === undefined) return undefined;
    if (!_.contains(expectedTypes, remotable.type)) throw new Error(`Incorrect type for remotable ${remotable}. Expected ${expectedTypes}`);
    return remotable;
}
