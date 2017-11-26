export abstract class Job {
  readonly name: string;
  readonly creep: Creep;
  abstract run(): boolean; // true if job should continue on next tick
  abstract save(): void;

  constructor(name: string, creep: Creep) {
    this.name = name;
    this.creep = creep;
  }
};
