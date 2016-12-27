import * as fs from "fs";
import * as assert from "assert";
import * as wav from "wav";
import * as commander from "commander";
import "babel-polyfill";
import histogram from "./histogram";
import HuffTree from "./HuffTree";
import {chain, imap, izip, select, slice} from "./iterable";
const pkg = require("../package.json");
const isValidPath = require("is-valid-path");
const Speaker = require("speaker");

interface Options {
    bits?: number;
    wav?: string;
    cpp?: string;
}

main();

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
        if (!isValidPath(options.cpp)) {
            options.cpp = null;
        }
    } while (false);
    if (failed) {
        process.exit(1);
    }
}

function main() {
    const options = parseArgs();
    checkArgs(options);
    if (options.wav) {
        const file = fs.createReadStream(options.wav);
        const reader = new wav.Reader();
        let buffer: number[] = [];
        // let speaker: Speaker.Speaker = null;
        reader
            .on("format", (format) => {
                // speaker = new Speaker(format);
                // reader.pipe(speaker);
                console.log(format);
            })
            .on("data", (data: Buffer) => {
                const a = <number[]>Array.from(data);
                buffer.push(...a);
            })
            .on("end", () => {
                processAudio(buffer);
            });
        file.pipe(reader);
    }
}

function processAudio(buffer: number[]): void {
    // Unsigned to signed
    for (let i = 0; i < buffer.length; ++i) {
        buffer[i] = buffer[i] - 128;
    }
    const buffer2: number[] = Array.from(chain(buffer[0], imap(x => x[1] - x[0], izip(select(buffer, slice([, -1])), select(buffer, slice([1,]))))));

    const hist = histogram(buffer2);
    console.info("Histogram: ", hist);
    const huffTree = new HuffTree(hist);
    const decoder = huffTree.getDecoder(), encoder = huffTree.getEncoder();
    const encodedBitArray = encoder.encode(buffer2);

    console.info("Original bits: ", buffer2.length * 8);
    console.info("Encoded bits: ", encodedBitArray.length);
    console.info("Compression ratio: ", (encodedBitArray.length / (buffer2.length * 8)));
    console.info(`Decoder length: ${decoder.length} word(s)`);

    const decodedData = Array.from(<any>decoder.decode(encodedBitArray));
    assert.deepEqual(decodedData, buffer2);
}
