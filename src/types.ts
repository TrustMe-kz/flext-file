import Flext from '@flext/core';


// Base Data Types

export type Mime =
    | 'application/json'
    | 'application/pdf'
    | 'image/gif'
    | 'image/jpeg'
    | 'image/png'
    | 'image/svg+xml'
    | 'image/webp'
    | 'text/plain';

export type MixedSyncResult<P extends boolean, T = any> = P extends true ? T : Promise<T>;


// Base Interfaces

export interface FlextFileInterface {
    data: Flext,
    readonly buffer: ArrayBuffer,
    readonly blob: Blob,
    setData<P extends boolean = false>(val: Flext | ArrayBuffer, async?: P): MixedSyncResult<P, this>,
    getBuffer(): Promise<ArrayBuffer>,
    getBlob(): Promise<Blob>,
}
