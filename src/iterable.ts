function xrange1(stop: number): Iterable<number> {
    return xrange2(0, stop, 1);
}

function xrange2(start: number, stop: number, step: number = 1): Iterable<number> {
    const range: Iterable<number> = Object.create(null);
    let current = start;
    if (step > 0) {
        range[Symbol.iterator] = function *(): Iterator<number> {
            while (current < stop) {
                yield current;
                current += step;
            }
        };
    } else if (step < 0) {
        range[Symbol.iterator] = function *(): Iterator<number> {
            while (current > stop) {
                yield current;
                current += step;
            }
        };
    } else {
        throw new RangeError();
    }
    return range;
}

// See Python documentation: https://docs.python.org/2/library/functions.html#xrange
function xrange(stop: number): Iterable<number>;
function xrange(start: number, stop: number, step?: number): Iterable<number>;
function xrange(r1: number, r2?: number, r3?: number): Iterable<number> {
    if (arguments.length === 1) {
        return xrange1(r1);
    }
    if (arguments.length === 2 || arguments.length === 3) {
        return xrange2(r1, r2, r3);
    }
    throw new TypeError();
}

function select(obj: ArrayLike<any>, range: Iterable<number>, thisSelector?: (thiz: ArrayLike<any>|any) => ArrayLike<any>): Iterable<any>;
function *select<T>(obj: ArrayLike<T>, range: Iterable<number>, thisSelector: (thiz: ArrayLike<T>|any) => ArrayLike<T> = null): Iterable<T> {
    for (let i of range) {
        yield typeof thisSelector === "function" ? thisSelector(obj)[i] : obj[i];
    }
}

function *enumerate<T>(list: Iterable<T>): Iterable<{index: number, value: T}> {
    let current = 0;
    for (let v of list) {
        yield {index: current, value: v};
        ++current;
    }
}

export {xrange, select, enumerate};
