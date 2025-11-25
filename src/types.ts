
// Base Data Types

export type Obj<T = any> = Record<string, T>;

export type Mime =
    | 'application/json'
    | 'application/pdf'
    | 'image/gif'
    | 'image/jpeg'
    | 'image/png'
    | 'image/svg+xml'
    | 'image/webp'
    | 'text/plain';

export type MaybePromise<T = any> = T | Promise<T>;
