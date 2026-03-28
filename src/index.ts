import { getFlext, getFlextSync, getBuffer, getBufferSync } from '@/lib';
import { MixedSyncResult, FlextFileInterface } from '@/types';
import Flext from '@trustme24/flext';


// Classes

export class FlextFile implements FlextFileInterface {
    public data: Flext;

    constructor(val?: Flext | ArrayBuffer) {
        if (val) {
            if (val instanceof ArrayBuffer)
                this.data = getFlextSync(val);
            else
                this.data = val;
        }
    }

    public static from(val: Flext | ArrayBuffer, async: true): Promise<FlextFile>;
    public static from(val: Flext | ArrayBuffer, async?: false): FlextFile;
    public static from<P extends boolean = false>(val: Flext | ArrayBuffer, async?: P): MixedSyncResult<P, FlextFile> {
        if (!async) return new FlextFile().setData(val) as MixedSyncResult<P, FlextFile>;

        return new Promise((resolve, reject) => {
            new FlextFile().setData(val, true).then(resolve).catch(reject);
        }) as MixedSyncResult<P, FlextFile>;
    }

    public setData(val: Flext | ArrayBuffer, async: true): Promise<this>;
    public setData(val: Flext | ArrayBuffer, async?: false): this;
    public setData<P extends boolean = false>(val: Flext | ArrayBuffer, async?: P): MixedSyncResult<P, this> {
        if (!async) {
            if (val instanceof ArrayBuffer)
                this.data = getFlextSync(val);
            else
                this.data = val;

            return this as MixedSyncResult<P, this>;
        }

        return new Promise((resolve, reject) => {

            // Doing some checks

            if (val instanceof Flext) {
                this.data = val;
                return;
            }


            // Getting the data

            getFlext(val).then(result => {
                this.data = result;
                resolve(this);
            }).catch(reject);
        }) as MixedSyncResult<P, this>;
    }

    public async getBuffer(): Promise<ArrayBuffer> {
        return await getBuffer(this.data);
    }

    public async getBlob(): Promise<Blob> {
        const buffer = await getBuffer(this.data);
        return new Blob([ buffer ], { type: 'application/zip' });
    }

    public get buffer(): ArrayBuffer {
        return getBufferSync(this.data);
    }

    public get blob(): Blob {
        return new Blob([ this.buffer ], { type: 'application/zip' });
    }
}


export default FlextFile;

export { getFlext, getFlextSync, getBuffer, getBufferSync };
