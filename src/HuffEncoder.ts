import BitArray from "./BitArray";
import {Huff} from "./HuffCluster";

export type HuffEntry = number|number[]|Huff|BitArray;

export default class HuffEncoder {

    constructor(huffDictionary: Iterable<HuffEntry[]>) {
        // HACK
        this._dictionary = new Map<number, HuffEntry>(<any>Array.from(huffDictionary));
    }

    encode(data: number): BitArray;
    encode(data: number[]): BitArray;
    encode(data: ArrayLike<number>): BitArray;
    encode(data: any): BitArray {
        //console.log("encoding: ", data);
        if (typeof data === "number" || typeof data === "string") {
            return <BitArray>this._dictionary.get(Number(data));
        }
        const ret = new BitArray();
        const dict = this._dictionary;
        for (const s of data) {
            // HACK
            ret.appendRange(<number[]>dict.get(s));
        }
        return ret;
    }

    private _dictionary: Map<number, HuffEntry> = null;

}