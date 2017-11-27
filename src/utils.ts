export function nextUid(): string {
    let prevTime = Number(Memory.previousUidTime) || Game.time;
    let num = (Number(Memory.previousUidNum) || 0) + 1;
    if (prevTime != Game.time) num = 1;
    let uid = Game.time + "-" + num;
    Memory.previousUidTime = Game.time;
    Memory.previousUidNum = num;
    return uid;
}
