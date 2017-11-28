export function nextUid(): string {
    let prevTime = Number(Memory.previousUidTime) || Game.time;
    let num = (Number(Memory.previousUidNum) || 0) + 1;
    if (prevTime != Game.time) num = 1;
    let uid = Game.time + "-" + num;
    Memory.previousUidTime = Game.time;
    Memory.previousUidNum = num;
    return uid;
}

export function swapProperties<T>(obj: T, key1: keyof T, key2: keyof T) {
    let tmp = obj[key1];
    obj[key1] = obj[key2];
    obj[key2] = tmp;
}

export function swapIndices<T>(arr: T[], idx1: number, idx2: number) {
    let tmp = arr[idx1];
    arr[idx1] = arr[idx2];
    arr[idx2] = tmp;
}
