import {reversed, xrange} from "./iterable";

type Comparison = (x: any, y: any) => number;

// Mostly https://github.com/qiao/heap.js
// https://svn.python.org/projects/python/tags/r32/Lib/heapq.py
abstract class Heap {

    // JavaScript array comparison: for each element
    // e.g.: [1, 3, 4] > [1, 2, 4] (true)
    //       [3, 4, 5] > [1, 8, 9] (true)
    //       [1, 2] > [1, 2] (false)
    static heapify(list: any[], comparison: Comparison = defaultComparison): void {
        for (const i of reversed(xrange((list.length / 2) | 0))) {
            Heap.__shiftUp(list, i, comparison);
        }
    }

    static push(list: any[], value: any, comparison: Comparison = defaultComparison): void {
        list.push(value);
        Heap.__shiftDown(list, 0, list.length - 1, comparison);
    }

    static pop(list: any[], comparison: Comparison = defaultComparison): any {
        const lastItem = list.pop();
        let returnItem;
        if (list.length === 0) {
            returnItem = lastItem;
        } else {
            returnItem = list[0];
            list[0] = lastItem;
            Heap.__shiftUp(list, 0, comparison);
        }
        return returnItem;
    }

    static replace(list: any[], value: any, comparison: Comparison = defaultComparison): any {
        const returnItem = list[0];
        list[0] = value;
        Heap.__shiftUp(list, 0, comparison);
        return returnItem;
    }

    static pushPop(list: any[], value: any, comparison: Comparison = defaultComparison): any {
        if (list.length > 0 && comparison(list[0], value) < 0) {
            [value, list[0]] = [list[0], value];
            Heap.__shiftUp(list, 0, comparison);
        }
        return value;
    }

    private static __shiftDown(list: any[], start: number, position: number, comparison: Comparison = defaultComparison): void {
        const newItem = list[position];
        while (position > start) {
            const parentPosition = (position - 1) >> 1;
            const parent = list[parentPosition];
            if (comparison(newItem, parent) < 0) {
                list[position] = parent;
                position = parentPosition;
                continue;
            }
            break;
        }
        list[position] = newItem;
    }

    private static __shiftUp(list: any[], position: number, comparison: Comparison = defaultComparison): void {
        const endPosition = list.length;
        const startPosition = position;
        const newItem = list[position];
        let childPosition = position * 2 + 1;
        // console.log("childpos(invoke): ", childPosition);
        while (childPosition < endPosition) {
            const rightPosition = childPosition + 1;
            // if (rightPosition < endPosition) {
            //     console.log(`[${childPosition} ${rightPosition}] = `, list[childPosition], list[rightPosition]);
            // }
            if (rightPosition < endPosition && !(comparison(list[childPosition], list[rightPosition]) < 0)) {
                // console.log(`exception: [${childPosition} ${rightPosition}] = `, list[childPosition], list[rightPosition]);
                childPosition = rightPosition;
            }
            list[position] = list[childPosition];
            position = childPosition;
            childPosition = position * 2 + 1;
            // console.log("childpos: ", childPosition);
        }
        list[position] = newItem;
        Heap.__shiftDown(list, startPosition, position, comparison);
    }

}

function defaultComparison(x: any, y: any): number {
    return x > y ? 1 : (x < y ? -1 : 0);
}

export default Heap;
