import "babel-polyfill";
import histogram from "./histogram";
import HuffTree from "./HuffTree";
import * as assert from "assert";

(() => {
    const testData = [3, 4, 5, 3, 0, 2, 9, 8, 3, 10, 3, 7, 2, 5, 6];
    const hist = histogram(testData);
    const tree = new HuffTree(hist);
    const encoder = tree.getEncoder(), decoder = tree.getDecoder();
    const encData = encoder.encode(testData);
    const decGen = decoder.decode(encData);
    console.log("Test data: ", testData);
    console.log("Enc: ", "[" + Array.from(encData).join(", ") + "]");
    const decData = Array.from(<any>decGen);
    console.log("Dec: ", decData);
    try {
        const compressionRatio = encData.length / (testData.length * 8);
        console.info(`Compression ratio: ${((compressionRatio * 10000) | 0) / 100}%`);
        assert.deepEqual(decData, testData, "Decode data does not equal to original test data.");
        console.info("Test OK.");
    } catch (err) {
        console.error(err);
    }
})();