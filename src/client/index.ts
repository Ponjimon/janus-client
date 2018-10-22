import * as WebSocket from 'ws';
import { EventEmitter } from 'events';
import * as DebugLogger from 'debug-logger';
import { Session } from '../session';
import { ClientResponse } from './response';
import { Transaction } from '../transaction';
import { JanusEvents } from '../constants';
import { ResponseError } from '../errors';

const logger = DebugLogger('janus:client');

export enum ConnectionState {
    connected = 'connected',
    disconnected = 'disconnected',
}

export const ClientEvent = {
    connected: 'connected',
    disconnected: 'disconnected',
    object: 'object',
    error: 'error',
    timeout: 'timeout',
    event: 'event',
};

export const WebSocketEvent = {
    open: 'open',
    message: 'message',
    error: 'error',
    close: 'close',
};

export class ConnectionStateError extends Error {
    public client: any; // TODO: make not any
    public state: any; // TODO: make not any

    constructor(client) {
        super();
        this.name = this.constructor.name;
        this.message = 'Wrong connection state';
        this.client = client;
        this.state = client.getConnectionState();
    }
}

export class Client {
    public url: string;
    public logger: any;
    public requestTimeout: number;
    public protocol: string;
    public webSocket: any;
    public emitter: EventEmitter;
    public transactions: any;
    public connectionTimeoutTimer: any;
    public connectionTimeout: number;
    public lastConnectionEvent: any;
    public sessions: any;
    public hasInfo: boolean;
    public info: any;
    public reconnect: boolean;
    public token: string | null;
    public apiSecret: string | null;

    constructor(options) {
        options = options || {};
        this.url = options.url || 'ws://localhost:8188';
        this.logger = options.logger || logger;
        this.requestTimeout = options.requestTimeout || 6000;
        this.protocol = 'janus-protocol';
        this.webSocket = null;
        this.emitter = new EventEmitter();
        this.transactions = {};
        this.connectionTimeoutTimer = null;
        this.connectionTimeout = options.connectionTimeout || 40000;
        this.lastConnectionEvent = ClientEvent.disconnected;
        this.sessions = {};
        this.hasInfo = false;
        this.info = {};
        this.reconnect =
            typeof options.reconnect === 'boolean' ? options.reconnect : true;
        this.token = options.token || null;
        this.apiSecret = options.apiSecret || null;
    }

    public getVersion(): string {
        return this.hasInfo ? this.info.version_string : '';
    }

    public isConnected(): boolean {
        return (
            typeof this.webSocket === 'object' &&
            this.webSocket.readyState === 1
        );
    }

    public connect(): void {
        if (this.webSocket === null) {
            this.webSocket = new WebSocket(this.url, this.protocol);
            this.webSocket.on(WebSocketEvent.open, () => {
                this.open();
            });
            this.webSocket.on(WebSocketEvent.close, () => {
                this.close();
            });
            this.webSocket.on(WebSocketEvent.message, message => {
                this.message(message);
            });
            this.webSocket.on(WebSocketEvent.error, err => {
                this.error(err);
            });
            this.startConnectionTimeout();
        }
    }

    public disconnect(): void {
        this.close();
    }

    public open(): void {
        if (
            this.isConnected() &&
            this.lastConnectionEvent === ClientEvent.disconnected
        ) {
            this.lastConnectionEvent = ClientEvent.connected;
            this.getInfo()
                .then(info => {
                    this.info = info.getResponse();
                    this.emitter.emit(ClientEvent.connected);
                })
                .catch(err => {
                    this.error(err);
                });
        }
    }

    public close(options?): void {
        const connect = Object.hasOwnProperty('connect')
            ? options.connect
            : false;
        const closeHandler = () => {
            this.stopConnectionTimeout();
            if (this.webSocket !== null) {
                this.webSocket.removeAllListeners(WebSocketEvent.open);
                this.webSocket.removeAllListeners(WebSocketEvent.message);
                this.webSocket.removeAllListeners(WebSocketEvent.error);
                this.webSocket.removeAllListeners(WebSocketEvent.close);
                this.webSocket = null;
            }
            if (this.lastConnectionEvent === ClientEvent.connected) {
                this.lastConnectionEvent = ClientEvent.disconnected;
                this.emitter.emit(ClientEvent.disconnected);
            }
            if (connect === true) {
                this.connect();
            }
        };
        if (typeof this.webSocket === 'object' && this.isConnected()) {
            this.webSocket.removeAllListeners('close');
            this.webSocket.on('close', () => {
                closeHandler();
            });
            this.webSocket.close();
        } else {
            closeHandler();
        }
    }

    public message(message): void {
        this.startConnectionTimeout();
        var parsedMessage = message;
        try {
            if (typeof message === 'string') {
                parsedMessage = JSON.parse(message);
            }
            this.logger.debug('Received message', parsedMessage);
            this.dispatchObject(parsedMessage);
        } catch (err) {
            this.emitter.emit(ClientEvent.error, err);
        }
    }

    public error(err): void {
        this.emitter.emit(ClientEvent.error, err);
    }

