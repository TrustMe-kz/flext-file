import JSZip from 'jszip';
// @ts-ignore
import JSZipSync from 'jszip-sync';
import Flext from '@trustme24/flext';


// Third-parties

// const zip = new JSZip();


// Functions

// @ts-ignore
export function getFlextSync(file: ArrayBuffer): Flext {
    const bundle = JSZipSync.load(file);
    const manifestFile = bundle.file('index.json');
    const manifest = manifestFile.asText();

    console.log('manifest', manifest);
}

// @ts-ignore
export async function getFlext(file: ArrayBuffer): Promise<Flext> {
    const bundle = await JSZip.loadAsync(file);
    const manifestFile = bundle.file('index.json');
    const manifest = await manifestFile.async('string');

    console.log('manifest', manifest);
}

// @ts-ignore
export function getBufferSync(file: Flext): ArrayBuffer {

}

export async function getBuffer(file: Flext): Promise<ArrayBuffer> {
    return getBufferSync(file);
}
