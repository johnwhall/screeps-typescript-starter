export function updateVisuals() {
    _.forEach(Game.constructionSites, (cs) => {
        let plannedProgressStr = cs.remotable.plannedProgress === cs.progress ? "" : ` (${cs.remotable.plannedProgress})`;
        new RoomVisual(cs.pos.roomName).text(`${cs.progress}${plannedProgressStr} / ${cs.progressTotal}`, cs.pos.x, cs.pos.y + 0.6, { font: 0.35 });
    });

    _.forEach(Game.rooms, (room) => {
        if (!room.controller || !room.controller.my) return;

        for (let cont of room.assignedContainers) {
            let plannedEnergyStr = cont.plannedEnergy === cont.energy ? "" : ` (${cont.plannedEnergy})`;
            room.visual.text(`${cont.energy}${plannedEnergyStr} / ${cont.energyCapacity}`, cont.pos.x, cont.pos.y + 0.6, { font: 0.35 });
        }

        if (!room.memory.lastControllerProgress) room.memory.lastControllerProgress = room.controller.progress;
        var progPerTick = (room.controller.progress - room.memory.lastControllerProgress);
        room.visual.text('rate: ' + progPerTick, room.controller.pos.x, room.controller.pos.y + 0.65, { font : 0.35 });
        if (progPerTick) {
            var progEta = Memory.avgTickRate * (room.controller.progressTotal - room.controller.progress) / progPerTick;
            room.visual.text('eta: ' + Math.round(progEta / 3600) + 'h ' + Math.round((progEta % 3600) / 60) + 'm ' + Math.round(progEta % 60) + 's', room.controller.pos.x, room.controller.pos.y + 1, { font : 0.35 });
        }
        room.memory.lastControllerProgress = room.controller.progress;
    });
}
