import Slice from "./Slice";
import {xrange} from "./iterable";

export default class BitArray implements Iterable<number> {

    constructor(data: number[] = []) {
        this._data = [];
        if (data.length > 0) {
            this.appendRange(data);
        }
    }

    clone(): BitArray {
        const array = new BitArray();
        array._data = this.data.slice();
        array._bits = this.length;
        return array;
    }

    // __len__
    get length(): number {
        return this._bits;
    }

    get data(): number[] {
        return this._data;
    }

    // __cmp__
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
    get(index: Slice): BitArray;
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
    concat(other: number[]): BitArray;
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
    appendRange(data: number[]): this {
        for (const bit of data) {
            this.append(bit);
        }
        return this;
    }

    append(bit: number) {
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

    getBit(index: number): number {
        return (this.data[index >>> 3] >>> (7 - (index & 7))) & 1;
    }

    clip(index: number, min: number, max: number): number {
        if (min > max) {
            [min, max] = [max, min];
        }
        return Math.max(min, Math.min(index >= 0 ? index : (this.length + index), max));
    }

    // __str__ / __repr__
    toString(): string {
        let str = "BitArray [";
        for (const bit of this) {
            str += String(bit);
        }
        str += "]";
        return str;
    }

    // __iter__
    *[Symbol.iterator](): Iterator<number> {
        for (const i of xrange(this.length)) {
            yield this.getBit(i);
        }
    }

    private _bits: number = 0;
    private _data: number[] = null;

}
