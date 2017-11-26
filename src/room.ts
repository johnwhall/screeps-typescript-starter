import { SpawnQueueItem } from "./spawn-queue-item";
import { Caste, selectParts } from "./caste";

declare global {
    interface Room {
        readonly assignedCreeps: Creep[],
        readonly spawningCreeps: Creep[],
        readonly assignedFlags: Flag[],
        spawnQueue: SpawnQueueItem[];
        assignedCreepsForCaste(caste: Caste): Creep[],
        casteTarget(caste: Caste, newTarget?: number): number;
        queueFromTargets(): void;
        spawnFromQueue(): void;
    }
}

export function init() {
    if (!Room.prototype.assignedCreeps) {
        Object.defineProperty(Room.prototype, "assignedCreeps", {
            get: function() {
                if (this._assignedCreeps === undefined) this._assignedCreeps = _.filter(Game.creeps, (c) => !c.spawning && c.homeRoom == this);
                return this._assignedCreeps;
            }
        });
    }

    if (!Room.prototype.spawningCreeps) {
        Object.defineProperty(Room.prototype, "spawningCreeps", {
            get: function() {
                if (this._spawningCreeps === undefined) this._spawningCreeps = _.filter(Game.creeps, (c) => c.spawning && c.homeRoom == this);
                return this._spawningCreeps;
            }
        });
    }

    if (!Room.prototype.assignedCreepsForCaste) {
        Room.prototype.assignedCreepsForCaste = function(caste: Caste): Creep[] {
            if (this._assignedCreepsForCaste === undefined) this._assignedCreepsForCaste = _.groupBy(this.assignedCreeps, "caste");
            return this._assignedCreepsForCaste[caste];
        }
    }

    if (!Room.prototype.assignedFlags) {
        Object.defineProperty(Room.prototype, "assignedFlags", {
            get: function() {
                if (this._assignedFlags === undefined) this._assignedFlags = _.filter(Game.flags, (f) => f.room == this && !f.removed);
                return this._assignedFlags;
            }
        });
    }

    if (!Room.prototype.spawnQueue) {
        Object.defineProperty(Room.prototype, "spawnQueue", {
            get: function() {
                if (this._spawnQueue === undefined) this._spawnQueue = this.memory.spawnQueue || [];
                return this._spawnQueue;
            },
            set: function(spawnQueue: SpawnQueueItem[]) {
                this.memory.spawnQueue = this._spawnQueue = spawnQueue;
            }
        });
    }

    if (!Room.prototype.casteTarget) {
        Room.prototype.casteTarget = function(caste: Caste, newTarget?: number): number {
            if (newTarget !== undefined && newTarget < 0) throw new Error(`Attempted to set negative target ${newTarget} for caste ${caste}`);
            if (this._casteTargets === undefined) this._casteTargets = this.memory.casteTargets || {};
            if (newTarget !== undefined) { this._casteTargets[caste] = newTarget; this.memory.casteTargets = this._casteTargets; }
            else if (this._casteTargets[caste] === undefined) { this._casteTargets[caste] = 0; this.memory.casteTargets = this._casteTargets; }
            return this._casteTargets[caste];
        }
    }

    if (!Room.prototype.queueFromTargets) {
        Room.prototype.queueFromTargets = function() {
            if (this.memory.spawnQueue === undefined) this.memory.spawnQueue = [];
            let ownedCreeps = _.groupBy(_.filter(Game.creeps, (c) => c.homeRoom == this), (c) => c.caste);
            let queuedCreeps = _.groupBy(_.filter(<SpawnQueueItem[]>this.spawnQueue, (sqi) => sqi.homeRoomName == this.name), (sqi) => sqi.caste);
            _.forEach(Caste, (caste) => {
                let target = this.casteTarget(caste);
                let ownedOrQueuedCount = (ownedCreeps[caste] || []).length + (queuedCreeps[caste] || []).length;
                if (ownedOrQueuedCount < target) {
                    let sqi = new SpawnQueueItem(caste, this.name, selectParts(caste, this.energyCapacityAvailable));
                    this.spawnQueue.push(sqi);
                    if (queuedCreeps[caste] === undefined) queuedCreeps[caste] = [];
                    queuedCreeps[caste].push(sqi);
                    console.log(`Queued new ${caste} for ${sqi.homeRoomName}: ${sqi.parts} (cost: ${sqi.cost})`);
                }
            });
        }
    }

    if (!Room.prototype.spawnFromQueue) {
        Room.prototype.spawnFromQueue = function() {
            if (this.spawnQueue.length == 0) return;
            _.forEach(this.find(FIND_MY_SPAWNS), (spawn: Spawn) => {
                let item: SpawnQueueItem = this.spawnQueue[0];
                let name = `${item.caste.toLowerCase().replace("_", " ")} ${Game.time}`;
                if (spawn.spawnCreep(item.parts, name, { memory: item.memory }) == OK) {
                    console.log(`Room ${this.name} spawning new ${item.caste}: ${name} - ${item.parts} (cost: ${item.cost})`);
                    this.memory.spawnQueue.splice(0, 1);
                    return false;
                }
            });
        }
    }
}
