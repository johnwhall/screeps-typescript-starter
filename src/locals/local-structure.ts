import { Local } from "./local";
import { RemotableStructure, RemotableType } from "../remotables/remotable";

export abstract class LocalStructure<S extends Structure, T extends StructureConstant> extends Local<S> implements RemotableStructure<S, T> {
    abstract readonly type: RemotableType;
    plannedHits: number;

    constructor(liveObject: S) {
        super(liveObject);
        this.plannedHits = this.liveObject.hits;
    }

    get hits(): number { return this.liveObject.hits; }
    get hitsMax(): number { return this.liveObject.hitsMax; }
    get structureType(): T { return <T>this.liveObject.structureType; }
}
