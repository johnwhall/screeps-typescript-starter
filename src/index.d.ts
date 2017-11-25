// import { StationaryHarvestJob } from "jobs/stationary-harvest-job";

// add objects to `global` here
declare namespace NodeJS {
  interface Global {
    log: any;
  }
}

declare const __REVISION__: string

interface CreepMemory { [name: string]: any }
// interface CreepMemory {
//   job: StationaryHarvestJob;
// }

interface FlagMemory { [name: string]: any }
interface SpawnMemory { [name: string]: any }
interface RoomMemory { [name: string]: any }
