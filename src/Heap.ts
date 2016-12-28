import {reversed, xrange} from "./iterable";

type Comparison = (x: any, y: any) => number;

// Mostly https://github.com/qiao/heap.js
// https://svn.python.org/projects/python/tags/r32/Lib/heapq.py
/**
 * I guess no documentation is need for this class. :)
 */
abstract class Heap {

    static heapify(list: any[], comparison: Comparison = defaultComparison): void {
        for (const i of reversed(xrange(div(list.length, 2)))) {
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
        while (childPosition < endPosition) {
            const rightPosition = childPosition + 1;
            if (rightPosition < endPosition && !(comparison(list[childPosition], list[rightPosition]) < 0)) {
                childPosition = rightPosition;
            }
            list[position] = list[childPosition];
            position = childPosition;
            childPosition = position * 2 + 1;
        }
        list[position] = newItem;
        Heap.__shiftDown(list, startPosition, position, comparison);
    }

}

/**
 * Python-flavored array comparison.
 *
 * By default, JavaScript compare two arrays based on their object address in memory (I guess). You will see such
 * results:
 * [1] > [1]: false; [1] < [1]: false; [1] == [1]: false;
 *
 * Python consider arrays as lists. The comparison follow this rule:
 * 1. If both element are numbers, compare them by arithmetic comparison (subtraction);
 * 2. If one of the element is an array, and the other is a number, the array element is "longer" and "larger";
 * 3. If both elements are arrays, compare them element by element;
 * 4. If both elements are arrays and they seem equal compared by rule #3, but then one array ends and the other stands,
 * the longer one is larger.
 *
 * @param a
 * @param b
 * @returns {number}
 */
function defaultComparison(a: any, b: any): number {
    const aIsArray = Array.isArray(a), bIsArray = Array.isArray(b);
    if (aIsArray !== bIsArray) {
        return aIsArray ? 1 : -1;
    } else {
        if (!aIsArray) {
            return a > b ? 1 : (a < b ? -1 : 0);
        } else {
            const len1 = a.length, len2 = b.length;
            const len = Math.min(len1, len2);
            for (let i = 0; i < len; ++i) {
                const r = defaultComparison(a[i], b[i]);
                if (r !== 0) {
                    return r;
                }
            }
            return len1 > len2 ? 1 : (len1 < len2 ? -1 : 0);
        }
    }
}

function div(numerator: number, denominator: number): number {
    return (numerator / denominator) | 0;
}

export default Heap;
