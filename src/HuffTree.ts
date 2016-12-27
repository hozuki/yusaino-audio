import Heap from "./Heap";
import {HuffCluster} from "./HuffCluster";
import {select, enumerate, slice} from "./iterable";
import BitArray from "./BitArray";
import {default as HuffEncoder, HuffEntry} from "./HuffEncoder";
import HuffDecoder from "./HuffDecoder";
import arrayComparison from "./arrayComparison";

export default class HuffTree {

    constructor(histogram: number[][]) {
        const trees = histogram.slice();
        // console.log("Original trees: ", trees.join(", "));
        Heap.heapify(trees, arrayComparison);
        // console.log("Heap: ", trees.join(", "));
        while (trees.length > 1) {
            const [childRight, childLeft] = [Heap.pop(trees, arrayComparison), Heap.pop(trees, arrayComparison)];
            // console.log("Popped: ", childRight, childLeft);
            const parent = [childLeft[0] + childRight[0], childLeft, childRight];
            Heap.push(trees, parent, arrayComparison);
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
        // const dictIter = HuffTree.getDictionary(this.tree);
        // for (const i of dictIter) {
        //     console.log("dict entry: ", i[0], i[1].toString());
        // }
        const iter2 = HuffTree.getDictionary(this.tree);
        return new HuffEncoder(iter2);
    }

    static flatten(tree: HuffCluster): number[] {
        console.assert(tree.length > 2);
        // console.log("huffTree: ", tree);
        let l: number[] = [];
        for (const h of select(tree, slice([1, 3]))) {
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

    static *getDictionary(tree: HuffCluster, bits: BitArray = new BitArray()): Iterable<HuffEntry[]> {
        // console.log("trying to get tree of: ", tree, " with bits: ", bits.toString());
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