import { Obj, Mime } from '@/types';
import { BaseError, NotAFlextFileError } from '@/errors';
import JSZip, { OutputType } from 'jszip';
import JSZipSync from 'jszip-sync';
import Flext from '@trustme24/flext';


// Third-parties

// const zip = new JSZip();


// Types

export type MixedSyncResult<P extends boolean, T = any> = P extends true ? T : Promise<T>;

export type BundleToFlextFileHandler<P extends boolean, T = any> = (filename: string, type: OutputType) => MixedSyncResult<P, T>;

export type BundleToFlextData = {
    version: string,
    template: string,
    assets: Obj<Blob>,
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

export function mime(file: File): Mime | null {
    const [ _name, ...extensions ] = file?.name?.split('.') ?? [];
    const extension = extensions?.join('.') || '';

    switch (extension) {
        case 'json':
            return 'application/json';

        case 'pdf':
            return 'application/pdf';

        case 'gif':
            return 'image/gif';

        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';

        case 'png':
            return 'image/png';

        case 'svg':
            return 'image/svg+xml';

        case 'webp':
            return 'image/webp';

        case 'txt':
            return 'text/plain';

        default:
            return null;
    }
}

export function shortFilename(filename: string): string {
    const items = filename?.split('/') ?? [];
    return items[items.length] || filename;
}

export function ensureFilename(val: string): string {
    let result = val;


    // Getting the filename

    if (result.startsWith('/'))
        result = result.slice(1);

    if (result.endsWith('/'))
        result = result.slice(0, -1);


    return result;
}

export function manifestToBundleData(val: string, fileHandler: BundleToFlextFileHandler<true>, sync: true): BundleToFlextData;
export function manifestToBundleData(val: string, fileHandler: BundleToFlextFileHandler<false>, sync?: false): Promise<BundleToFlextData>;
export function manifestToBundleData<P extends boolean>(val: string, fileHandler: BundleToFlextFileHandler<P>, sync: P = false as P): MixedSyncResult<P, BundleToFlextData> {

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

        const assets: Obj<Blob> = {};

        for (const assetName in assetsObj) {
            if (!has(assetsObj, assetName)) continue;

            const assetFilename = assetsObj[assetName];
            const assetShortFilename = shortFilename(assetFilename);
            const assetBlob = fileHandler(ensureFilename(assetFilename), 'blob');
            const assetMime = mime(new File([ assetBlob ], assetShortFilename));

            assets[assetName] = new Blob([ assetBlob ], { type: assetMime })
        }


        return {
            version,
            template,
            assets,
        } as MixedSyncResult<P, BundleToFlextData>;
    }


    return new Promise((resolve, reject) => {

        // Making a requests

        const templateRequest = fileHandler(ensureFilename(templateFilename), 'string');
        const assetNames: string[] = [];
        const assetShortFilenames: string[] = [];
        const assetFileRequests: Promise<Blob>[] = [];

        for (const assetName in assetsObj) {
            if (!has(assetsObj, assetName)) continue;


            // Getting the asset filename

            const assetFilename = assetsObj[assetName];
            const assetShortFilename = shortFilename(assetFilename);


            // Making a requests

            assetNames.push(assetName);
            assetShortFilenames.push(assetShortFilename);
            assetFileRequests.push(fileHandler(ensureFilename(assetFilename), 'blob'));
        }


        // Parsing the response

        templateRequest.then((template: string) => {
            Promise.all(assetFileRequests).then((assetFiles: Blob[]) => {

                // Getting the assets

                const assets: Obj<Blob> = {};

                for (const [ i, assetBlob ] of assetFiles.entries()) {
                    const assetName = assetNames[i] ?? null;
                    const assetShortFilename = assetShortFilenames[i] ?? null;
                    const assetMime = mime(new File([ assetBlob ], assetShortFilename));


                    // Doing some checks

                    if (!assetName)
                        throw new BaseError('Flext: Unable to get asset: The asset name is out of range');

                    if (!assetShortFilename)
                        throw new BaseError('Flext: Unable to get asset: The asset filename is out of range');


                    assets[assetName] = new Blob([ assetBlob ], { type: assetMime });
                }


                resolve({
                    version,
                    template,
                    assets,
                });
            }).catch(reject);
        }).catch(reject);
    }) as MixedSyncResult<P, BundleToFlextData>;
}

export function bundleToFlext(fileHandler: BundleToFlextFileHandler<true>, sync: true): Flext;
export function bundleToFlext(fileHandler: BundleToFlextFileHandler<false>, sync?: false): Promise<Flext>;
export function bundleToFlext<P extends boolean>(fileHandler: BundleToFlextFileHandler<P>, sync: P = false as P): MixedSyncResult<P, Flext> {

    // If the context is sync

    if (sync) {

        // Getting the manifest

        const manifest = fileHandler('manifest.json', 'string');

        if (!manifest) throw new NotAFlextFileError();


        // Getting the manifest

        const data = manifestToBundleData(manifest, fileHandler as BundleToFlextFileHandler<true>, true);

        return new Flext().setTemplate(data?.template || '').setAssets(data?.assets ?? {}) as MixedSyncResult<P, Flext>;
    }


    return new Promise((resolve, reject) => {

        // Getting the manifest

        fileHandler('manifest.json', 'string').then((manifest) => {

            // Doing some checks

            if (!manifest) throw new NotAFlextFileError();


            // Getting the manifest

            manifestToBundleData(manifest, fileHandler as BundleToFlextFileHandler<false>).then(data => {
                resolve(new Flext().setTemplate(data?.template || '').setAssets(data?.assets ?? {}));
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
export function getBufferSync(flext: Flext): ArrayBuffer {

}

// @ts-ignore
export async function getBuffer(flext: Flext): Promise<ArrayBuffer> {

}
