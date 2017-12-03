import { SpawnQueueItem } from "./spawn-queue-item";
import { Caste, selectParts } from "./caste";
import { RemotableSource, RemotableContainer, RemotableConstructionSite, RemotableSpawn, RemotableExtension, RemotableStructure, RemotableRampart, RemotableWall, RemotableTower } from "./remotables/remotable";
import { FlagType } from "./flags/flag";
import { nextUuid } from "./utils";

declare global {
    interface Room {
        readonly assignedCreeps: {[C in Caste]: Creep[]};
        readonly spawningCreeps: Creep[];
        readonly assignedFlags: Flag[];
        readonly assignedSources: RemotableSource[];
        readonly assignedContainers: RemotableContainer[];
        readonly assignedConstructionSites: RemotableConstructionSite[];
        readonly spawns: RemotableSpawn[];
        readonly extensions: RemotableExtension[];
        readonly towers: RemotableTower[];
        readonly assignedStructures: RemotableStructure[];
        readonly assignedWalls: RemotableWall[];
        readonly assignedRamparts: RemotableRampart[];
        spawnQueue: SpawnQueueItem[];
        rampWallUnderRepair: boolean;
        assignedFlagRemoved(flag: Flag): void;
        casteTarget(caste: Caste, newTarget?: number): number;
        queueFromTargets(): void;
        spawnFromQueue(): void;
    }
}

