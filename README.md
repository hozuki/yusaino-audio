# Yusaino-Audio

A migration of Thomas Grill's [audio compression solution for Arduino](http://grrrr.org/2011/06/30/arduino-compressed_audio/),
from Python 2 to JavaScript.

This repository contains the audio encoding and decoding (on computer) part. For hardware playback,
please see [Yusaino](later-XD). By re-coding, I am able to understand the whole design.

The main reason of choosing JavaScript is I don't know Python well. After the immigration, I felt
strong attractions from both Python and JavaScript, and their resemblance deep within. Thomas heavily
used iterator pattern in his original code, and I tried to keep those by writing JavaScript equivalents.
In the final JavaScript code, you can see a huge likelihood with the original code. For example:

```python
dsound8 = map(int,chain((sound8[0],),imap(lambda x: x[1]-x[0],izip(sound8[:-1],sound8[1:]))))
```

```javascript
const sint8Audio = Array.from(chain([audio[0]], imap(x => x[1] - x[0], izip(select(audio, slice([, -1])), select(audio, slice([1,]))))));
```

Yeah, I wrote `chain`, `imap`, `izip`, `select`, and `slice` myself. It's a good practice.

For more details please see comments in the code.

## Requirements

Node.js v6.0 and up is required to natively support many ES2015 features. I think the script can also
run in modern browsers that support ES2015, but I haven't written a browser wrapper yet.

It is pure JavaScript so running on all platforms is not a dream. Damn you [scikits.audiolab](https://pypi.python.org/pypi/scikits.audiolab/)!

## Usage

```shell
yusaino-audio [options] <wav-file>
```

Options:

    -h, --help         output usage information
    -V, --version      output the version number
    -b, --bits <bits>  Bit resolution (not implemented)
    -o, --cpp <file>   C/C++ program source code output

The script needs a wave audio file, with these attributes:

- bit depth: 8
- channels: 1 (mono)
- signed: no (unsigned)

## Naming

The name comes from [Kozue Yusa](http://www.project-imas.com/wiki/Kozue_Yusa). But no I am not a
lolicon, faithfully. I just *happened* to win a card of her. ☺

Another introduction from [Moegirl wiki](https://zh.moegirl.org/zh/%E6%B8%B8%E4%BD%90%E6%A2%A2) (originally
in Chinese):

> Kozue Yusa is a loli idol appearing in The Idolmaster Cinderella Girls.
>
> ---
>
> She is introduced on July 17, 2013, when a new region *Okinawa* is opened.
>
> As a loli idol aged 11, her figure data is still below that of an average 9-year-old Japanese girl.
> She is one of the smallest characters in the whole game.
>
> Her inner attributes are unexpectedly immature. She doesn't speak fluently, and she doesn't understand
> the meaning of words like "idol" and "interest" at the first appearance. She isn't even sure about
> her age. So she shows a strong dependency towards others: she needs help to change her clothes<del>,
> a bliss for lolicons</del>; she doesn't feel wrong when changing clothes in front of the public<del>,
> a bliss for lolicons</del>; she takes sitting, leaning and sleeping on the producer for granted<del>,
> a heaven for lolicons</del>.
>
> On the contrary, she has a great talent in memorizing the scripts. 

## License

GPLv3
