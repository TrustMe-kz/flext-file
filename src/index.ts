import { getFlext, getFlextSync, getBuffer, getBufferSync } from '@/lib';
import Flext from '@trustme24/flext';


// Classes

export class FlextFile {
    public flext: Flext;

    constructor(val?: Flext | ArrayBuffer) {
        if (val) {
            if (val instanceof ArrayBuffer)
                this.flext = getFlextSync(val);
            else
                this.flext = val;
        }
    }

    public static from(val: Flext | ArrayBuffer): FlextFile {
        return new FlextFile(val);
    }

    public static async fromBuffer(val: ArrayBuffer): Promise<FlextFile> {
        const flext = await getFlext(val);
        return FlextFile.from(flext);
    }

    public async getBuffer(): Promise<ArrayBuffer> {
        return await getBuffer(this.flext);
    }

    public async getBlob(): Promise<Blob> {
        const buffer = await getBuffer(this.flext);
        return new Blob([ buffer ], { type: 'application/zip' });
    }

    public get buffer(): ArrayBuffer {
        return getBufferSync(this.flext);
    }

    public get blob(): Blob {
        return new Blob([ this.buffer ], { type: 'application/zip' });
    }
}


export default FlextFile;

export { getFlext, getFlextSync, getBuffer, getBufferSync };
