import { EventEmitter } from 'events';
import lodashHas from 'lodash.has';
import { Session } from '../session';
import { Plugin } from './plugin';
import { JanusEvents } from '../constants';
import { PluginError } from '../errors';
import { PluginResponse, ClientResponse } from '../client/response';
import { getProp } from '../utils/get-prop';

export enum ConnectionState {
    connected = 'connected',
    disconnected = 'disconnected',
}

export class PluginHandle {
    public id: string;
    public plugin: Plugin;
    public emitter: EventEmitter;
    public connectionState: ConnectionState;
    public disposed: boolean;

    constructor(options) {
        this.id = options.id;
        this.plugin = options.plugin;
        this.emitter = new EventEmitter();
        this.connectionState = ConnectionState.disconnected;
        this.disposed = false;
    }

    public getId(): string {
        return this.id;
    }

    public getSession(): Session {
        return this.getPlugin().getSession();
    }

    public getPlugin(): Plugin {
        return this.plugin;
    }

    public isConnected(): ConnectionState {
        return this.connectionState;
    }

    public isDisposed(): boolean {
        return this.disposed;
    }

    public detach(): Promise<ClientResponse> {
        return this.request({
            janus: 'detach',
        });
    }

    public hangup(): Promise<ClientResponse> {
        return new Promise((resolve, reject) => {
            if (this.isConnected()) {
                this.request({
                    janus: 'hangup',
                })
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err);
                    });
            } else {
                reject(new Error('Handle not connected'));
            }
        });
    }

    public trickle(candidate): Promise<ClientResponse> {
        return this.request({
            janus: 'trickle',
            candidate,
        });
    }

    public trickleCompleted(): Promise<ClientResponse> {
        return this.request({
            janus: 'trickle',
            candidate: {
                completed: true,
            },
        });
    }

    public event(event): void {
        if (event.janus === JanusEvents.webrtcup) {
            this.connectionState = ConnectionState.connected;
        } else if (event.janus === JanusEvents.hangup) {
            this.connectionState = ConnectionState.disconnected;
        }
        if (lodashHas(JanusEvents, event.janus)) {
            this.emitter.emit(event.janus, event);
        } else {
            this.emitter.emit(JanusEvents.event, event);
        }
    }

    public onWebrtcUp(listener): void {
        this.emitter.addListener(JanusEvents.webrtcup, listener);
    }

    public onMedia(listener): void {
        this.emitter.addListener(JanusEvents.media, listener);
    }

    public onHangup(listener): void {
        this.emitter.addListener(JanusEvents.hangup, listener);
    }

    public onSlowlink(listener): void {
        this.emitter.addListener(JanusEvents.slowlink, listener);
    }

    public onDetached(listener): void {
        this.emitter.addListener(JanusEvents.detached, listener);
    }

    public onEvent(listener): void {
        this.emitter.addListener(JanusEvents.event, listener);
    }

    public request(obj, options?): Promise<ClientResponse> {
        obj.handle_id = this.getId();
        return this.getPlugin()
            .getSession()
            .request(obj, options);
    }

    public requestMessage(body, options?): Promise<PluginResponse> {
        return new Promise((resolve, reject) => {
            options = options || {};
            const jsep = getProp(body, 'jsep', null);
            const req = {
                janus: 'message',
                body,
                jsep: undefined,
            };
            if (jsep !== null) {
                req.jsep = body.jsep;
                delete body.jsep;
            }
            this.request(req, options)
                .then(res => {
                    const pluginResponse = new PluginResponse(
                        res.getRequest(),
                        res.getResponse()
                    );
                    if (pluginResponse.isError()) {
                        reject(new PluginError(res, this));
                    } else {
                        resolve(pluginResponse);
                    }
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public dispose(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.isDisposed()) {
                this.disposed = true;
                this.getPlugin()
                    .destroyHandle(this)
                    .then(() => {
                        resolve();
                    })
                    .catch(err => {
                        reject(err);
                    });
            } else {
                reject(new Error('Already disposed'));
            }
        });
    }
}
