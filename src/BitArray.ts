import Slice from "./Slice";
import {xrange} from "./iterable";

/**
 * A bit array implementation.
 */
export default class BitArray implements Iterable<number> {

    /**
     * Creates a new {@see BitArray} instance.
     * @param [data] {number[]} Source data array.
     */
    constructor(data: number[] = []) {
        this._data = [];
        this._bits = 0;
        if (data.length > 0) {
            this.appendRange(data);
        }
    }

    /**
     * Returns a deep clone of this {@see BitArray} instance.
     * @returns {BitArray} A clone of this instance.
     */
    clone(): BitArray {
        const array = new BitArray();
        array._data = this.data.slice();
        array._bits = this.length;
        return array;
    }

    // __len__
    /**
     * Gets the number of bits in this instance.
     * @returns {number} Number of bits.
     */
    get length(): number {
        return this._bits;
    }

    /**
     * Gets the underlying number array used to store the data. Due to implementation, numbers in this array are all
     * integers ranged from 0 to 255.
     * Note that `this.data.length` is usually different from `this.length`.
     * @returns {number[]} Underlying data array.
     */
    get data(): number[] {
        return this._data;
    }

    // __cmp__
    /**
     * Compare this {@see BitArray} with another {@see BitArray}.
     * @param other {BitArray} The other {@see BitArray}.
     * @returns {number} 1, 0, -1, corresponding to greater than, equal to, and less than.
     */
    compareTo(other: BitArray): number {
        if (this.length !== other.length) {
            return this.length > other.length ? 1 : (this.length < other.length ? -1 : 0);
        }
        const length = this.length;
        for (let i = 0; i < length; ++i) {
            const v1 = this.data[i], v2 = other.data[i];
            if (v1 !== v2) {
                return v1 > v2 ? 1 : (v1 < v2 ? -1 : 0);
            }
        }
        return 0;
    }

    // __getitem__
    /**
     * Get a slice from this {@see BitArray}.
     * @param slice {Slice} The {@see Slice} object telling which part to take.
     * @returns {BitArray} A new sliced {@see BitArray}
     */
    get(slice: Slice): BitArray;
    /**
     * Get a bit from this {@see BitArray}.
     * @param index {number} Index of desired bit.
     */
    get(index: number): number;
    get(index: any): any {
        if (typeof index === "number") {
            console.assert(0 <= index && index < this.length);
            return this.getBit(index);
        }

        const slice = <Slice>index;
        const step = slice.step === void(0) ? 1 : slice.step;
        let start: number, stop: number;
        if (step >= 0) {
            start = slice.start === void(0) ? 0 : this.clip(slice.start, 0, this.length);
            stop = slice.stop === void(0) ? this.length : this.clip(slice.stop, 0, this.length);
        } else {
            start = slice.start === void(0) ? this.length - 1 : this.clip(slice.start, this.length - 1, -1);
            stop = slice.stop === void(0) ? -1 : this.clip(slice.stop, 0, this.length);
        }
        const data: number[] = [];
        for (const i of xrange(start, stop, step)) {
            data.push(this.getBit(i));
        }
        return new BitArray(data);
    }

    // __add__
    /**
     * Concatenate another bit sequence to this {@see BitArray}.
     * @param other {number[]} A number series considered as bit sequence.
     * @returns {BitArray} A new {@see BitArray}, which is the concatenation of two arrays.
     */
    concat(other: number[]): BitArray;
    /**
     * Concatenate another {@see BitArray} to this {@see BitArray}.
     * @param other {number[]} Another {@see BitArray}.
     * @returns {BitArray} A new {@see BitArray}, which is the concatenation of two arrays.
     */
    concat(other: BitArray): BitArray;
    concat(other: any): BitArray {
        const r = this.clone();
        if (Array.isArray(other)) {
            r.appendRange(<number[]>other);
        } else if (other instanceof BitArray) {
            r.appendRange((<BitArray>other).data);
        } else {
            throw new TypeError();
        }
        return r;
    }

    // __iadd__
    /**
     * Append a series of bits after this {@see BitArray}.
     * @param data {number[]} Bit series.
     * @returns {BitArray} This {@see BitArray} instance, for chain invocation.
     */
    appendRange(data: number[]): this {
        for (const bit of data) {
            this.append(bit);
        }
        return this;
    }

    /**
     * Append a bit after this {@see BitArray}.
     * @param bit {number} The bit.
     */
    append(bit: number): void {
        const data = this.data;
        bit = Number(bit);
        const bitPosition = this.length & 7;
        const bitOr = bit ? (1 << (7 - bitPosition)) : 0;
        if (!bitPosition) {
            data.push(bitOr);
        } else {
            data[data.length - 1] |= bitOr;
        }
        ++this._bits;
    }

    /**
     * Get a bit from this {@see BitArray}.
     * @param index {number} The index of desired bit.
     * @returns {number} Value of the bit.
     */
    getBit(index: number): number {
        return (this.data[index >>> 3] >>> (7 - (index & 7))) & 1;
    }

    /**
     * Clip the given index to the range of a part of or the whole of this {@see BitArray}.
     * @param index {number} Original index value. Giving this argument a negative number means counting from the end
     * of this {@see BitArray}.
     * @param min {number} The lower boundary.
     * @param max {number} The upper boundary.
     * @returns {number} Clipped index value.
     */
    clip(index: number, min: number, max: number): number {
        if (min > max) {
            [min, max] = [max, min];
        }
        return Math.max(min, Math.min(index >= 0 ? index : (this.length + index), max));
    }

    // __str__ / __repr__
    /**
     * Gets the string representation of this {@see BitArray}.
     * @returns {string} The string representation of this {@see BitArray}.
     */
    toString(): string {
        let str = "BitArray [";
        for (const bit of this) {
            str += String(bit);
        }
        str += "]";
        return str;
    }

    // __iter__
    /**
     * Iterator of this {@see BitArray}. Essential for {@see Iterable<T>}.
     */
    *[Symbol.iterator](): Iterator<number> {
        for (const i of xrange(this.length)) {
            yield this.getBit(i);
        }
    }

    private _bits: number = 0;
    private _data: number[] = null;

}
