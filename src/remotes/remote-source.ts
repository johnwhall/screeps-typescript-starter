import { Remote } from "./remote";

export class RemoteSource extends Remote<Source> {
    covered: boolean = false;
    private _liveObject: Source;

    get liveObject() : Source|undefined {
        if (this.room == undefined) return undefined;
        else return this._liveObject = <Source>this.pos.lookFor(LOOK_SOURCES)[0];
    }

    update(): void {}
    shouldRemove(): boolean { return false; }
    toString(): string {
        if (this.liveObject) return this.liveObject.toString();
        else return `[invisible source at ${this.pos}]`;
    }
}
