import BitArray from "./BitArray";
import {Huff} from "./HuffCluster";

type HuffEntry = number|number[]|Huff|BitArray;
export type HuffDictionary = Iterable<HuffEntry[]>;

export default class HuffEncoder {

    constructor(huffDictionary: HuffDictionary) {
        // HACK
        this._dictionary = new Map<number, HuffEntry>(<any>Array.from(huffDictionary));
    }

    encode(data: number): BitArray;
    encode(data: number[]): BitArray;
    encode(data: any): BitArray {
        if (!Array.isArray(data)) {
            return <BitArray>this._dictionary.get(Number(data));
        }
        const ret = new BitArray();
        for (let s of data) {
            // HACK
            ret.appendRange(<number[]>this._dictionary.get(s));
        }
        return ret;
    }

    private _dictionary: Map<number, HuffEntry> = null;

}