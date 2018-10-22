import { getProp } from '../utils/get-prop';

export class ClientResponse {
    public request: any;
    public response: any;

    constructor(req, res) {
        this.request = req;
        this.response = res;
    }

    public getRequest(): any {
        return this.request;
    }

    public getResponse(): any {
        return this.response;
    }

    public getType(): any {
        return getProp(this.response, 'janus', null);
    }

    public getJsep(): any {
        return getProp(this.response, 'jsep', null);
    }

    public isError(): boolean {
        return this.getType() === 'error';
    }

    public isAck(): boolean {
        return this.getType() === 'ack';
    }

    public isSuccess(): boolean {
        return this.getType() === 'success';
    }
}

export class PluginResponse extends ClientResponse {
    constructor(req, res) {
        super(req, res);
    }

    public isError(): boolean {
        return (
            getProp(this.response, 'plugindata.data.error_code', null) !== null
        );
    }

    public getName(): string | null {
        return getProp(this.response, 'plugindata.plugin', null);
    }

    public getData<T>(): T {
        return getProp(this.response, 'plugindata.data', null);
    }
}
