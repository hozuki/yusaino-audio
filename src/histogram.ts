/**
 * Gets the frequency histogram of a number sequence.
 * @param sequence {ArrayLike<number>} The number sequence.
 * @param [normalize] {boolean} Whether normalize the frequency or not.
 * @returns {number[][]} The histogram in an array of [frequency, value]. If the histogram is normalized, frequency
 * will be the ratio of corresponding element appearance, rather than the rate of appearance.
 */
export default function histogram(sequence: ArrayLike<number>, normalize: boolean = false): number[][] {
    // Value, Frequency
    const dict = new Map<number, number>();
    for (let i = 0; i < sequence.length; ++i) {
        const v = sequence[i];
        if (!dict.has(v)) {
            dict.set(v, 0);
        }
        dict.set(v, dict.get(v) + 1);
    }
    let nf;
    if (normalize) {
        let sum = 0;
        for (let v of dict.values()) {
            sum += v;
        }
        nf = 1 / sum;
    } else {
        nf = 1;
    }
    // Frequency, Value
    const result: number[][] = [];
    for (let kv of dict) {
        result.push([kv[1] * nf, kv[0]]);
    }
    result.sort((a, b) => a[1] - b[1]);
    return result;
}
