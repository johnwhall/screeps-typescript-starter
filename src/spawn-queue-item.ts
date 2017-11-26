import { Caste } from "./caste";

export class SpawnQueueItem {
    readonly caste: Caste;
    readonly homeRoomName: string;
    readonly parts: BodyPartConstant[];
    readonly memory: CreepMemory;
    readonly cost: number;

    constructor(caste: Caste, homeRoomName: string, parts: BodyPartConstant[], memory?: CreepMemory) {
        this.caste = caste;
        this.homeRoomName = homeRoomName;
        this.parts = parts;
        this.memory = _.assign(memory || {}, { caste: caste, homeRoom: homeRoomName });
        this.cost = _.sum(parts, (p) => BODYPART_COST[p]);
    }
}
