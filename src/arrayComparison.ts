export default function arrayComparison(a: any, b: any): number {
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
                const r = arrayComparison(a[i], b[i]);
                if (r !== 0) {
                    return r;
                }
            }
            return len1 > len2 ? 1 : (len1 < len2 ? -1 : 0);
        }
    }
}
