import { Local } from "./local";
import { RemotableStructure } from "../remotables/remotable";

export class LocalStructure<S extends Structure, T extends StructureConstant> extends Local<S> implements RemotableStructure<S, T> {
    plannedHits: number;

    constructor(liveObject: S) {
        super(liveObject);
        this.plannedHits = this.liveObject.hits;
    }

    get hits(): number { return this.liveObject.hits; }
    get hitsMax(): number { return this.liveObject.hitsMax; }
    get structureType(): T { return <T>this.liveObject.structureType; }
}
