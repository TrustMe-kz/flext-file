import JSZip from 'jszip';
// @ts-ignore
import JSZipSync from 'jszip-sync';
import Flext from '@trustme24/flext';


// Third-parties

// const zip = new JSZip();


// Types

export type MixedSyncOptions = {
    sync?: boolean|null,
};

export type MixedSyncResult<O extends MixedSyncOptions, T = any> = O['sync'] extends true ? T : Promise<T>;

export type BundleToFlextFileHandler<O extends MixedSyncOptions, T = any> = (filename: string, type: string) => MixedSyncResult<O, T>;

export type BundleToFlextResult<O extends MixedSyncOptions> = MixedSyncResult<O, Flext>;


// Functions

// @ts-ignore
export function bundleToFlext<O extends MixedSyncOptions>(fileHandler: BundleToFlextFileHandler<O>, options: O = {}): BundleToFlextResult<O> {

    // If the context is sync

    if (options.sync) {
        const manifest = fileHandler('index.json', 'string');
        console.log('manifest', manifest);
    }


    return new Promise((_resolve, reject) => {
        const fileRequests = [
            fileHandler('index.json', 'string'),
        ];

        Promise.all(fileRequests).then((files) => {
            const [ manifest ] = files;
            console.log('manifest', manifest);
        }).catch(reject);
    }) as MixedSyncResult<O, Flext>;
}

export function getFlextSync(file: ArrayBuffer): Flext {
    const bundle = JSZipSync.load(file);

    return bundleToFlext(() => {
        const container = bundle.file('index.json');
        return container.asText();
    }, { sync: true });
}

export async function getFlext(file: ArrayBuffer): Promise<Flext> {
    const bundle = await JSZip.loadAsync(file);

    return bundleToFlext(async () => {
        const container = bundle.file('index.json');
        return await container.async('string');
    }, { sync: false });
}

// @ts-ignore
export function getBufferSync(file: Flext): ArrayBuffer {

}

// @ts-ignore
export async function getBuffer(file: Flext): Promise<ArrayBuffer> {

}
