import { RemotableEnergyStore } from "remotables/remotable";

export function updateVisuals() {
    _.forEach(Game.constructionSites, (cs) => {
        let plannedProgressStr = cs.remotable.plannedProgress === cs.progress ? "" : ` (${cs.remotable.plannedProgress})`;
        new RoomVisual(cs.pos.roomName).text(`${cs.progress}${plannedProgressStr} / ${cs.progressTotal}`, cs.pos.x, cs.pos.y + 0.6, { font: 0.35 });
    });

    _.forEach(Game.rooms, (room) => {
        if (!room.controller || !room.controller.my) return;

        for (let cont of room.assignedContainers) visualizeEnergy(room.visual, cont);
        if (room.storage) visualizeEnergy(room.visual, room.storage.remotable);
        for (let ext of room.extensions) visualizeEnergy(room.visual, ext);
        for (let spawn of room.spawns) visualizeEnergy(room.visual, spawn);

        if (!room.memory.lastControllerProgress) room.memory.lastControllerProgress = room.controller.progress;
        var progPerTick = (room.controller.progress - room.memory.lastControllerProgress);
        room.visual.text('rate: ' + progPerTick, room.controller.pos.x, room.controller.pos.y + 0.65, { font: 0.35 });
        if (progPerTick) {
            var progEta = Memory.avgTickRate * (room.controller.progressTotal - room.controller.progress) / progPerTick;
            room.visual.text('eta: ' + Math.round(progEta / 3600) + 'h ' + Math.round((progEta % 3600) / 60) + 'm ' + Math.round(progEta % 60) + 's', room.controller.pos.x, room.controller.pos.y + 1, { font: 0.35 });
        }
        room.memory.lastControllerProgress = room.controller.progress;
    });
}

function visualizeEnergy(visual: RoomVisual, es: RemotableEnergyStore) {
    let availableEnergyForPickupStr = es.availableEnergyForPickup === es.energy ? "" : ` (${es.availableEnergyForPickup - es.energy})`;
    let plannedEnergyWithIncomingStr = es.plannedEnergyWithIncoming === es.energy ? "" : ` (+${es.plannedEnergyWithIncoming - es.energy})`;
    visual.text(`${es.energy}${plannedEnergyWithIncomingStr}${availableEnergyForPickupStr}`, es.pos.x, es.pos.y + 0.6, { font: 0.35 });
}
