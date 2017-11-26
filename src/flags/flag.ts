import { Remote } from "../remotes/remote";
import { RemoteContainer } from "../remotes/remote-container";
import { RemoteSource } from "../remotes/remote-source";
import { RemoteConstructionSite } from "../remotes/remote-construction-site";

export enum FlagType {
    FLAG_STRUCTURE = "FLAG_STRUCTURE",
    FLAG_SOURCE = "FLAG_SOURCE",
    FLAG_SCOUT = "FLAG_SCOUT",
    FLAG_CONSTRUCTION_SITE = "FLAG_CONSTRUCTION_SITE",
}

declare global {
    interface Flag {
        readonly type: FlagType;
        readonly assignedRoomName: string;
        readonly assignedRoom: Room | undefined;
        readonly remote: Remote<RoomObject>;
        readonly removed: boolean;
        checkRemove(): boolean;
        update(): void;
    }
}

export function nextFlagUid(): string {
    let prevTime = Number(Memory.previousFlagUidTime) || Game.time;
    let num = (Number(Memory.previousFlagUidNum) || 0) + 1;
    if (prevTime != Game.time) num = 1;
    let uid = Game.time + "-" + num;
    Memory.previousFlagUidTime = Game.time;
    Memory.previousFlagUidNum = num;
    return uid;
}

export function init() {
    // <name>           ::= "structure" <structure-type> <assigned-room-name> <uid>
    //                    | "construction" <structure-type> <assigned-room-name> <uid>
    //                    | "source" <assigned-room-name> <uid>
    //                    | "scout" <uid>
    // <structure-type> ::= "container" | "road"
    function parseName(flag: any) {
        let parts: string[] = flag.name.split(" ");
        switch (parts[0].toLowerCase()) {
            case "structure":
                [flag._type, flag._assignedRoomName] = [FlagType.FLAG_STRUCTURE, parts[2]];
                break;
            case "source":
                [flag._type, flag._assignedRoomName] = [FlagType.FLAG_SOURCE, parts[1]];
                break;
            case "scout":
                flag._type = FlagType.FLAG_SCOUT;
                break;
            case "construction":
                [flag._type, flag._assignedRoomName] = [FlagType.FLAG_CONSTRUCTION_SITE, parts[2]];
                break;
            default:
                throw new Error("Unknown flag type " + parts[0] + " in name " + flag.name);
        }
    }

    if (!Flag.prototype.type) {
        Object.defineProperty(Flag.prototype, "type", {
            get: function () {
                if (this._type === undefined) parseName(this);
                return this._type;
            }
        });
    }

    if (!Flag.prototype.assignedRoomName) {
        Object.defineProperty(Flag.prototype, "assignedRoomName", {
            get: function () {
                if (this._assignedRoomName === undefined) parseName(this);
                return this._assignedRoomName;
            }
        });
    }

    if (!Flag.prototype.assignedRoom) {
        Object.defineProperty(Flag.prototype, "assignedRoom", {
            get: function() { return Game.rooms[this.assignedRoomName]; }
        });
    }

    if (!Flag.prototype.remote) {
        Object.defineProperty(Flag.prototype, "remote", {
            get: function () {
                if (this._remote === undefined) {
                    switch (this.type) {
                        case FlagType.FLAG_STRUCTURE:
                            switch (this.structureType) {
                                case STRUCTURE_CONTAINER: this._remote = new RemoteContainer(this); break;
                                default: throw new Error("Remote not yet implemented for flag structure type " + this.structureType + " (flag: " + this.name + ")");
                            }
                            break;
                        case FlagType.FLAG_SOURCE: this._remote = new RemoteSource(this); break;
                        case FlagType.FLAG_CONSTRUCTION_SITE: this._remote = new RemoteConstructionSite(this); break;
                        default:
                            throw new Error("Remote not yet implemented for flag type " + this.type + " (flag: " + this.name + ")");
                    }
                }
                return this._remote;
            }
        });
    }

    if (!Flag.prototype.update) {
        Flag.prototype.update = function() { this.remote.update(); }
    }

    if (!(<any>Flag.prototype)._remove) {
        (<any>Flag.prototype)._remove = Flag.prototype.remove;
        Flag.prototype.remove = function(): OK {
            (<any>this)._removed = true;
            if (this.room !== undefined) {
                let idx: number = this.room.assignedFlags.indexOf(this);
                if (idx >= 0) this.room.assignedFlags.splice(idx, 1);
            }
            return (<any>this)._remove();
        }
    }

    if (!Flag.prototype.removed) {
        Object.defineProperty(Flag.prototype, "removed", {
            get: function() {
                if (this._removed === undefined) this._removed = false;
                return this._removed;
            }
        })
    }

    if (!Flag.prototype.checkRemove) {
        Flag.prototype.checkRemove = function() {
            if (this.remote !== undefined && this.remote.shouldRemove()) {
                this.remove();
                return true;
            }
            return false;
        }
    }
}
