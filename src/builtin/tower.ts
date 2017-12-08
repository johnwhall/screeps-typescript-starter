import { getLinearDistance } from "utils";

declare global {
    interface StructureTower {
        attackDamageTo(x: number, y: number): number;
        healHitsTo(x: number, y: number): number;
        repairHitsTo(x: number, y: number): number;
    }
}

export function init() {
    if (!StructureTower.prototype.attackDamageTo) {
        StructureTower.prototype.attackDamageTo = function(x: number, y: number): number {
            let dist = getLinearDistance(this.pos.x, this.pos.y, x, y);
            if (dist <= 5) return 600;
            else if (dist >= 20) return 150;
            else return 750 - 30 * dist;
        }
    }

    if (!StructureTower.prototype.healHitsTo) {
        StructureTower.prototype.healHitsTo = function(x: number, y: number): number {
            let dist = getLinearDistance(this.pos.x, this.pos.y, x, y);
            if (dist <= 5) return 400;
            else if (dist >= 20) return 100;
            else return 500 - 20 * dist;
        }
    }

    if (!StructureTower.prototype.repairHitsTo) {
        StructureTower.prototype.repairHitsTo = function(x: number, y: number): number {
            let dist = getLinearDistance(this.pos.x, this.pos.y, x, y);
            if (dist <= 5) return 800;
            else if (dist >= 20) return 200;
            else return 1000 - 40 * dist;
        }
    }
}
