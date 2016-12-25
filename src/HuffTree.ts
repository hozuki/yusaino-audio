import Heap from "./Heap";
import {HuffCluster} from "./HuffCluster";
import {xrange, select, enumerate} from "./iterable";
import BitArray from "./BitArray";
import {HuffDictionary, default as HuffEncoder} from "./HuffEncoder";
import HuffDecoder from "./HuffDecoder";

export default class HuffTree {

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
        for (let h of select(tree, xrange(1, 3))) {
            if (h.length === 2) {
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

    static *getDictionary(tree: HuffCluster, bits: BitArray = new BitArray()): HuffDictionary {
        if (tree.length === 2) {
            yield [tree[1], bits];
        } else {
            for (let {index, value: h} of enumerate(select(tree, xrange(1, 3)))) {
                for (let y of HuffTree.getDictionary(h, bits.concat([index]))) {
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