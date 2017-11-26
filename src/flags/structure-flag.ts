export interface StructureFlag {
    readonly structureType: StructureConstant;
}

declare global {
    interface Flag { readonly structureType: StructureConstant }
}

export function init() {
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
}
