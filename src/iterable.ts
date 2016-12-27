import Slice from "./Slice";

function xrange1(stop: number): Iterable<number> {
    return xrange2(0, stop, 1);
}

function xrange2(start: number, stop: number, step: number = 1): Iterable<number> {
    const range: Iterable<number> = Object.create(null);
    if (start === void(0)) {
        start = 0;
    }
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

function select(obj: ArrayLike<any>, slice: Slice, thisSelector?: (thiz: ArrayLike<any>|any) => ArrayLike<any>): Iterable<any>;
function *select<T>(obj: ArrayLike<T>, slice: Slice, thisSelector: (thiz: ArrayLike<T>|any) => ArrayLike<T> = null): Iterable<T> {
    const thiz = typeof thisSelector === "function" ? thisSelector(obj) : obj;
    const start = slice.start;
    const stop = slice.stop > 0 ? slice.stop : thiz.length + slice.stop;
    const step = slice.step;
    if (step > 0) {
        for (let i = start; i < stop; i += step) {
            yield thiz[i];
        }
    } else if (step < 0) {
        for (let i = start; i > stop; i += step) {
            yield thiz[i];
        }
    } else {
        throw new RangeError();
    }
}

function *enumerate<T>(list: Iterable<T>): Iterable<{index: number, value: T}> {
    let current = 0;
    for (const v of list) {
        yield {index: current, value: v};
        ++current;
    }
}

function *reversed<T>(list: Iterable<T>): Iterable<T> {
    const buffer: T[] = [];
    for (const item of list) {
        buffer.push(item);
    }
    for (let i = buffer.length - 1; i >= 0; --i) {
        yield buffer[i];
    }
}

function *izip<T1, T2>(it1: Iterable<T1>, it2: Iterable<T2>): Iterable<(T1|T2)[]> {
    const i1: Iterator<T1> = it1[Symbol.iterator](), i2: Iterator<T2> = it2[Symbol.iterator]();
    let v1 = i1.next(), v2 = i2.next();
    while (!v1.done && !v2.done) {
        const t1 = v1.value;
        const t2 = v2.value;
        yield [t1, t2];
        v1 = i1.next();
        v2 = i2.next();
    }
}

function *imap(func?: (x: Iterable<any>) => any, ...its: Iterable<any>[]): Iterable<any> {
    const argsLength = its.length;
    if (argsLength === 0) {
        return;
    }
    const iterators: Iterator<any>[] = [];
    for (let i = 0; i < argsLength; ++i) {
        iterators[i] = its[i][Symbol.iterator]();
    }
    const argValues: any[] = new Array(argsLength);
    while (true) {
        for (let i = 0; i < argsLength; ++i) {
            const ir = iterators[i].next();
            if (ir.done) {
                return;
            }
            argValues[i] = ir.value;
        }
        if (typeof func === "function") {
            yield func.apply(this, argValues.slice());
        } else {
            yield argValues.slice();
        }
    }
}

function *chain(...iterables: (Iterable<any>|number)[]): Iterable<any> {
    for (const it of iterables) {
        if (typeof it === "number") {
            yield it;
        } else {
            for (const elem of it) {
                yield elem;
            }
        }
    }
}

function slice(slice: number[]): Slice;
function slice(start?: number, stop?: number, step?: number): Slice;
function slice(start?: any, stop?: any, step?: any): Slice {
    if (Array.isArray(start)) {
        return sliceInternal(start[0], start[1], start[2]);
    } else {
        return sliceInternal(start, stop, step);
    }
}

function sliceInternal(start: number = 0, stop: number = -1, step: number = 1): Slice {
    return {
        start: start,
        stop: stop,
        step: step
    };
}

export {xrange, select, enumerate, reversed, izip, imap, chain, slice};
