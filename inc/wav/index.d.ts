declare module "wav" {

    interface Reader extends NodeJS.ReadWriteStream {

        on(event: "chunk", listener: Function): this;
        on(event: "format", listener: (format: WavFormat) => any): this;
        on(event: string, listener: Function): this;

    }

    const Reader: {
        prototype: Reader;
        new(): Reader;
    };

    interface Writer extends NodeJS.WritableStream {

        on(event: "chunk", listener: Function): this;
        on(event: "header", listener: Function): this;
        on(event: string, listener: Function): this;

    }

    const Writer: {
        prototype: Writer;
        new(): Writer;
    };

    interface FileWriter extends Writer {
    }

    const FileWriter: {
        prototype: FileWriter;
        new(): FileWriter;
    };

    interface WavFormat extends SpeakerFormat {
        byteRate?: number;
        blockAlign?: number;
        endianness?: Endianness;
    }

    type Endianness = "LE" | "BE";

}
