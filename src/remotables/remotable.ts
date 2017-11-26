export interface Remotable<T extends RoomObject> {
    readonly liveObject: T | undefined;
    readonly pos: RoomPosition;
    readonly room: Room | undefined;
    // save(): any;
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
    interface Source { remotable: RemotableSource; }
    interface ConstructionSite { remotable: RemotableConstructionSite; }
    interface StructureContainer { remotable: RemotableContainer; }
}
