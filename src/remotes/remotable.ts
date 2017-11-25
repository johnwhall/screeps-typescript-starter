export interface Remotable<T extends RoomObject> extends RoomObject {
    readonly liveObject: T | undefined;
    update(): void;
}

declare global {
    interface Source {
        readonly liveObject: Source;
        update(): void;
    }

    interface StructureContainer {
        readonly liveObject: StructureContainer;
        update(): void;
    }

    interface StructureRoad {
        readonly liveObject: StructureRoad;
        update(): void;
    }

    interface ConstructionSite {
        readonly liveObject: ConstructionSite;
        update(): void;
    }
}

export function init() {
    _.forEach([Source, StructureContainer, StructureRoad, ConstructionSite], (clazz) => {
        if (!clazz.prototype.liveObject) {
            Object.defineProperty(clazz.prototype, "liveObject", {
                get: function () { return this; }
            });
        }
    });

    _.forEach([Source, StructureContainer, StructureRoad, ConstructionSite], (clazz) => {
        if (!clazz.prototype.update) {
            clazz.prototype.update = function() {}
        }
    });
}
