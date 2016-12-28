/**
 * The Huffman decoder.
 */
export default class HuffDecoder {

    /**
     * Creates a new {@see HuffDecoder} instance.
     * @param dictionary {number[]} The flattened Huffman tree, used as the decoding dictionary.
     */
    constructor(dictionary: number[]) {
        this._huffDictionary = dictionary;
    }

    /**
     * Decode a data sequence based on a Huffman dictionary.
     * @param bitStream {Iterable<number>} The data sequence.
     * @returns {Iterable<number>} A number sequence which should be accessed by iteration.
     */
    *decode(bitStream: Iterable<number>): Iterable<number> {
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
                    const offset = this.dictionary[huffix];
                    if (offset) {
                        huffix += offset + 1;
                    } else {
                        huffix += 2;
                    }
                }
                if (!this.dictionary[huffix]) {
                    yield this.dictionary[huffix + 1];
                    break;
                } else {
                    ++huffix;
                }
            }
        }
    }

    /**
     * Gets the decoded byte array. It is a shorthand of Array.from(decode(byteArray)).
     * @param bitStream {Iterable<number>} The data sequence.
     * @returns {number[]} Decoded byte array.
     */
    decodeToByteArray(bitStream: Iterable<number>): number[] {
        return <number[]>Array.from(this.decode(bitStream));
    }

    /**
     * Gets the length of the dictionary used.
     * @returns {number} Length of the dictionary used.
     */
    get dictionaryLength(): number {
        return this.dictionary.length;
    }

    /**
     * Gets the dictionary used.
     * @returns {number[]} The dictionary used.
     */
    get dictionary(): number[] {
        return this._huffDictionary;
    }

    private _huffDictionary: number[] = null;

}