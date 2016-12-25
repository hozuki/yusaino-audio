export default function histogram(sequence: number[], normalize: boolean = false): number[][] {
    // Value, Frequency
    const dict = new Map<number, number>();
    sequence.forEach(v => {
        if (!dict.has(v)) {
            dict.set(v, 0);
        }
        dict.set(v, dict.get(v) + 1);
    });
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
    const result: number[][] = [];
    for (let kv of dict) {
        result.push([kv[1] * nf, kv[0]]);
    }
    return result;
}
