import { Obj } from '@/types';
import { BaseError, NotAFlextFileError } from '@/errors';
import JSZip, { OutputType } from 'jszip';
import JSZipSync from 'jszip-sync';
import Flext from '@trustme24/flext';


// Third-parties

// const zip = new JSZip();


// Types

export type MixedSyncResult<P extends boolean, T = any> = P extends true ? T : Promise<T>;

export type BundleToFlextFileHandler<P extends boolean, T = any> = (filename: string, type: OutputType) => MixedSyncResult<P, T>;

export type BundleToFlextManifest = {
    version: string,
    template: string,
    assets: Obj<ArrayBuffer>,
};


// Constants

export const DEFAULT_VERSION = '1.0.alpha1';


// System Functions

export function audit(val: any): string {
    switch (typeof val) {
        case 'string':
            return `'${val}'`;
        case 'object':
            return JSON.stringify(val);
        default:
            return String(val);
    }
}


// Checking Functions

export function has(obj: Obj, key: string): boolean {
    return obj.hasOwnProperty(key);
}


// Framework Functions

export function ensureFilename(val: string): string {
    let result = val;


    // Getting the filename

    if (result.startsWith('/'))
        result = result.slice(1);

    if (result.endsWith('/'))
        result = result.slice(0, -1);


    return result;
}

export function strToManifest(val: string, fileHandler: BundleToFlextFileHandler<true>, sync: true): BundleToFlextManifest;
export function strToManifest(val: string, fileHandler: BundleToFlextFileHandler<false>, sync?: false): Promise<BundleToFlextManifest>;
export function strToManifest<P extends boolean>(val: string, fileHandler: BundleToFlextFileHandler<P>, sync: P = false as P): MixedSyncResult<P, BundleToFlextManifest> {

    // Getting the data

    let newVal: Obj | null = null;

    try { newVal = JSON.parse(val); }
    catch (e: any) { throw new BaseError('Flext: Unable to get manifest: ' + e.message); }


    // Parsing the data

    const version = String(newVal?.v ?? DEFAULT_VERSION);
    const templateFilename = newVal?.template ?? null;
    const assetsObj = newVal?.assets ?? null;

    if (!templateFilename || !assetsObj) throw new NotAFlextFileError();


    // If the context is sync

    if (sync) {

        // Getting the template

        const template = fileHandler(ensureFilename(templateFilename), 'string') as string;

        if (!template) throw new BaseError('Flext: Unable to get template: ' + audit(templateFilename));


        // Getting the assets

        const assets: Obj<ArrayBuffer> = {};

        for (const assetName in assetsObj) {
            if (!has(assetsObj, assetName)) continue;

            const assetFilename = assetsObj[assetName];

            assets[assetName] = fileHandler(ensureFilename(assetFilename), 'arraybuffer') as ArrayBuffer;
        }


        return {
            version,
            template,
            assets,
        } as MixedSyncResult<P, BundleToFlextManifest>;
    }


    return new Promise((resolve, reject) => {

        // Making a requests

        const templateRequest = fileHandler(ensureFilename(templateFilename), 'string');
        const assetNames: string[] = [];
        const assetFileRequests: Promise<ArrayBuffer>[] = [];

        for (const assetName in assetsObj) {
            if (!has(assetsObj, assetName)) continue;


            // Getting the asset filename

            const assetFilename = assetsObj[assetName];


            // Making a request

            assetNames.push(assetName);
            assetFileRequests.push(fileHandler(ensureFilename(assetFilename), 'arraybuffer'));
        }


        // Parsing the response

        templateRequest.then((template: string) => {
            Promise.all(assetFileRequests).then((assetFiles: ArrayBuffer[]) => {

                // Getting the assets

                const assets: Obj<ArrayBuffer> = {};

                for (const [ i, file ] of assetFiles.entries()) {
                    const assetName = assetNames[i] ?? null;

                    if (assetName)
                        assets[assetName] = file;
                    else
                        throw new BaseError('Flext: Unable to get asset: The asset name is out of range');
                }


                resolve({
                    version,
                    template,
                    assets,
                });
            }).catch(reject);
        }).catch(reject);
    }) as MixedSyncResult<P, BundleToFlextManifest>;
}

export function bundleToFlext(fileHandler: BundleToFlextFileHandler<true>, sync: true): Flext;
export function bundleToFlext(fileHandler: BundleToFlextFileHandler<false>, sync?: false): Promise<Flext>;
export function bundleToFlext<P extends boolean>(fileHandler: BundleToFlextFileHandler<P>, sync: P = false as P): MixedSyncResult<P, Flext> {

    // If the context is sync

    if (sync) {

        // Getting the manifest

        const manifestStr = fileHandler('manifest.json', 'string');

        if (!manifestStr) throw new NotAFlextFileError();


        // Getting the manifest

        const manifest = strToManifest(manifestStr, fileHandler as BundleToFlextFileHandler<true>, true);

        console.log('_manifest_', manifest);

        return;
    }


    return new Promise((resolve, reject) => {

        // Getting the manifest

        fileHandler('manifest.json', 'string').then((manifestStr) => {

            // Doing some checks

            if (!manifestStr) throw new NotAFlextFileError();


            // Getting the manifest

            strToManifest(manifestStr, fileHandler as BundleToFlextFileHandler<false>).then(manifest => {
                console.log('_manifest_', manifest);
                // @ts-ignore
                resolve();
            });
        }).catch(reject);
    }) as MixedSyncResult<P, Flext>;
}

export function getFlextSync(file: ArrayBuffer): Flext {
    const bundle = JSZipSync.load(file);

    return bundleToFlext((filename) => {
        const bundleFile = bundle.file(filename);
        return bundleFile.asText();
    }, true);
}

export async function getFlext(file: ArrayBuffer): Promise<Flext> {
    const bundle = await JSZip.loadAsync(file);

    return await bundleToFlext(async (filename, type) => {
        const bundleFile = bundle.file(filename);
        return await bundleFile.async(type);
    });
}

// @ts-ignore
export function getBufferSync(file: Flext): ArrayBuffer {

}

// @ts-ignore
export async function getBuffer(file: Flext): Promise<ArrayBuffer> {

}
