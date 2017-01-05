import ReadableStream = NodeJS.ReadableStream;
import * as assert from "assert";
import {WavFormat, Reader} from "wav";
import HuffTree from "./HuffTree";
import {PySliceable, xrange, izip, imap, chain} from "./iterable";
import histogram from "./histogram";

/**
 * The audio-to-code class.
 */
export default class Codifier {

    /**
     * Creates a new {@see Codifier} instance.
     */
    constructor() {
        this._data = [];
    }

    async process(stream: ReadableStream): Promise<void> {
        if (this.reader) {
            return;
        }
        const reader = this._reader = new Reader();
        return new Promise<void>((resolve, reject): void => {
            reader
                .on("format", (format): void => {
                    const formatInfoMessage = `Endian: ${format.endianness}\n`
                        + (format.signed ? "Signed\n" : "Unsigned\n")
                        + `Bit depth: ${format.bitDepth}\n`
                        + `Channels: ${format.channels}`;
                    console.info(formatInfoMessage);
                    if (!(supportedBitDepth.indexOf(format.bitDepth) >= 0 && format.channels === 1)) {
                        const requirementFailedMessage =
                            `The encoder requires a wave audio file with attributes: mono (1 channel), ${supportedBitDepth.join(",")} bits.\n`
                            + `Actual: ${format.bitDepth}bits, ${format.channels} channel(s)`;
                        reject(new TypeError(requirementFailedMessage));
                    }
                    this._format = format;
                })
                .on("data", (data: Buffer): void => {
                    this.data.push(...data);
                })
                .on("end", (): void => {
                    this.__transformAudio();
                    this.__compressAudio();
                    resolve();
                })
                .on("error", (err: Error): void => {
                    reject(err);
                });
            stream.pipe(reader);
        });
    }

    get cppSource(): string {
        return this._cppSource;
    }

    get cppHeader(): string {
        return this._cppHeader;
    }

    get data(): number[] {
        return this._data;
    }

    get differentialData(): number[] {
        return this._differentialData;
    }

    get reader(): Reader {
        return this._reader;
    }

    get format(): WavFormat {
        return this._format;
    }

    private __transformAudio(): void {
        const format = this.format;
        const byteDepth = format.bitDepth / 8;

        // If the original audio is 8-bit, the transformation is simple.
        if (byteDepth === 1) {
            this._differentialData = this.__transformAudio8();
            return;
        }

        // Other bit depths are more complicated.
        // Arduino's endianness is little endian. Our target is to ensure the transformed data is always in little
        // endian. And then if it is not 8-bit audio, we need to recover its original bit depth (e.g. 16-bit), calculate
        // differential in original bit depth, and store the differential in 8-bit (bytes).
        const originalBuffer = this.data;

        // Deal with endianness.
        let littleEndianBuffer: number[];
        switch (format.endianness) {
            case "LE":
                littleEndianBuffer = originalBuffer.slice();
                break;
            case "BE":
                littleEndianBuffer = [];
                const buffer: number[] = new Array<number>(byteDepth);
                // Swap endianness
                for (let i = 0; i < originalBuffer.length; i += byteDepth) {
                    for (let j = 0; j < byteDepth; ++j) {
                        buffer[j] = originalBuffer[i + j];
                    }
                    littleEndianBuffer.push(...buffer.reverse());
                }
                break;
            default:
                throw new RangeError("Out of range: endianness.");
        }

        // Now recover the original values.
        let originalValueBuffer: number[] = [];
        for (let i = 0; i < littleEndianBuffer.length; i += byteDepth) {
            let value = 0;
            for (let j = 0; j < byteDepth; ++j) {
                value = (littleEndianBuffer[i + j] << (8 * j)) | value;
            }
            if (format.signed) {
                value = unsignedToSigned(value, format.bitDepth);
            }
            originalValueBuffer.push(value);
        }

        // Constrain the audio samples to half of 16-bit, so that their differential will fall into 16-bit range.
        // Scale them if needed.
        let peakMax: number, peakMin: number, center: number, sampleRangeMax: number;
        if (format.signed) {
            peakMax = 16383;
            peakMin = -16384;
            center = 0;
            sampleRangeMax = (1 << (format.bitDepth - 1)) - 1;
        } else {
            peakMax = 32767;
            peakMin = 0;
            center = 16384;
            sampleRangeMax = (1 << format.bitDepth) - 1;
        }
        if (originalValueBuffer.some(v => v > peakMax || v < peakMin)) {
            const scale = peakMax / sampleRangeMax;
            for (let i = 0; i < originalValueBuffer.length; ++i) {
                const v = Math.round(((originalValueBuffer[i] - center) * scale) + center);
                originalValueBuffer[i] = Math.min(peakMax, Math.max(v, peakMin));
            }
        }

        // Calculate the differential. Incremental encoding is a good idea, which narrows down the possible value range,
        // leading to a smaller Huffman tree and a shorter encoded form.
        // Equals to:
        // ```
        // differential[0] = originalValueBuffer[0];
        // for (let i = 1; i < originalValueBuffer.length - 1; ++i) {
        //     differential[i] = originalValueBuffer[i + 1] - originalValueBuffer[i];
        // }
        // ```
        this._differentialData = diff(originalValueBuffer);
    }

