import { FlagType } from "./flags/flag";
import { ConstructionSiteFlag } from "./flags/construction-site-flag";

declare global {
    interface ConstructionSite {
        flag: ConstructionSiteFlag;
    }
}

export function init() {
    if (!ConstructionSite.prototype.flag) {
        Object.defineProperty(ConstructionSite.prototype, "flag", {
            get: function() {
                if (this._flag === undefined) this._flag = this.pos.lookFor(LOOK_FLAGS).filter((f: Flag) => f.type == FlagType.FLAG_CONSTRUCTION_SITE)[0];
                return this._flag;
            },
            set: function(flag: Flag) {
                if (flag.type != FlagType.FLAG_CONSTRUCTION_SITE || flag.structureType != this.structureType || !flag.pos.isEqualTo(this.pos)) throw new Error(`Invalid flag ${flag} for construction site ${this}`);
                this._flag = flag;
            }
        });
    }
}
