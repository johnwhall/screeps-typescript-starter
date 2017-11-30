import { log } from "./lib/logger/log";
import { Caste } from "./caste";
import { Job } from "./jobs/job";
import { loadJob } from "./jobs/job-loader";

declare global {
    interface Creep {
        readonly caste: Caste;
        readonly freeCapacity: number;
        homeRoom: Room | undefined;
        job: Job | undefined;
        doJob(): void;
    }
}

export function init() {
    if (!Creep.prototype.caste) {
        Object.defineProperty(Creep.prototype, "caste", {
            get: function () {
                if (this._caste === undefined) this._caste = Caste[this.memory.caste];
                return this._caste;
            },
        });
    }

    if (!Creep.prototype.freeCapacity) {
        Object.defineProperty(Creep.prototype, "freeCapacity", {
            get: function () {
                if (this._freeCapacity === undefined) this._freeCapacity = this.carryCapacity - _.sum(this.carry);
                return this._freeCapacity;
            },
        });
    }

    if (!Creep.prototype.doJob) {
        Creep.prototype.doJob = function () {
            if (this.spawning || this.job === undefined) return;
            try {
                if (!this.job.run()) {
                    // job finished
                    delete this.job; // TOD: why does this.job work? shouldn't it be this._job?
                    delete this.memory.job;
                }
            } catch (e) {
                log.logException(e);
                delete this.job; // TOD: why does this.job work? shouldn't it be this._job?
                delete this.memory.job;
            }
        }
    }

    if (!Creep.prototype.job) {
        Object.defineProperty(Creep.prototype, "job", {
            get: function () {
                if (this._job === undefined && this.memory.job) {
                    try {
                        this._job = loadJob(this); // TODO: optionally cancel job & log info on exception
                    } catch (e) {
                        log.logException(e);
                        delete this.memory.job;
                    }
                }
                return this._job;
            },
            set: function (job: Job | undefined) {
                if (job === undefined) {
                    this._job = job;
                    delete this.memory.job;
                } else {
                    if (job.creep != this) throw `Job creep ${job.creep} does not match this creep ${this.name}`;
                    this._job = job;
                }
            }
        });
    }

    if (!Creep.prototype.homeRoom) {
        Object.defineProperty(Creep.prototype, "homeRoom", {
            get: function () {
                if (this._homeRoom === undefined) this._homeRoom = Game.rooms[this.memory.homeRoom];
                return this._homeRoom;
            },
            set: function (room: Room | undefined) {
                if (room === undefined) {
                    delete this.memory.homeRoom;
                    delete this._homeRoom;
                } else {
                    this.memory.homeRoom = room.name;
                    this._homeRoom = room;
                }
            }
        });
    }
}
