import Slice from "./Slice";
import {xrange} from "./iterable";

export default class BitArray implements Iterable<number> {

    constructor(data: number[] = []) {
        this._bits = 0;
        if (data.length > 0) {
            const d = this._data = data.slice();
            for (let i = 0; i < d.length; ++i) {
                d[i] |= 0;
            }
        } else {
            this._data = [];
        }
    }

    clone(): BitArray {
        const array = new BitArray(this.data);
        array._bits = this.bits;
        return array;
    }

    // __len__
    get length(): number {
        return this._bits;
    }

    get bits(): number {
        return this._bits;
    }

    get data(): number[] {
        return this._data;
    }

    // __cmp__
    compareTo(other: BitArray): number {
        if (this.bits !== other.bits) {
            return this.bits > other.bits ? 1 : (this.bits < other.bits ? -1 : 0);
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
    get(index: Slice): number[];
    get(index: number): number;
    get(index: any): any {
        if (typeof index === "number") {
            console.assert(0 <= index && index < this.bits);
            return this.getBit(index);
        }

        const slice = <Slice>index;
        const step = slice.step === void(0) ? 1 : slice.step;
        let start: number, stop: number;
        if (step >= 0) {
            start = slice.start === void(0) ? 0 : this.clip(slice.start, 0, this.bits);
            stop = slice.stop === void(0) ? this.bits : this.clip(slice.stop, 0, this.bits);
        } else {
            start = slice.start === void(0) ? this.bits - 1 : this.clip(slice.start, this.bits - 1, -1);
            stop = slice.stop === void(0) ? -1 : this.clip(slice.stop, 0, this.bits);
        }
        const data: number[] = [];
        for (let i of xrange(start, stop, step)) {
            data.push(this.getBit(i));
        }
        return new BitArray(data);
    }

    // __add__
    concat(other: number[]): BitArray;
    concat(other: BitArray): BitArray;
    concat(other: any): BitArray {
        let r = this.clone();
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
        for (let bit of data) {
            this.append(bit);
        }
        return this;
    }

    append(bit: number) {
        bit = Number(bit);
        const bitPosition = this.bits & 7;
        const bitOr = bit ? (1 << (7 - bitPosition)) : 0;
        if (!bitPosition) {
            this.data.push(bitOr);
        } else {
            this.data[this.data.length - 1] |= bitOr;
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
        return Math.max(min, Math.min(index >= 0 ? index : (this.bits + index), max));
    }

    // __str__ / __repr__
    toString(): string {
        let str = "BitArray [";
        for (let bit of this) {
            str += String(bit);
        }
        str += "]";
        return str;
    }

    // __iter__
    *[Symbol.iterator](): Iterator<number> {
        for (let i of xrange(this.bits)) {
            yield this.getBit(i);
        }
    }

    private _bits: number = 0;
    private _data: number[] = null;

}
