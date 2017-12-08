function posOf<T extends _HasRoomPosition | RoomPosition>(x: T): RoomPosition {
    if (x instanceof RoomPosition) return x;
    else return (<_HasRoomPosition>x).pos;
}

export function init() {
    if ((<any>RoomPosition.prototype)._findClosestByPath === undefined) {
        (<any>RoomPosition.prototype)._findClosestByPath = RoomPosition.prototype.findClosestByPath;
        RoomPosition.prototype.findClosestByPath = function<T extends _HasRoomPosition | RoomPosition>(typeOrObjects: T[] | FindConstant, opts?: FindPathOpts & { filter?: any | string, algorithm?: string}): T | null {
            if (typeof typeOrObjects === "number") return (<any>this)._findClosestByPath(typeOrObjects, opts);
            if (_.all(typeOrObjects, (too) => posOf(too).roomName === this.roomName)) return (<any>this)._findClosestByPath(typeOrObjects, opts);
            try {
                // TODO: do regular findClosestByPath on goals in this room, then compare the best against the best goal outside of the room?
                console.log('doing long-range path search from ' + this + ' to ' + typeOrObjects);

                if (opts !== undefined && opts.filter !== undefined) typeOrObjects = _.filter(typeOrObjects, opts.filter);
                if (typeOrObjects.length === 0) return null;

                let positions = _.map(typeOrObjects, posOf);
                let goals = positions.map((p) => ({ pos: p, range: 1 }));
                let result = PathFinder.search(this, goals);
                if (result.incomplete) { console.log('CALCULATION WAS INCOMPLETE'); return null; }
                if (result.path.length === 0) var closestPosition = this; // wouldn't that mean the goal was in the same room, and thus should be handled above?
                else var closestPosition = result.path[result.path.length - 1];
                let closestObj = typeOrObjects.filter((too) => posOf(too).isNearTo(closestPosition))[0];

                return closestObj;
            } catch (e) {
                console.log('error ' + e + ' with arguments: ' + arguments);
                return null;
            }
        }
    }
}
