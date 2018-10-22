import * as createId from 'uuid';
import { EventEmitter } from 'events';
import { ResponseError } from './errors';
import { ClientResponse } from './client/response';

export interface TransactionRequest {
    transaction: string;
    janus: any;
}

export interface TransactionOptions {
    request: TransactionRequest;
    client: any;
    timeout?: number;
    ack?: boolean;
}

export const State = {
    new: 'new',
    started: 'started',
    sent: 'sent',
    receiving: 'receiving',
    ended: 'ended',
};

export const Event = {
    response: 'response',
    ack: 'ack',
    end: 'end',
    error: 'error',
};

export class InvalidTransactionState extends Error {
    public state: any;
    public transaction: Transaction;

    constructor(transaction) {
        super();
        this.name = this.constructor.name;
        this.message = 'Invalid transaction state ' + transaction.getState();
        this.state = transaction.getState();
        this.transaction = transaction;
    }
}

export class TransactionTimeoutError extends Error {
    public transaction: Transaction;
    public timeout: number;

    constructor(transaction, timeout) {
        super();
        this.name = this.constructor.name;
        this.message = 'Transaction timeout ' + timeout;
        this.transaction = transaction;
        this.timeout = timeout;
    }
}

export class Transaction {
    public id: string;
    public request: TransactionRequest;
    public client: any;
    public emitter: EventEmitter;
    public state: any;
    public timeoutTimer: NodeJS.Timeout;
    public timeout: number;
    public ack: boolean;
    public ackReceived: boolean;
    public responseReceived: boolean;
    public lateAck: boolean;

    constructor(options: TransactionOptions) {
        this.id = createId();
        this.request = options.request;
        this.client = options.client;
        this.emitter = new EventEmitter();
        this.state = State.new;
        this.timeoutTimer = null;
        this.timeout = options.timeout || 12000;
        this.ack = options.ack || false;
        this.request.transaction = this.id;
        this.ackReceived = false;
        this.responseReceived = false;
        this.lateAck = false;
    }

    public isLateAck(): boolean {
        return this.lateAck;
    }

    public getId(): string {
        return this.id;
    }

    public getRequest(): TransactionRequest {
        return this.request;
    }

    public getState(): any {
        return this.state;
    }

    public start(): Transaction {
        if (this.state === State.new) {
            this.state = State.started;
            this.startTimeout();
            this.client
                .sendObject(this.getRequest())
                .then(() => {
                    this.emitter.emit('sent', this.getRequest());
                })
                .catch(err => {
                    this.error(err);
                });
        } else {
            this.error(new InvalidTransactionState(this));
        }
        return this;
    }

    public response(res: ClientResponse): void {
        if (this.state === State.started || this.state === State.receiving) {
            this.state = State.receiving;
            if (res.isError()) {
                this.error(new ResponseError(res));
            } else if (this.ack === true && res.isAck()) {
                this.ackReceived = true;
                this.emitter.emit(Event.ack, res);
                if (this.responseReceived === true) {
                    this.lateAck = true;
                    this.end();
                } else {
                    this.startTimeout();
                }
            } else {
                this.responseReceived = true;
                this.emitter.emit(Event.response, res);
                if (this.ack === true && this.ackReceived === false) {
                    this.startTimeout();
                } else {
                    this.end();
                }
            }
        } else {
            this.error(new InvalidTransactionState(this));
        }
    }

    public end(): void {
        this.stopTimeout();
        if (this.state !== State.ended) {
            this.state = State.ended;
            this.emitter.emit(Event.end);
        }
    }

    public error(err): void {
        this.end();
        this.emitter.emit(Event.error, err);
    }

    public onSent(listener): Transaction {
        this.emitter.on('sent', listener);
        return this;
    }

    public onAck(listener): Transaction {
        this.emitter.on('ack', listener);
        return this;
    }

    public onResponse(listener): Transaction {
        this.emitter.on(Event.response, listener);
        return this;
    }

    public onEnd(listener): Transaction {
        this.emitter.on(Event.end, listener);
        return this;
    }

    public onError(listener): Transaction {
        this.emitter.on(Event.error, listener);
        return this;
    }

    public getTimeout(): number {
        return this.timeout;
    }

    public startTimeout(): void {
        this.stopTimeout();
        this.timeoutTimer = setTimeout(() => {
            this.error(new TransactionTimeoutError(this, this.getTimeout()));
        }, this.getTimeout());
    }

    public stopTimeout(): void {
        if (this.timeoutTimer !== null) {
            clearTimeout(this.timeoutTimer);
        }
    }
}
