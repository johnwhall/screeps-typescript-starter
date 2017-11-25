import { Remotable } from "../remotes/remotable";
import { RemoteContainer } from "../remotes/remote-container";
import { RemoteSource } from "../remotes/remote-source";

export enum FlagType {
    FLAG_STRUCTURE,
    FLAG_SOURCE,
    FLAG_SCOUT,
}

declare global {
    interface Flag {
        readonly type: FlagType;
        readonly assignedRoomName: string;
        readonly remotable: Remotable<RoomObject>;
        update(): void;
    }
}

export function init() {
    // <name>           ::= "structure" <structure-type> <assigned-room-name> <uuid>
    //                    | "construction" <structure-type> <assigned-room-name> <uuid>
    //                    | "source" <assigned-room-name> <uuid>
    //                    | "scout" <uuid>
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
            default:
                throw "Unknown flag type " + parts[0] + " in name " + flag.name;
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

    if (!Flag.prototype.remotable) {
        Object.defineProperty(Flag.prototype, "remotable", {
            get: function () {
                if (this._remotable === undefined) {
                    switch (this.type) {
                        case FlagType.FLAG_STRUCTURE:
                            switch (this.structureType) {
                                case STRUCTURE_CONTAINER: this._remotable = new RemoteContainer(this); break;
                                default: throw "Remotable not yet implemented for flag structure type " + this.structureType + " (flag: " + this.name + ")";
                            }
                            break;
                        case FlagType.FLAG_SOURCE: this._remotable = new RemoteSource(this); break;
                        default:
                            throw "Remotable not yet implemented for flag type " + this.type + " (flag: " + this.name + ")";
                    }
                }
                return this._remotable;
            }
        });
    }

    if (!Flag.prototype.update) {
        Flag.prototype.update = function() { this.remotable.update(); }
    }
}
