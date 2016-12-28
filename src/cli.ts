import * as fs from "fs";
import * as path from "path";
import * as assert from "assert";
import * as wav from "wav";
import {WavFormat} from "wav";
import * as commander from "commander";
import "babel-polyfill";
import histogram from "./histogram";
import HuffTree from "./HuffTree";
import {chain, imap, izip, select, slice, xrange} from "./iterable";
const pkg = require("../package.json");
const isValidPath = require("is-valid-path");

interface Options {
    bits?: number;
    wav?: string;
    cpp?: string;
}

main();

function main() {
    const options = parseArgs();
    checkArgs(options);
    if (!options.wav) {
        return;
    }
    console.info(`Encoding '${path.resolve(options.wav)}'...`);
    const file = fs.createReadStream(options.wav);
    const reader = new wav.Reader();
    let buffer: number[] = [];
    let wavFormat: WavFormat = null;
    reader
        .on("format", (format) => {
            if (!(format.bitDepth === 8 && format.channels === 1 && !format.signed)) {
                throw new TypeError("The encoder requires a wave audio file with attributes: mono (1 channel), unsigned 8-bit depth.");
            }
            wavFormat = format;
        })
        .on("data", (data: Buffer) => {
            const a = <number[]>Array.from(data);
            buffer.push(...a);
        })
        .on("end", () => {
            processAudio(buffer, wavFormat, options);
        })
        .on("error", (err: Error) => {
            console.error(err.message);
        });
    file.pipe(reader);
}

function parseArgs(): Options {
    const command = new commander.Command(pkg.name);
    command
        .version(pkg.version)
        .arguments("<wav-file>")
        .option("-b, --bits <bits>", "Bit resolution", 8)
        .option("-o, --cpp <file>", "C/C++ program source code output")
        .parse(process.argv);
    const options: Options = {
        bits: Number.parseInt((<any>command)["bits"]),
        cpp: String((<any>command)["cpp"]),
        wav: command.args[0],
    };
    if ([7, 8, 9].indexOf(options.bits) < 0) {
        options.bits = 8;
    }
    return options;
}

function checkArgs(options: Options): void {
    let failed = false;
    do {
        if (!options.wav) {
            console.error("error: option <wav-file> is required.");
            failed = true;
            break;
        }
        if (!fs.existsSync(options.wav)) {
            console.error(`error: Input wave audio file <${options.wav}> is not found.`);
            failed = true;
            break;
        }
        if (options.cpp && !isValidPath(options.cpp)) {
            options.cpp = null;
        }
    } while (false);
    if (failed) {
        process.exit(1);
    }
}

function processAudio(uint8Audio: number[], format: WavFormat, options: Options): void {
    // Unsigned to signed
    const audio = uint8Audio.slice();
    for (let i = 0; i < uint8Audio.length; ++i) {
        audio[i] -= 128;
    }
    // Calculate the difference. Incremental encoding is a good idea, which narrows down the possible value range,
    // leading to a smaller Huffman tree and a shorter encoded form.
    const sint8Audio: number[] = Array.from(chain(audio[0], imap(x => x[1] - x[0], izip(select(audio, slice([, -1])), select(audio, slice([1,]))))));
    // Equals to:
    // sint8Audio[0] = audio[0];
    // for (let i = 1; i < audio.length - 1; ++i) {
    //     sint8Audio[i] = audio[i + 1] - audio[i];
    // }

    // Build the Huffman tree.
    const hist = histogram(sint8Audio);
    const huffTree = new HuffTree(hist);
    const encoder = huffTree.getEncoder();
    const encodedBitArray = encoder.encode(sint8Audio);

    // Show info.
    const originalBits = sint8Audio.length * 8, encodedBits = encodedBitArray.length;
    const compressionRatio = ((encodedBits / originalBits * 10000) | 0) / 10000;
    console.info(`Original bits: ${originalBits}, Encoded bits: ${encodedBits}, Compression ratio: ${compressionRatio * 100}%`);
    const decoder = huffTree.getDecoder();
    console.info(`Decoder length: ${decoder.dictionaryLength} word(s)`);

    // Generate files.
    (() => {
        try {
            const stat = fs.lstatSync(options.cpp);
            if (stat.isDirectory()) {
                console.error(`The path ${options.cpp} exists and it is a directory.`);
                return;
            }
        } catch (e) {
        }
        const headerFileName = options.cpp + ".h";
        const cppFileName = options.cpp + ".ino";

        console.info(`Writing to '${path.resolve(headerFileName)}' and '${path.resolve(cppFileName)}'...`);
        fs.writeFileSync(headerFileName, `
extern const int SampleRate;
extern const int SampleBits;

extern const signed int HuffDict[];
extern const unsigned long SoundDataBits;
extern const uint8_t SoundData[] PROGMEM;`);

        const fd = fs.openSync(cppFileName, "w");
        fs.writeSync(fd, `const int SampleRate = ${format.sampleRate};\n`);
        fs.writeSync(fd, `const int SampleBits = 8;\n\n`);
        fs.writeSync(fd, `const signed int HuffDict[${decoder.dictionaryLength}] = {\n${arrayFormatter(decoder.dictionary)}\n};\n\n`);
        fs.writeSync(fd, `const unsigned long SoundDataBits = ${encodedBitArray.length}UL;\n`);
        fs.writeSync(fd, `const uint8_t SoundData[${encodedBitArray.data.length}] PROGMEM = {\n${arrayFormatter(encodedBitArray.data)}\n};\n`);
        fs.closeSync(fd);
    })();

    // Test
    const decodedData = Array.from(decoder.decode(encodedBitArray));
    try {
        assert.deepEqual(decodedData, sint8Audio);
        console.info("Decoding test successful.")
    } catch (e) {
        console.error(e.message);
    }
}

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
