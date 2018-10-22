import { getProp } from './utils/get-prop';

export class ResponseError extends Error {
    public code: number;
    public message: string;
    public response: any;

    constructor(res) {
        super();
        this.name = this.constructor.name;
        this.message = getProp(res.getResponse(), 'error.reason', null);
        this.code = getProp(res.getResponse(), 'error.code', null);
        this.response = res;
    }

    public getCode(): number {
        return this.code;
    }

    public getMessage(): string {
        return this.message;
    }

    public getResponse(): any {
        return this.response;
    }
}

export class PluginError extends ResponseError {
    private handle: any;

    constructor(res, handle) {
        super(res);
        this.message = getProp(
            res.getResponse(),
            'plugindata.data.error',
            null
        );
        this.code = getProp(
            res.getResponse(),
            'plugindata.data.error_code',
            null
        );
        this.handle = handle;
    }

    public getHandle(): any {
        return this.handle;
    }
}

/**
 * @class
 */
export class RequestTimeoutError extends Error {
    public request: any;

    constructor(req) {
        super();
        this.name = this.constructor.name;
        this.message = 'Request timeout';
        this.request = req;
    }
}
