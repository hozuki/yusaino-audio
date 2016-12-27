declare module "speaker" {

    export = Speaker.Speaker;

}

declare module Speaker {

    interface Speaker extends NodeJS.WritableStream {

        on(event: "open", callback: Function): this;
        on(event: "flush", callback: Function): this;
        on(event: "close", callback: Function): this;
        on(event: string, listener: Function): this;

    }

    const Speaker: {
        new(format: SpeakerFormat): Speaker;
        prototype: Speaker;
    };

}

interface SpeakerFormat {
    channels?: number;
    bitDepth?: number;
    sampleRate?: number;
    signed?: boolean;
    float?: boolean;
    samplesPerFrame?: boolean;
}
