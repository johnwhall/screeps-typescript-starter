import { Caste } from "./caste";
import { Job } from "./jobs/job";
import { loadJob } from "./jobs/job-loader";

declare global {
    interface Creep {
        readonly caste: Caste;
        homeRoom: Room | undefined;
        job: Job | undefined;
        doJob(): void;
    }
}

export function init() {
    if (!Creep.prototype.caste) {
        Object.defineProperty(Creep.prototype, "caste", {
            get: function() {
                if (this._caste === undefined) this._caste = Caste[this.memory.caste];
                return this._caste;
            },
        });
    }

    if (!Creep.prototype.doJob) {
        Creep.prototype.doJob = function() {
            if (this.spawning || this.job === undefined) return;
            if (this.job.run()) {
                this.job.save();
            } else {
                // job finished
                delete this.job;
                delete this.memory.job;
            }
        }
    }

    if (!Creep.prototype.job) {
        Object.defineProperty(Creep.prototype, "job", {
            get: function() {
                if (this._job === undefined && this.memory.job) this._job = loadJob(this);
                return this._job;
            },
            set: function(job: Job | undefined) {
                if (job === undefined) {
                    this._job = job;
                    delete this.memory.job;
                } else {
                    if (job.creep != this) throw `Job creep ${job.creep} does not match this creep ${this.name}`;
                    this._job = job;
                    job.save();
                }
            }
        });
    }

    if (!Creep.prototype.homeRoom) {
        Object.defineProperty(Creep.prototype, "homeRoom", {
            get: function() {
                if (this._homeRoom === undefined) this._homeRoom = Game.rooms[this.memory.homeRoom];
                return this._homeRoom;
            },
            set: function(room: Room | undefined) {
                if (room === undefined) delete this.memory.homeRoom;
                else this.memory.homeRoom = room.name;
            }
        });
    }
}