    public getConnectionState(): ConnectionState {
        return this.isConnected()
            ? ConnectionState.connected
            : ConnectionState.disconnected;
    }

    public setConnectionTimeout(timeout: number): void {
        this.connectionTimeout = timeout;
        if (this.connectionTimeoutTimer !== null) {
            this.startConnectionTimeout();
        }
    }

    public startConnectionTimeout(): void {
        this.stopConnectionTimeout();
        this.connectionTimeoutTimer = setTimeout(() => {
            this.close({
                connect: this.reconnect,
            });
        }, this.connectionTimeout);
    }

    public stopConnectionTimeout(): void {
        if (this.connectionTimeoutTimer !== null) {
            clearTimeout(this.connectionTimeoutTimer);
        }
    }

    public dispatchObject(obj): void {
        const transactionId = obj.transaction || null;
        let transaction;
        let response;
        if (
            transactionId !== null &&
            this.transactions[transactionId] instanceof Transaction
        ) {
            transaction = this.transactions[obj.transaction];
            response = new ClientResponse(transaction.getRequest(), obj);
            transaction.response(response);
        } else if (transactionId !== null) {
            logger.warn('Rejected response due to none existing session', obj);
        } else {
            this.delegateEvent(obj);
        }
    }

    public delegateEvent(event): void {
        const sessionId = event.session_id || null;
        if (sessionId !== null && this.hasSession(sessionId)) {
            switch (event.janus) {
                case JanusEvents.timeout:
                    this.deleteSession(sessionId);
                    break;
                default:
                    this.sessions[sessionId].event(event);
                    break;
            }
        } else {
            logger.info('Rejected event due to none existing session', event);
        }
    }

    public sendObject(obj): Promise<void> {
        return new Promise((resolve, reject) => {
            if (typeof obj !== 'object') {
                throw new Error('Not an object.');
            }
            if (this.isConnected()) {
                this.webSocket.send(JSON.stringify(obj), err => {
                    if (typeof err === 'object') {
                        reject(err);
                    } else {
                        this.logger.debug('Sent message', obj);
                        resolve();
                    }
                });
            } else {
                throw new ConnectionStateError(this);
            }
        });
    }

    public createTransaction(options): any {
        if (this.token !== null) {
            options.request.token = this.token;
        }
        if (this.apiSecret !== null) {
            options.request.apisecret = this.apiSecret;
        }
        const transaction = new Transaction(options);
        this.transactions[transaction.getId()] = transaction;
        return transaction;
    }

    public request(req, options?): Promise<ClientResponse> {
        return new Promise((resolve, reject) => {
            const ack = options.ack || false;
            const transaction = this.createTransaction({
                request: req,
                client: this,
                ack,
            });
            transaction
                .onResponse(res => {
                    resolve(res);
                })
                .onError(err => {
                    reject(err);
                })
                .onEnd(() => {
                    delete this.transactions[transaction.getId()];
                })
                .start();
        });
    }

    public hasSession(id): boolean {
        return this.sessions[id] instanceof Session;
    }

    public addSession(session): void {
        this.sessions[session.getId()] = session;
    }

    public deleteSession(id): void {
        delete this.sessions[id];
        this.logger.info('Deleted session=%s', id);
        this.logger.info(
            'Sessions count=%s',
            Object.keys(this.sessions).length
        );
    }

    public createSession(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.request({ janus: 'create' })
                .then(res => {
                    if (res.isSuccess()) {
                        const session = new Session(
                            res.getResponse().data.id,
                            this
                        );
                        this.addSession(session);
                        this.logger.info('Created session=%s', session.getId());
                        session.onKeepAlive(result => {
                            if (result) {
                                this.logger.debug(
                                    'KeepAlive session=%s',
                                    session.getId()
                                );
                            } else {
                                this.logger.warn(
                                    'KeepAlive failed session=%s',
                                    session.getId()
                                );
                            }
                        });
                        session.onTimeout(() => {
                            this.logger.info(
                                'Timeout session=%s',
                                session.getId()
                            );
                            this.deleteSession(session.getId());
                        });
                        resolve(session);
                    } else {
                        reject(new ResponseError(res));
                    }
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public destroySession(id): Promise<void> {
        return new Promise((resolve, reject) => {
            this.request({
                janus: 'destroy',
                session_id: id,
            })
                .then(res => {
                    if (res.isSuccess()) {
                        this.deleteSession(id);
                        resolve();
                    } else {
                        reject(new ResponseError(res));
                    }
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public getInfo(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.request({ janus: 'info' })
                .then(res => {
                    if (res.getType() === 'server_info') {
                        this.hasInfo = true;
                        resolve(res);
                    } else {
                        reject(new ResponseError(res));
                    }
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public onConnected(listener): void {
        this.emitter.on(ClientEvent.connected, listener);
    }

    public onDisconnected(listener): void {
        this.emitter.on(ClientEvent.disconnected, listener);
    }

    public onError(listener): void {
        this.emitter.on(ClientEvent.error, listener);
    }

    public onEvent(listener): void {
        this.emitter.on(ClientEvent.event, listener);
    }
}