    /**
     * Special case for 8-bit audio.
     * @returns {number[]}
     * @private
     */
    private __transformAudio8(): number[] {
        const format = this.format;

        let dataForDiff: number[];
        if (format.signed) {
            dataForDiff = [];
            for (const v of this.data) {
                dataForDiff.push(unsignedToSigned(v, 8));
            }
        } else {
            dataForDiff = this.data;
        }

        return diff(dataForDiff);
    }

    private __compressAudio(): void {
        // This `data` is already differentiated.
        const data = this.differentialData;
        const format = this.format;

        // Build the Huffman tree.
        const hist = histogram(data);
        const huffTree = this._huffmanTree = new HuffTree(hist);
        const encoder = huffTree.getEncoder();
        const encodedBitArray = encoder.encode(data);

        // Show info.
        const originalBits = data.length * format.bitDepth, encodedBits = encodedBitArray.length;
        const compressionRatio = ((encodedBits / originalBits * 10000) | 0) / 10000;
        const compressionInfo = `Original bits: ${originalBits} [${round(originalBits / 8, 2)} byte(s)]\n`
            + `Encoded bits: ${encodedBits} [${round(encodedBits / 8, 2)} byte(s)]\n`
            + `Compression ratio: ${compressionRatio * 100}%`;
        console.info(compressionInfo);
        const decoder = huffTree.getDecoder();
        console.info(`Decoder length: ${decoder.length} word(s)`);

        // Generate source code strings.
        this._cppHeader = `
#ifndef __ARDUINO_SOUND_DATA__
#define __ARDUINO_SOUND_DATA__

extern const uint_fast32_t SampleRate;
extern const int_fast8_t SampleBits;
extern const boolean SampleSigned;

extern int_fast16_t const HuffDict[];
extern uint_fast32_t const SoundDataBits;
extern uint_fast8_t const SoundData[];

#endif
`;
        let cppSource = "";
        cppSource += `const uint_fast32_t SampleRate = ${format.sampleRate};\n`;
        cppSource += `const int_fast8_t SampleBits = ${format.bitDepth};\n`;
        cppSource += `const boolean SampleSigned = ${format.signed};\n\n`;
        cppSource += `const int_fast16_t HuffDict[${decoder.length}] PROGMEM = {\n${arrayFormatter(decoder.dictionary)}\n};\n\n`;
        cppSource += `const uint_fast32_t SoundDataBits = ${encodedBitArray.length};\n`;
        cppSource += `const uint8_t SoundData[${encodedBitArray.data.length}] PROGMEM = {\n${arrayFormatter(encodedBitArray.data)}\n};\n`;
        this._cppSource = cppSource;

        // Test
        const decodedData = Array.from(decoder.decode(encodedBitArray));
        try {
            assert.deepEqual(decodedData, data);
            console.info("Decoding test successful.")
        } catch (e) {
            console.error("Decoding test failed: " + e.message);
        }
    }

    private _data: number[] = null;
    private _differentialData: number[] = null;
    private _format: WavFormat = null;
    private _reader: Reader = null;
    private _cppSource: string = null;
    private _cppHeader: string = null;
    private _huffmanTree: HuffTree = null;

}

/**
 * A list of supported bit depth.
 * @type {number[]}
 */
const supportedBitDepth: number[] = [8, 16];

/**
 * Format a array to a string, and breaks by a new line every N numbers.
 * @param array {number[]} The number array.
 * @param perLine {number} How many numbers are there in a line.
 * @returns {string} The formatted string.
 */
function arrayFormatter(array: number[], perLine: number = 40): string {
    const arr: string[] = [];
    for (const item of grouper(perLine, array)) {
        arr.push(item.join(", "));
    }
    return arr.join(",\n");

    function *grouper(n: number, array: Iterable<number>): Iterable<number[]> {
        const it = array[Symbol.iterator]();
        while (true) {
            const l = Array.from(imap(([_, v]) => v, izip(xrange(n), it)));
            if (l.length > 0) {
                yield l;
            }
            if (l.length < n) {
                break;
            }
        }
    }
}

function round(n: number, digits: number): number {
    const power = Math.pow(10, digits);
    return ( (n * power) | 0) / power;
}

/**
 * Converts a signed value to its equivalent in unsigned form.
 * For example, given bitDepth=8, then -1(0xff) is equal to 255(0xff).
 * @param n {number} Original number.
 * @param bitDepth {number} Bit depth.
 * @returns {number} The unsigned equivalent.
 */
function signedToUnsigned(n: number, bitDepth: number): number {
    // Mask the only bits necessary.
    const bitMask = 0xffffffff >>> (32 - bitDepth);
    return (n | 0) & bitMask;
}

/**
 * Converts a unsigned value to its equivalent in signed form.
 * For example, given bitDepth=8, then 255(0xff) is equal to -1(0xff).
 * @param n {number} Original number.
 * @param bitDepth {number} Bit depth.
 * @returns {number} The signed equivalent.
 */
function unsignedToSigned(n: number, bitDepth: number): number {
    // Mask the only bits necessary.
    const bitMask = 0xffffffff >>> (32 - bitDepth);
    n = (n | 0) & bitMask;
    const signMask = 1 << (bitDepth - 1);
    const isSigned = n & signMask;
    // JavaScript's 32-bit integers are signed.
    return isSigned ? (n | (0xffffffff << bitDepth)) : n;
}

function diff(values: number[]): number[] {
    const sound = <number[] & PySliceable<number>>values;
    return Array.from(chain([sound[0]], imap(x => x[1] - x[0], izip(sound.pySlice([, -1]), sound.pySlice([1,])))));
}
