import { NotAFlextFileError } from './errors';
import JSZip, { OutputType } from 'jszip';
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

export type BundleToFlextFileHandler<O extends MixedSyncOptions, T = any> = (filename: string, type: OutputType) => MixedSyncResult<O, T>;

export type BundleToFlextResult<O extends MixedSyncOptions> = MixedSyncResult<O, Flext>;


// Functions

// @ts-ignore
export function bundleToFlext<O extends MixedSyncOptions>(fileHandler: BundleToFlextFileHandler<O>, options: O = {}): BundleToFlextResult<O> {

    // If the context is sync

    if (options.sync) {

        // Getting the manifest

        const manifest = fileHandler('manifest.json', 'string');

        if (!manifest) throw new NotAFlextFileError();
    }


    return new Promise((_resolve, reject) => {

        // Getting the manifest

        fileHandler('manifest.json', 'string').then((manifest) => {

            // Doing some checks

            if (!manifest) throw new NotAFlextFileError();


            // Getting the assets

            console.log('manifest', manifest);

            const fileRequests = [
                fileHandler('template.hbs', 'string'),
            ];

            Promise.all(fileRequests).then((files) => {
                console.log('assets', files);
            }).catch(reject);
        }).catch(reject);
    }) as MixedSyncResult<O, Flext>;
}

export function getFlextSync(file: ArrayBuffer): Flext {
    const bundle = JSZipSync.load(file);

    return bundleToFlext((filename) => {
        const container = bundle.file(filename);
        return container.asText();
    }, { sync: true });
}

export async function getFlext(file: ArrayBuffer): Promise<Flext> {
    const bundle = await JSZip.loadAsync(file);

    return bundleToFlext(async (filename, type) => {
        const container = bundle.file(filename);
        return await container.async(type);
    }, { sync: false });
}

// @ts-ignore
export function getBufferSync(file: Flext): ArrayBuffer {

}

// @ts-ignore
export async function getBuffer(file: Flext): Promise<ArrayBuffer> {

}
