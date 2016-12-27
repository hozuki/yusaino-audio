export default class HuffDecoder {

    constructor(dictionary: number[]) {
        //console.log(dictionary);
        this._huffDictionary = dictionary;
    }

    *decode(bitStream: Iterable<number>): Iterator<number> {
        const iter = <Iterator<number>>bitStream[Symbol.iterator]();
        while (true) {
            let huffix = 0;
            while (true) {
                let n = iter.next();
                if (n.done) {
                    return;
                }
                const b = n.value;
                if (b) {
                    const offset = this._huffDictionary[huffix];
                    if (offset) {
                        huffix += offset + 1;
                    } else {
                        huffix += 2;
                    }
                }
                if (!this._huffDictionary[huffix]) {
                    yield this._huffDictionary[huffix + 1];
                    break;
                } else {
                    ++huffix;
                }
            }
        }
    }

    get length(): number {
        return this._huffDictionary.length;
    }

    private _huffDictionary: number[] = null;

}