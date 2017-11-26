import { Remote } from "../remotes/remote";
import { RemoteContainer } from "../remotes/remote-container";
import { RemoteSource } from "../remotes/remote-source";
import { RemoteConstructionSite } from "../remotes/remote-construction-site";
import { FlagType } from "./flag";

export class VirtualFlag implements RoomObject, Flag {
    readonly prototype: Flag = (<any>Object).prototype;
    readonly name: string;

    private _pos: RoomPosition;
    private _assignedRoomName: string;
    private _removed: boolean = false;
    private _remote: Remote<RoomObject>;
    private _structureType: StructureConstant;
    private _color: ColorConstant;
    private _secondaryColor: ColorConstant;
    private _type: FlagType;

    constructor(name: string, pos?: RoomPosition, color?: ColorConstant, secondaryColor?: ColorConstant) {
        this.name = name;

        if (Memory.virtualFlags[name]) {
            if (pos !== undefined || color !== undefined || secondaryColor !== undefined) throw new Error('If virtual flag already exists, pos, color, and secondaryColor must not be provided');
        } else {
            if (pos === undefined || color === undefined || secondaryColor === undefined) throw new Error('If virtual flag does not already exist, pos, color, and secondaryColor must be provided');
            this.setPosition(pos);
            this.setColor(color, secondaryColor);
        }
    }

    get pos(): RoomPosition {
        if (this._pos === undefined) {
            let posObj = Memory.virtualFlags[this.name].pos;
            this._pos = new RoomPosition(posObj.x, posObj.y, posObj.roomName);
        }
        return this._pos;
    }

    get room(): Room {
        return Game.rooms[this.pos.roomName];
    }

    get color(): ColorConstant {
        if (this._color === undefined) this._color = Memory.virtualFlags[this.name].color;
        return this._color;
    }

    set color(color: ColorConstant) {
        this._color = color;
        Memory.virtualFlags[this.name].color = color;
    }

    get secondaryColor(): ColorConstant {
        if (this._secondaryColor === undefined) this._secondaryColor = Memory.virtualFlags[this.name].secondaryColor;
        return this._secondaryColor;
    }

    set secondaryColor(secondaryColor: ColorConstant) {
        this._secondaryColor = secondaryColor;
        Memory.virtualFlags[this.name].secondaryColor = secondaryColor;
    }

    get memory(): FlagMemory {
        return Memory.virtualFlags[this.name].memory;
    }

    set memory(memory: FlagMemory) {
        Memory.virtualFlags[this.name].memory = memory;
    }

    remove(): OK {
        if (this.assignedRoom !== undefined) this.assignedRoom.assignedFlagRemoved(this);
        delete Memory.virtualFlags[this.name].memory;
        return OK;
    }

    setColor(color: ColorConstant, secondaryColor?: ColorConstant): OK | ERR_INVALID_ARGS {
        this.color = color;
        if (secondaryColor !== undefined) this.secondaryColor = secondaryColor;
        return OK;
    }

    setPosition(x: any, y?: number): OK | ERR_INVALID_ARGS {
        if (typeof x == 'number') {
            if (y === undefined) return ERR_INVALID_ARGS;
            this._pos.x = x;
            this._pos.y = y;
        } else if (x instanceof RoomPosition) {
            this._pos = x;
        } else if (x !== undefined && x.pos instanceof RoomPosition) {
            this._pos = x.pos;
        } else {
            return ERR_INVALID_ARGS;
        }

        Memory.virtualFlags[this.name].pos = { x: this._pos.x, y: this._pos.y, roomName: this._pos.roomName };
        return OK;
    }

    get type(): FlagType {
        if (this._type === undefined) this.parseName(this);
        return this._type;
    }

    get assignedRoomName(): string {
        if (this._assignedRoomName === undefined) this.parseName(this);
        return this._assignedRoomName;
    }

    get assignedRoom(): Room {
        return Game.rooms[this.assignedRoomName];
    }

    get removed(): boolean {
        return this._removed;
    }

    checkRemove(): boolean {
        if (this.remote !== undefined && this.remote.shouldRemove()) {
            this.remove();
            return true;
        }
        return false;
    }

    update(): void {
        this.remote.update();
    }

    get structureType(): StructureConstant {
        if (this._structureType == undefined) {
            let strType = this.name.split(" ")[1].toLowerCase();
            switch (strType) {
                case "container": this._structureType = STRUCTURE_CONTAINER; break;
                case "road": this._structureType = STRUCTURE_ROAD; break;
                default: throw new Error("Unknown structure type " + strType + " for flag " + this.name);
            }
        }
        return this._structureType;
    }

    get remote(): Remote<RoomObject> {
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

    // <name>           ::= "structure" <structure-type> <assigned-room-name> <uid>
    //                    | "construction" <structure-type> <assigned-room-name> <uid>
    //                    | "source" <assigned-room-name> <uid>
    //                    | "scout" <uid>
    // <structure-type> ::= "container" | "road"
    parseName(flag: any) {
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
}
