import { Remote } from "../remotables/remotes/remote";
import { RemoteContainer } from "../remotables/remotes/remote-container";
import { RemoteStorage } from "../remotables/remotes/remote-storage";
import { RemoteSource } from "../remotables/remotes/remote-source";
import { RemoteConstructionSite } from "../remotables/remotes/remote-construction-site";
import { RemoteRoad } from "../remotables/remotes/remote-road";
import { RemoteSpawn } from "../remotables/remotes/remote-spawn";
import { RemoteExtension } from "../remotables/remotes/remote-extension";
import { RemoteWall } from "../remotables/remotes/remote-wall";
import { RemoteRampart } from "../remotables/remotes/remote-rampart";

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
        readonly structureType: StructureConstant;
        checkRemove(): boolean;
        update(): void;
    }
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

    if (!Flag.prototype.structureType) {
        Object.defineProperty(Flag.prototype, "structureType", {
            get: function() {
                if (this._structureType == undefined) {
                    let strType = this.name.split(" ")[1].toLowerCase();
                    switch (strType) {
                        case "container": this._structureType = STRUCTURE_CONTAINER; break;
                        case "road": this._structureType = STRUCTURE_ROAD; break;
                        default: throw "Unknown structure type " + strType + " for flag " + this.name;
                    }
                }
                return this._structureType;
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
                                case STRUCTURE_STORAGE: this._remote = new RemoteStorage(this); break;
                                case STRUCTURE_ROAD: this._remote = new RemoteRoad(this); break;
                                case STRUCTURE_SPAWN: this._remote = new RemoteSpawn(this); break;
                                case STRUCTURE_EXTENSION: this._remote = new RemoteExtension(this); break;
                                case STRUCTURE_WALL: this._remote = new RemoteWall(this); break;
                                case STRUCTURE_RAMPART: this._remote = new RemoteRampart(this); break;
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
            if (this.assignedRoom !== undefined) this.assignedRoom.assignedFlagRemoved(this);
            if (this.remote.liveObject !== undefined && (<any>this.remote.liveObject).remotable === this.remote) delete (<any>this.remote.liveObject).remotable;
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
