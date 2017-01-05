import * as fs from "fs";
import * as path from "path";
import * as commander from "commander";
import "babel-polyfill";
import Codifier from "./Codifier";
const pkg = require("../package.json");
const isValidPath = require("is-valid-path");

interface Options {
    wav?: string;
    cpp?: string;
}

main();

function main(): void {
    const options = parseArgs();
    checkArgs(options);
    if (!options.wav) {
        return;
    }
    console.info(`Encoding '${path.resolve(options.wav)}'...`);
    const file = fs.createReadStream(options.wav);
    const codifier = new Codifier();
    codifier
        .process(file)
        .then((): void => {
            writeToFile(codifier, options);
            console.log("Done.");
        });
}

function parseArgs(): Options {
    const command = new commander.Command(pkg.name);
    command
        .version(pkg.version)
        .arguments("<wav-file>")
        .option("-o, --cpp <file>", "C/C++ program source code output")
        .parse(process.argv);
    return {
        bits: Number.parseInt((<any>command)["bits"]),
        cpp: (<any>command)["cpp"] ? String((<any>command)["cpp"]) : void(0),
        wav: command.args[0],
    };
}

function checkArgs(options: Options): void {
    let failed = false;
    do {
        if (!options.wav) {
            console.error("Error: option <wav-file> is required.");
            failed = true;
            break;
        }
        if (!fs.existsSync(options.wav)) {
            console.error(`Error: Input wave audio file <${options.wav}> is not found.`);
            failed = true;
            break;
        }
        if (!options.cpp || !isValidPath(options.cpp)) {
            options.cpp = null;
        }
    } while (false);
    if (failed) {
        process.exit(1);
    }
}

function writeToFile(codifier: Codifier, options: Options): void {
    // Generate files.
    if (!options.cpp) {
        return;
    }
    try {
        const stat = fs.lstatSync(options.cpp);
        if (stat.isDirectory()) {
            console.error(`The path ${options.cpp} exists and it is a directory.`);
            return;
        }
    } catch (e) {
        // File not found, ignoring.
    }

    const headerFileName = options.cpp + ".h";
    const cppFileName = options.cpp + ".ino";
    console.info(`Writing to '${path.resolve(headerFileName)}' and '${path.resolve(cppFileName)}'...`);
    fs.writeFileSync(headerFileName, codifier.cppHeader);
    fs.writeFileSync(cppFileName, codifier.cppSource);
    console.info("All written.");
}
