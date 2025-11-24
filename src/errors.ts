
// Base Errors

export class BaseThrowable extends Error {
    public name = 'BaseThrowable';

    constructor(name: string, stack?: string|null) {
        super(name);
        if (stack) this.stack = stack;
    }
}

export class BaseError extends BaseThrowable {
    public name = 'BaseError';
}


// Specific Errors

export class NotAFlextFileError extends BaseError {
    public name = 'NotAFlextFileError';

    constructor(name: string = 'Flext: The given file is not Flext') {
        super(name);
    }
}