export function init() {
    if (!Room.prototype.assignedCreeps) {
        Object.defineProperty(Room.prototype, "assignedCreeps", {
            get: function () {
                if (this._assignedCreeps === undefined) {
                    let creeps = <{[C in Caste]: Creep[]}>_.reduce(_.keys(Caste), (acc, c) => { (<any>acc)[c] = []; return acc; }, {});
                    _.forEach(Game.creeps, (c) => { if (!c.spawning && c.homeRoom == this) creeps[c.caste].push(c) });
                    this._assignedCreeps = creeps;
                }
                return this._assignedCreeps;
            }
        });
    }

    if (!Room.prototype.spawningCreeps) {
        Object.defineProperty(Room.prototype, "spawningCreeps", {
            get: function () {
                if (this._spawningCreeps === undefined) this._spawningCreeps = _.filter(Game.creeps, (c) => c.spawning && c.homeRoom == this);
                return this._spawningCreeps;
            }
        });
    }

    if (!Room.prototype.assignedFlags) {
        Object.defineProperty(Room.prototype, "assignedFlags", {
            get: function () {
                if (this._assignedFlags === undefined) {
                    return _.filter(Game.flags, (f) => f.room == this && !f.removed);
                }
                return this._assignedFlags;
            }
        });
    }

    if (!Room.prototype.assignedFlagRemoved) {
        Room.prototype.assignedFlagRemoved = function (flag: Flag): void {
            // Only handle this if _assignedFlags has been loaded
            // If it hasn't been loaded yet, Flag.removed will prevent removed flags from being loaded
            if (this._assignedFlags !== undefined) {
                let idx = this._assignedFlags.indexOf(flag);
                if (idx >= 0) this._assignedFlags.splice(idx, 1);
            }
        }
    }

    if (!Room.prototype.assignedSources) {
        Object.defineProperty(Room.prototype, "assignedSources", {
            get: function () {
                if (this._assignedSources === undefined) {
                    // TODO: call reduce instead - this eliminates the need for the temporary list (the result of this.find(...))
                    let roomSources = _.pluck(this.find(FIND_SOURCES), "remotable");
                    let flagSources = _.pluck(this.assignedFlags.filter((f: Flag) => f.type == FlagType.FLAG_SOURCE), "remote");
                    this._assignedSources = _.unique(roomSources.concat(flagSources));
                }
                return this._assignedSources;
            },
        });
    }

    if (!Room.prototype.assignedContainers) {
        Object.defineProperty(Room.prototype, "assignedContainers", {
            get: function () {
                if (this._assignedContainers === undefined) {
                    // TODO: call reduce instead - this eliminates the need for the temporary list (the result of this.find(...))
                    let roomContainers = _.pluck(this.find(FIND_STRUCTURES, { filter: (s: Structure) => s.structureType === STRUCTURE_CONTAINER }), "remotable");
                    let flagContainers = _.pluck(this.assignedFlags.filter((f: Flag) => f.type === FlagType.FLAG_STRUCTURE && f.structureType === STRUCTURE_CONTAINER), "remote");
                    this._assignedContainers = _.unique(roomContainers.concat(flagContainers));
                }
                return this._assignedContainers;
            },
        });
    }

    if (!Room.prototype.assignedConstructionSites) {
        Object.defineProperty(Room.prototype, "assignedConstructionSites", {
            get: function () {
                if (this._assignedConstructionSites === undefined) {
                    // TODO: call reduce instead - this eliminates the need for the temporary list (the result of this.find(...))
                    let roomConstructionSites = _.pluck(this.find(FIND_MY_CONSTRUCTION_SITES), "remotable");
                    let flagConstructionSites = _.pluck(this.assignedFlags.filter((f: Flag) => f.type === FlagType.FLAG_CONSTRUCTION_SITE), "remote");
                    this._assignedConstructionSites = _.unique(roomConstructionSites.concat(flagConstructionSites));
                }
                return this._assignedConstructionSites;
            },
        });
    }

    if (!Room.prototype.spawns) {
        Object.defineProperty(Room.prototype, "spawns", {
            get: function() {
                if (this._spawns === undefined) this._spawns = _.pluck(this.find(FIND_MY_SPAWNS), "remotable");
                return this._spawns;
            }
        });
    }

    if (!Room.prototype.extensions) {
        Object.defineProperty(Room.prototype, "extensions", {
            get: function() {
                if (this._extensions === undefined) {
                    this._extensions = _.pluck(this.find(FIND_MY_STRUCTURES, { filter: (s: Structure) => s.structureType === STRUCTURE_EXTENSION }), "remotable");
                }
                return this._extensions;
            }
        });
    }

    if (!Room.prototype.towers) {
        Object.defineProperty(Room.prototype, "towers", {
            get: function() {
                if (this._towers === undefined) {
                    this._towers = _.pluck(this.find(FIND_MY_STRUCTURES, { filter: (s: Structure) => s.structureType === STRUCTURE_TOWER }), "remotable");
                }
                return this._towers;
            }
        });
    }

    if (!Room.prototype.assignedStructures) {
        Object.defineProperty(Room.prototype, "assignedStructures", {
            get: function() {
                if (this._assignedStructures === undefined) {
                    const implementedTypes = [ STRUCTURE_CONTAINER, STRUCTURE_CONTROLLER, STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_STORAGE, STRUCTURE_ROAD, STRUCTURE_WALL, STRUCTURE_RAMPART, STRUCTURE_TOWER ];
                    let roomStructures = _.pluck(this.find(FIND_STRUCTURES, { filter: (s: Structure) => _.contains(implementedTypes, s.structureType) }), "remotable");
                    let flagStructures = _.pluck(this.assignedFlags.filter((f: Flag) => f.type === FlagType.FLAG_STRUCTURE && _.contains(implementedTypes, f.structureType)), "remote");
                    this._assignedStructures = _.unique(roomStructures.concat(flagStructures));
                }
                return this._assignedStructures;
            }
        });
    }

    if (!Room.prototype.assignedWalls) {
        Object.defineProperty(Room.prototype, "assignedWalls", {
            get: function() {
                if (this._assignedWalls === undefined) this._assignedWalls = _.filter(<RemotableStructure[]>this.assignedStructures, (s) => s.structureType === STRUCTURE_WALL);
                return this._assignedWalls;
            }
        });
    }

    if (!Room.prototype.assignedRamparts) {
        Object.defineProperty(Room.prototype, "assignedRamparts", {
            get: function() {
                if (this._assignedRamparts === undefined) this._assignedRamparts = _.filter(<RemotableStructure[]>this.assignedStructures, (s) => s.structureType === STRUCTURE_RAMPART);
                return this._assignedRamparts;
            }
        });
    }

    if (!Room.prototype.spawnQueue) {
        Object.defineProperty(Room.prototype, "spawnQueue", {
            get: function () {
                if (this._spawnQueue === undefined) this._spawnQueue = this.memory.spawnQueue || [];
                return this._spawnQueue;
            },
            set: function (spawnQueue: SpawnQueueItem[]) {
                this.memory.spawnQueue = this._spawnQueue = spawnQueue;
            }
        });
    }

    if (!Room.prototype.rampWallUnderRepair) {
        Object.defineProperty(Room.prototype, "rampWallUnderRepair", {
            get: function () {
                return this._rampWallUnderRepair || false;
            },
            set: function (rampWallUnderRepair: boolean) {
                this._rampWallUnderRepair = rampWallUnderRepair;
            }
        });
    }

    if (!Room.prototype.casteTarget) {
        Room.prototype.casteTarget = function (caste: Caste, newTarget?: number): number {
            if (newTarget !== undefined && newTarget < 0) throw new Error(`Attempted to set negative target ${newTarget} for caste ${caste}`);
            if (this._casteTargets === undefined) this._casteTargets = this.memory.casteTargets || {};
            if (newTarget !== undefined) { this._casteTargets[caste] = newTarget; this.memory.casteTargets = this._casteTargets; }
            else if (this._casteTargets[caste] === undefined) { this._casteTargets[caste] = 0; this.memory.casteTargets = this._casteTargets; }
            return this._casteTargets[caste];
        }
    }

    if (!Room.prototype.queueFromTargets) {
        Room.prototype.queueFromTargets = function () {
            if (this.memory.spawnQueue === undefined) this.memory.spawnQueue = [];
            let ownedCreeps = _.groupBy(_.filter(Game.creeps, (c) => c.homeRoom == this), (c) => c.caste);
            let queuedCreeps = _.groupBy(_.filter(<SpawnQueueItem[]>this.spawnQueue, (sqi) => sqi.homeRoomName == this.name), (sqi) => sqi.caste);
            _.forEach(Caste, (caste) => {
                let target = this.casteTarget(caste);
                let ownedOrQueuedCount = (ownedCreeps[caste] || []).length + (queuedCreeps[caste] || []).length;
                while (ownedOrQueuedCount < target) {
                    let sqi = new SpawnQueueItem(caste, this.name, selectParts(caste, this.energyCapacityAvailable));
                    this.spawnQueue.push(sqi);
                    if (queuedCreeps[caste] === undefined) queuedCreeps[caste] = [];
                    ownedOrQueuedCount++;
                    console.log(`Queued new ${caste} for ${sqi.homeRoomName}: ${sqi.parts} (cost: ${sqi.cost})`);
                }
            });
        }
    }

    if (!Room.prototype.spawnFromQueue) {
        Room.prototype.spawnFromQueue = function () {
            if (this.spawnQueue.length == 0) return;
            _.forEach(this.find(FIND_MY_SPAWNS), (spawn: Spawn) => {
                let item: SpawnQueueItem = this.spawnQueue[0];
                if (!item) return;
                let name = `${item.caste.toLowerCase().replace("_", " ")} ${nextUuid()}`;
                if (spawn.spawnCreep(item.parts, name, { memory: item.memory }) == OK) {
                    console.log(`Room ${this.name} spawning new ${item.caste}: ${name} - ${item.parts} (cost: ${item.cost})`);
                    this.memory.spawnQueue.splice(0, 1);
                    return false;
                }
            });
        }
    }
}
