import Heap from "./Heap";
import {HuffCluster} from "./HuffCluster";
import {select, enumerate, slice} from "./iterable";
import BitArray from "./BitArray";
import {default as HuffEncoder, HuffEntry} from "./HuffEncoder";
import HuffDecoder from "./HuffDecoder";

/**
 * A Huffman tree.
 */
export default class HuffTree {

    /**
     * Creates a new {@see HuffTree} instance based on a frequency histogram.
     * @param histogram {number[][]} The frequency histogram.
     */
    constructor(histogram: number[][]) {
        const trees = histogram.slice();
        Heap.heapify(trees);
        while (trees.length > 1) {
            const [childRight, childLeft] = [Heap.pop(trees), Heap.pop(trees)];
            const parent = [childLeft[0] + childRight[0], childLeft, childRight];
            Heap.push(trees, parent);
        }
        this._tree = trees[0];
    }

    get tree(): HuffCluster {
        return this._tree;
    }

    getDecoder(): HuffDecoder {
        return new HuffDecoder(HuffTree.flatten(this.tree));
    }

    getEncoder(): HuffEncoder {
        return new HuffEncoder(HuffTree.getDictionary(this.tree));
    }

    static flatten(tree: HuffCluster): number[] {
        console.assert(tree.length > 2);
        let l: number[] = [];
        for (const h of select(tree, slice([1, 3]))) {
            if (h.dictionaryLength === 2) {
                l.push(0);
                l.push(h[1]);
            } else {
                const t = HuffTree.flatten(h);
                l.push(t.length);
                l = l.concat(t);
            }
        }
        return l;
    }

    static *getDictionary(tree: HuffCluster, bits: BitArray = new BitArray()): Iterable<HuffEntry[]> {
        if (tree.length === 2) {
            yield [tree[1], bits];
        } else {
            for (const {index, value: h} of enumerate(select(tree, slice([1, 3])))) {
                for (const y of HuffTree.getDictionary(h, bits.concat([index]))) {
                    yield y;
                }
            }
        }
    }

    get length(): number {
        return this.tree.length;
    }

    private _tree: HuffCluster = null;

}