import BitArray from "./BitArray";
import {Huff} from "./HuffCluster";

export type HuffEntry = number|number[]|Huff|BitArray;
type TypedNumberArray = number[] | Uint8Array |Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array | Float32Array | Float64Array;

/**
 * A Huffman encoder.
 */
export default class HuffEncoder {

    /**
     * Creates a new {@see HuffEncoder} instance.
     * @param huffDictionary {Iterable<HuffEntry[]>} A Huffman dictionary.
     */
    constructor(huffDictionary: Iterable<HuffEntry[]>) {
        this._dictionary = new Map<number, HuffEntry>(<any>Array.from(huffDictionary));
    }

    /**
     * Encodes a number to a {@see BitArray}.
     * @param data {number} The number to be encoded.
     * @returns {BitArray} Generated {@see BitArray}.
     */
    encode(data: number): BitArray;
    /**
     * Encodes a byte array to a {@see BitArray}.
     * @param data {TypedNumberArray} The data to be encoded.
     * @returns {BitArray} Generated {@see BitArray}.
     */
    encode(data: TypedNumberArray): BitArray;
    encode(data: any): BitArray {
        if (typeof data === "number" || typeof data === "string") {
            return (<BitArray>this._dictionary.get(Number(data))).clone();
        }
        const ret = new BitArray();
        const dict = this._dictionary;
        for (const s of data) {
            // HACK
            ret.appendRange(<number[]>dict.get(s));
        }
        return ret;
    }

    /**
     * Encodes a number to a {@see BitArray} and returns the underlying data. A shorthand of Array.from(encode(data)).
     * @param data {number} The number to be encoded.
     * @returns {BitArray} Generated {@see BitArray}.
     */
    encodeToByteArray(data: number): number[];
    /**
     * Encodes a byte array to a {@see BitArray} and returns the underlying data. A shorthand of Array.from(encode(data)).
     * @param data {TypedNumberArray} The data to be encoded.
     * @returns {BitArray} Generated {@see BitArray}.
     */
    encodeToByteArray(data: TypedNumberArray): number[];
    encodeToByteArray(data: any): number[] {
        return this.encode(data).data;
    }

    private _dictionary: Map<number, HuffEntry> = null;

}