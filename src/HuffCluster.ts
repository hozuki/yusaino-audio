// [1, 2]
// [1, [2, 3], [4, [2, 3]]]
type Huff = (number|number[])[];
type HuffCluster = (number|number[]|Huff)[]

export {Huff, HuffCluster};
