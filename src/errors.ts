import { BaseError } from '@flext/core';

export class NotAFlextFileError extends BaseError {
    public name = 'NotAFlextFileError';

    constructor(name: string = 'Flext: The given file is not Flext') {
        super(name);
    }
}
